import FVCRepository from "../entities/FVCRepository"
import fg from 'fast-glob'
import { useArgs } from "../utils/args"
import { useFs } from "../utils/fs"
import { logger } from "@poppinss/cliui"
import FVCTree from "../entities/FVCTree"

export default async function (baseArgs: string[]){

    const { args } = useArgs(baseArgs)

    const fs = useFs()

    if (!args.length) {
        logger.error('You must provide one or more path')
        return
    }

    const repository = await FVCRepository.findRepository()
    const filenames: string[] = []
    const commit = await repository.findLastCommit()

    if (!commit) {
        logger.error('No previous commit')
        return
    }

    const tree = await repository.readObject(commit.tree) as FVCTree

    const entries = await repository.findAllTreeEntries(tree)

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
        const entry = entries.find(entry => entry.filename === path)

        if (!entry) continue

        if (entry.type !== 'blob') continue

        const object = await repository.readObject(entry.hash)

        await fs.write(fs.resolve(repository.workTree, path), object.content())
    }

}