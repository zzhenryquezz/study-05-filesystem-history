import { useFs } from "../utils/fs"
import FVCObject from "./FVCObject"

export interface FVCTreeEntry {
    type: string
    hash: string
    filename: string
}

export default class FVCTree extends FVCObject {
    public type = 'tree'
    public children: FVCObject[]

    constructor(data: string){
        super(data)
    }

    public findFiles(): FVCTreeEntry[] {
        const entries: FVCTreeEntry[] = []

        this.data.slice(this.data.indexOf('\0') + 1).split('\n').filter(Boolean).forEach(item => {
            const [type, hash, filename] = item.split(' ')

            entries.push({ type, filename, hash })
        })

        return entries
    }

    public static async fromEntries(entries: FVCTreeEntry[]){
        let content = 'type:tree;\0'

        entries.forEach(({ type, hash, filename }) => {
            content += `${type} ${hash} ${filename}\n`
        })

        return new FVCTree(content)
    }


}