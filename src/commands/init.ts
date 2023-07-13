import { resolve } from "path"
import { useFs } from "../utils/fs"
import FVCRepository from "../entities/FVCRepository"


export default async function (){
    const fs = useFs()

    const folderPath = resolve(process.cwd())

    const folderExists = await fs.exists(folderPath)

    if (!folderExists) {
        console.error('The path provided does not exist')
        return
    }

    // files version control | fvc

    const fvcFolderPath = resolve(folderPath, '.fvc')

    const fvcFolderExists = await fs.exists(fvcFolderPath)

    if (fvcFolderExists) {
        console.error('This folder is already under version control')
        return
    }

    // events database

    const repository = new FVCRepository(folderPath)

    // folders
    await repository.makeFolder('objects')

    console.log('Initialized empty FVC repository in', folderPath)
}