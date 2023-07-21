import FVCRepository from "../entities/FVCRepository"
import { useArgs } from "../utils/args"
import { useFs } from "../utils/fs"
import { logger } from "@poppinss/cliui"
import FVCTree from "../entities/FVCTree"
import FVCCommit from "../entities/FVCCommit"

export default async function (baseArgs: string[]){

    const { args } = useArgs(baseArgs)

    const fs = useFs()

    if (!args.length) {
        logger.error('You must provide one or more filenames')
        return
    }

    const repository = await FVCRepository.findRepository()
    
    const commit = await repository.findLastCommit() as FVCCommit    
    const tree = await repository.readObject(commit.tree) as FVCTree
    
    const entries = await repository.findAllTreeEntries(tree)
    const filenames = await fs.findAllFilesFromPaths(args)

    for await (const path of filenames) {
        const entry = entries.find(entry => entry.filename === path)

        if (!entry) continue

        if (entry.type !== 'blob') continue

        const object = await repository.readObject(entry.hash)

        await fs.write(fs.resolve(repository.workTree, path), object.content())
    }

}