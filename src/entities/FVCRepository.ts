import { resolve } from 'path'
import { useFs } from '../utils/fs'
import FVCBlob from './FVCBlob'
import FVCObject from './FVCObject'
import FVCTree from './FVCTree'
import FVCCommit from './FVCCommit'

const fs = useFs()

export default class FVCRepository {
    public workTree: string
    public fvcPath: string

    constructor(workTree: string){
        this.workTree = workTree
        
        this.fvcPath = resolve(workTree, '.fvc')
    }

    public resolve(...path: string[]){
        return resolve(this.fvcPath, ...path)
    }

    public makeFolder(...path: string[]){
        return fs.mkdir(this.resolve(...path))
    }
    
    public makeFile(path: string, content: string){
        return fs.write(this.resolve(path), content)
    }
    
    public write(path: string, content: string){
        return fs.write(this.resolve(path), content)
    }
    
    public read(...path: string[]){
        return fs.read(this.resolve(...path))
    }

    public static async findRepository(path = "."): Promise<FVCRepository> {
        const fullPath = resolve(path)

        const fvcPath = resolve(fullPath, '.fvc')

        const exists = await fs.exists(fvcPath)

        if(exists){
            return new FVCRepository(fullPath)
        }

        const parentPath = resolve(fullPath, '..')

        const isRoot = parentPath === fullPath

        if(isRoot){
            throw new Error('Not a repository')
        }

        return FVCRepository.findRepository(parentPath)
    }

    public async findLastCommit(){
        const head = await this.read('HEAD')

        if(!head){
            return null
        }

        const commit = await this.readObject(head)

        return commit as FVCCommit
    }

    public async findLastTree(){
        const commit = await this.findLastCommit()

        if(!commit){
            return null
        }

        const tree = await this.readObject(commit.tree)

        return tree as FVCTree
    }

    public async createStagedTree(){
        const index = await this.read('INDEX')
        
        const lastTree = await this.findLastTree()
        const children = lastTree?.findFiles() || []

        const stagedFiles = index.split('\n').filter(Boolean)

        for await (const file of stagedFiles) {
            const object = await this.hashAndWriteObject(file)

            const index = children.findIndex(child => child.filename === file)

            if(index !== -1){
                children[index].hash = object.hash()
                continue
            }

            children.push({
                type: object.type,
                hash: object.hash(),
                filename: file
            })
        }

        const tree = FVCTree.fromEntries(children)

        return tree
    }

    public async hashObject(path: string){
        const filePath = resolve(this.workTree, path)

        const isFolder = await fs.isFolder(filePath)

        if (!isFolder) {
            const fileContent = await fs.read(filePath)

            const contents = [`type:blob;`, `\0`, fileContent].join('')

            return new FVCBlob(contents)
        }

        const allFiles = await fs.readDir(filePath)
        const files = allFiles.filter(file => file !== '.fvc')
        
        let contents = 'type:tree;\0'
        const children: FVCObject[] = []

        for await (const file of files) {
            const object = await this.hashObject(resolve(path, file))

            contents += `${object.type} ${object.hash()} ${file}\n`

            children.push(object)
        }

        const tree = new FVCTree(contents)

        tree.children = children

        return tree

    }

    public async hashAndWriteObject(path: string){
        const object = await this.hashObject(path)

        if (object instanceof FVCTree) {
            await Promise.all(object.children.map(async o => this.writeObject(o)))
        }

        await this.writeObject(object)

        return object

    }

    public async readObject(hash: string) {
        const begin = hash.slice(0, 2)
        const end = hash.slice(2)

        const folder = this.resolve('objects', begin)

        const all = await fs.readDir(folder)

        let search = all.find(filename => filename.startsWith(end))
    
        if(!search){
            throw new Error('Object not found')
        }
    
        const filename = this.resolve('objects', begin, search)

        const bytes = await fs.read(filename)

        const object = new FVCObject(bytes)

        if(object.type === 'blob'){
            return new FVCBlob(bytes)
        }

        if(object.type === 'tree'){
            return new FVCTree(bytes)
        }

        if(object.type === 'commit'){
            return new FVCCommit(bytes)
        }

        return object
    }

    public async writeObject(object: FVCObject){
        const hash = object.hash()

        const begin = hash.slice(0, 2)
        const end = hash.slice(2)

        const filename = this.resolve('objects', begin, end)

        await fs.write(filename, object.raw())
    }
}