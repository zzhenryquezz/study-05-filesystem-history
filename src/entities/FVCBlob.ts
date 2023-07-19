import { useFs } from "../utils/fs"
import FVCObject from "./FVCObject"

export default class FVCBlob extends FVCObject {
    public type = 'blob'

    constructor(public data: string){
        super(data)
    }
}