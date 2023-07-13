import { useFs } from "../utils/fs"
import FVCObject from "./FVCObject"

export default class FVCBlob extends FVCObject {
    public type = 'blob'

    constructor(public data: string){
        super(data)
    }

    public serialize(){
        return this.data.slice(this.data.indexOf('\0') + 1)
    }
}