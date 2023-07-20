import { useArgs } from "../utils/args"
import FVCRepository from "../entities/FVCRepository"

import { logger } from "@poppinss/cliui"
import FVCObject from "../entities/FVCObject"
import { useFs } from "../utils/fs"

import fg from 'fast-glob'

export default async function (baseArgs: string[]){

    const { args } = useArgs(baseArgs)

    const fs = useFs()

    if (!args.length) {
        logger.error('You must provide one or more path')
        return
    }

    const repository = await FVCRepository.findRepository()

    const objects = [] as FVCObject[]
    const staged = await repository.findIndexEntries()

    const filenames: string[] = []

    for await (const path of args) {
        const isFolder = await fs.isFolder(path)

        if (!isFolder) {
            filenames.push(path)
            continue
        }

        const children = await fg(fs.resolve(path, '**/*'), { onlyFiles: true })

        children.forEach(child => {
            filenames.push(child.replace(repository.workTree + '/', ''))
        })   
    }

    for await (const path of filenames) {
        const object = await repository.hashObject(path)

        objects.push(object)

        const index = staged.findIndex(entry => entry.filename === path)

        if(index !== -1){
            staged[index].hash = object.hash()
            continue
        }

        staged.push({
            hash: object.hash(),
            filename: path
        })
    }

    const stagedContent = staged.map(entry => `${entry.hash} ${entry.filename}`).join('\n')

    await repository.write('INDEX', stagedContent)
}