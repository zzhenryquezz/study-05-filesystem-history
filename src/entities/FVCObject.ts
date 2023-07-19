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

    public content(){
        return this.data.slice(this.data.indexOf('\0') + 1)
    }

    public hash() {
        return crypto.createHash('sha256').update(this.raw()).digest('hex')
    }

    public serialize() {
        return this.raw()
    }
    
    public static deserialize(args: any): any {
        throw new Error('Not implemented')
    }
}