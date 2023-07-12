import { promises as fs } from "fs"

export function useFs(){
    async function exists(...path: string[]){
        return fs.stat(path.join('/')).then(() => true).catch(() => false)
    }

    async function mkdir(path: string) {
        await fs.mkdir(path, { recursive: true })
    }

    async function write(path: string, content: any) {

        const folderPath = path.split('/').slice(0, -1).join('/')

        const folderExists = await exists(folderPath)

        if (!folderExists) {
            await mkdir(folderPath)
        }

        await fs.writeFile(path, content)
    }

    return {
        exists,
        mkdir,
        write
    }
}