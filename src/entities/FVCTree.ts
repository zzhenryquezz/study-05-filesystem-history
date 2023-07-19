import { useFs } from "../utils/fs"
import FVCObject from "./FVCObject"

export default class FVCTree extends FVCObject {
    public type = 'tree'
    public children: FVCObject[]

    constructor(data: string, children: FVCObject[] = []){
        super(data)

        this.children = children
    }

    public serialize(){
        return this.data.slice(this.data.indexOf('\0') + 1)
    }
}