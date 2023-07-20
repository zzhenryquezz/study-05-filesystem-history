import { useFs } from "../utils/fs"
import FVCObject from "./FVCObject"

export interface FVCTreeEntry {
    type: string
    hash: string
    filename: string
}

export default class FVCTree extends FVCObject {
    public type = 'tree'
    public children: FVCObject[] = []

    constructor(data: string){
        super(data)
    }

    public findFiles(): FVCTreeEntry[] {
        const entries: FVCTreeEntry[] = []

        this.content().split('\n').filter(Boolean).forEach(item => {
            const [type, hash, filename] = item.split(' ')

            entries.push({ type, filename, hash })
        })

        return entries
    }

    public static fromObjects(objects: FVCObject[], filenames: string[]){
        const entries = objects.map((o, i) => ({
            type: o.type,
            hash: o.hash(),
            filename: filenames[i]            
        }))

        return FVCTree.fromEntries(entries)
    }

    public static fromEntries(entries: FVCTreeEntry[]){
        let content = 'type:tree;\0'

        entries.forEach(({ type, hash, filename }) => {
            content += `${type} ${hash} ${filename}\n`
        })

        return new FVCTree(content)
    }


}