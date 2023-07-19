import FVCObject from "./FVCObject"

export default class FVCCommit extends FVCObject {
    public type = 'commit'
    public tree = ''
    public parent = ''
    public timestamp = ''
    public message = ''

    constructor(public data: string){
        super(data)

        const lines = this.content().split('\n').filter(Boolean)

        lines.slice(0, 3)
            .map(item => item.split(':'))
            .forEach(([key, value]) => (this[key] = value))

        this.message = lines[3] || ''
    }

    public static from(data: Partial<FVCCommit>){

        let content = 'type:commit;\0'

        content += `tree:${data.tree || '' }\n`
        content += `parent:${data.parent || ''}\n`
        content += `timestamp:${data.timestamp || Date.now()}\n`
        content += `${data.message || ''}\n`

        return new FVCCommit(content)
    }
    
}