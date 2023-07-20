import { resolve, join, dirname, basename } from 'path'
import { useFs } from '../utils/fs'
import FVCBlob from './FVCBlob'
import FVCObject from './FVCObject'
import FVCTree, { FVCTreeEntry } from './FVCTree'
import FVCCommit from './FVCCommit'
import { IObjectRepository } from '../repositories/IObjectRepository'
import { ObjectRepository } from '../repositories/implementations/ObjectRepository'

const fs = useFs()

export default class FVCRepository {
    public workTree: string
    public fvcPath: string

    public readonly objectRepository: IObjectRepository

    constructor(workTree: string, objectRepository?: IObjectRepository){
        this.workTree = workTree
        
        this.fvcPath = resolve(workTree, '.fvc')

        this.objectRepository = objectRepository || new ObjectRepository(this.resolve('objects'))
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

    public async findHistory(path?: string){
        const commits = [] as FVCCommit[]

        const lastCommit = await this.findLastCommit()

        if(!lastCommit) return commits

        let hash = lastCommit.hash()

        while (hash) {
            const commit = await this.readObject(hash) as FVCCommit

            if (!path) {
                commits.push(commit)
    
                hash = commit.parent

                continue
            }

            const tree = await this.readObject(commit.tree) as FVCTree

            const files = tree.findFiles()

            const exists = files.find(file => file.filename === path)

            if(exists) commits.push(commit)

            hash = commit.parent

        }

        return commits
    }

    public async findAllTreeEntries(tree: FVCTree, parent?: string){
        const entries = tree.findFiles()

        for (const entry of entries) {
            if (entry.type !== 'tree') {
                continue
            }

            const childTree = await this.readObject(entry.hash) as FVCTree

            const childEntries = await this.findAllTreeEntries(childTree, entry.filename)

            childEntries.forEach(child => {
                const exists = entries.some(e => e.filename === child.filename && e.hash === child.hash)

                if (!exists) {
                    entries.push(child)
                }
            })
        }

        if (parent) {
            entries.forEach(entry => {
                entry.filename = join(parent, entry.filename)
            })
        }

        return entries

    }

    public async findIndexEntries(){
        const index = await this.read('INDEX')

        const entries = index.split('\n').filter(Boolean).map(line => {
            const [hash, filename] = line.split(' ')

            return { hash, filename }
        })

        return entries
    }

    public createTreeFromEntries(entries: FVCTreeEntry[], parent = '.'){

        const folderFilenames = entries.filter(e => e.filename.includes('/')).map(e => dirname(e.filename))

        // fix tree not added
        for (const folder of folderFilenames) {
            const exists = entries.find(e => e.filename === folder)

            if(exists) continue

            const children = entries.filter(e => dirname(e.filename) === folder)

            const tree = FVCTree.fromEntries(children)

            entries.push({
                type: 'tree',
                hash: tree.hash(),
                filename: folder,
            })
        }

        const treeEntries = [] as FVCTreeEntry[]
        const treeChildren = [] as FVCObject[]

        const rootEntries = entries.filter(entry => dirname(entry.filename) === parent)

        for (const entry of rootEntries) {
            if (entry.type !== 'tree') {
                treeEntries.push(entry)
                continue
            }

            const children = entries.filter(child =>  dirname(child.filename) === entry.filename)

            const tree = this.createTreeFromEntries(children, entry.filename)

            treeChildren.push(tree)

            treeEntries.push({
                type: 'tree',
                hash: tree.hash(),
                filename: entry.filename,
            })
        }

        return FVCTree.fromEntries(treeEntries)

    }

    public async createStagedTree(){        
        const headTree = await this.findLastTree()

        const stagedEntries = await this.findIndexEntries()
        
        const entries = [] as FVCTreeEntry[]

        // add entries from last commit
        if (headTree) {
            const headEntries = await this.findAllTreeEntries(headTree)

            entries.push(...headEntries)
        }

        // add entries from staged
        for (const staged of stagedEntries) {

            const index = entries.findIndex(e => e.filename === staged.filename)

            if(index !== -1){
                entries[index].hash = staged.hash
                continue
            }

            entries.push({
                type: 'blob',
                hash: staged.hash,
                filename: staged.filename
            })
        }

        const folders = entries
            .filter(e => e.filename.includes('/'))
            .map(e => dirname(e.filename))
            .filter((value, index, self) => self.indexOf(value) === index)

        folders.sort((a, b) => b.split('/').length - a.split('/').length)

        // add folders 
        for await (const folder of folders) {

            const childrenEntries = entries.filter(e => dirname(e.filename) === folder).map(e => ({
                type: e.type,
                hash: e.hash,
                filename: basename(e.filename)
            }))

            const tree = FVCTree.fromEntries(childrenEntries)

            await this.writeObject(tree)

            const index = entries.findIndex(e => e.filename === folder)

            if(index !== -1){
                entries[index].hash = tree.hash()
                continue
            }

            entries.push({
                type: 'tree',
                hash: tree.hash(),
                filename: folder,
            })
        }

                

        const rootEntries = entries.filter(entry => dirname(entry.filename) === '.')

        const stagedTree = FVCTree.fromEntries(rootEntries)

        await this.writeObject(stagedTree)

        return stagedTree

    }

    public async createObject(path: string){
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

    public async hashObject(path: string){
        const object = await this.createObject(path)

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