import { useFs } from "../utils/fs"
import FVCObject from "./FVCObject"

export default class FVCTree extends FVCObject {
    public type = 'tree'

    constructor(data: string){
        super(data)
    }

    public serialize(){
        return this.data.slice(this.data.indexOf('\0') + 1)
    }
}