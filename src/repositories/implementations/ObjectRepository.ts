import { IObjectRepository } from "../IObjectRepository";
import { join } from "path";
import { useFs } from "../../utils/fs";
import { createHash } from 'crypto'

const fs = useFs()

export class ObjectRepository implements IObjectRepository {
    
    constructor(
        private readonly folderPath: string,
    ){}

    private resolve(...path: string[]){
        return join(this.folderPath, ...path)
    }

    public async find(hash: string): Promise<string | null> {
        const begin = hash.slice(0, 2)
        const end = hash.slice(2)

        const folder = this.resolve(this.folderPath, begin)

        const exists = await fs.exists(folder)

        if(!exists) return null

        const all = await fs.readDir(folder)

        let search = all.find(f => f.startsWith(end))

        if(!search) return null

        const filename = this.resolve(begin, search)

        const content = fs.read(filename)

        return content
    }

    public create: IObjectRepository['create'] = async (object) => {
        const hash = object.hash()

        const begin = hash.slice(0, 2)
        const end = hash.slice(2)

        await fs.write(this.resolve(this.folderPath, begin, end), object.raw())
    }

    public destroy: IObjectRepository['destroy'] = async (object) => {
        const hash = object.hash()
        
        const begin = hash.slice(0, 2)
        const end = hash.slice(2)

        await fs.rm(this.resolve(this.folderPath, begin, end))
    }
}