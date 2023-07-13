import { useArgs } from "../utils/args"
import { useFs } from "../utils/fs"
import FVCRepository from "../entities/FVCRepository"
import FVCBlob from "../entities/FVCBlob"


export default async function (baseArgs: string[]){
    const fs = useFs()

    const { args } = useArgs(baseArgs)

    const path = args[0]

    if (!path) {
        console.error('You must provide a path')
        return
    }

    const filePath = fs.resolve(path)

    const repository = await FVCRepository.findRepository(filePath)

    if(!repository){
        console.error('Not a repository')
        return
    }

    const result = await repository.hashObject(path)

    // const fileContent = await fs.read(filePath)
    
    // const contents = [`type:blob;`, `\0`, fileContent].join('')
    
    // const object = new FVCBlob(contents)

    // await repository.writeObject(object)
}