import FVCObject from "../entities/FVCObject"

export interface IObjectRepository {
    find(hash: string): Promise<string | null>
    create(object: FVCObject): Promise<void>
    destroy(object: FVCObject): Promise<void>
}