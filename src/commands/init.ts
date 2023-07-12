import { resolve } from "path"
import { useArgs } from "../utils/args"
import { useFs } from "../utils/fs"
import FVCRepository from "../entities/FVCRepository"


export default async function (baseArgs: string[]){


    const fs = useFs()
    const { args } = useArgs(baseArgs)
    const path = args[0]

    if (!path) {
        console.error('You must provide a path to init')
        return
    }

    const folderPath = resolve(process.cwd(), args[0])

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
    await repository.makeFolder('branches')
    await repository.makeFolder('objects')
    await repository.makeFolder('refs', "tags")

    // files
    await repository.makeFile('description', 'Unnamed repository; edit this file \'description\' to name the repository.\n')
    await repository.makeFile('HEAD', 'ref: refs/heads/main\n')
    await repository.makeFile('config', [
        '[core]',
        '\trepositoryformatversion = 0',
        '\tfilemode = true',
        '\tbare = false',
    ].join('\n') + '\n')

    console.log('Initialized empty FVC repository in', folderPath)
}