import { resolve } from 'path'
import { useFs } from '../utils/fs'

const fs = useFs()

export default class FVCRepository {
    public path: string
    public fvcPath: string

    constructor(path: string){
        this.path = path
        
        this.fvcPath = resolve(path, '.fvc')
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

    public static async findRepository(path = ".", required = true){
        const fullPath = resolve(path)

        const fvcPath = resolve(fullPath, '.fvc')

        const exists = await fs.exists(fvcPath)

        if(exists){
            return new FVCRepository(fullPath)
        }

        const parentPath = resolve(fullPath, '..')

        const isRoot = parentPath === fullPath

        if(isRoot && required){
            throw new Error('Not a repository')
        }

        if(isRoot && !required){
            return null
        }

        return FVCRepository.findRepository(parentPath)
    }
}