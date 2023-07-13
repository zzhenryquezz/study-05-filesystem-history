import crypto from 'crypto'

export default class FVCObject {
    public type: string = 'unknown'

    public head = new Map<string, string>()

    constructor(public data: string){
        data.slice(0, data.indexOf('\0')).split(';').filter(Boolean).forEach(item => {
            const [key, value] = item.split(':')
            
            this.head.set(key, value)
        })

        this.type = this.head.get('type') || 'unknown'
    }

    public raw() {
        return this.data
    }

    public hash() {
        return crypto.createHash('sha256').update(this.raw()).digest('hex')
    }

    public serialize(): any {
        return this.data
    }
    
    public static deserialize(args: any): any {
        throw new Error('Not implemented')
    }
}