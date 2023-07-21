import FVCRepository from "../entities/FVCRepository"
import { useArgs } from "../utils/args"
import { useFs } from "../utils/fs"
import { logger } from "@poppinss/cliui"
import FVCTree from "../entities/FVCTree"
import FVCCommit from "../entities/FVCCommit"

export default async function (baseArgs: string[]){

    const { args } = useArgs(baseArgs)

    const fs = useFs()

    const hash = args[0]

    if (!hash) {
        logger.error('You must provide a commit hash')
        return
    }

    const repository = await FVCRepository.findRepository()

    const object = await repository.readObject(hash)

    if (object instanceof FVCCommit) {
        const tree = await repository.readObject(object.tree) as FVCTree
        const entries = await repository.findAllTreeEntries(tree)

        for await (const entry of entries) {
            if (entry.type !== 'blob') continue

            const object = await repository.readObject(entry.hash)

            await fs.write(fs.resolve(repository.workTree, entry.filename), object.content())
        }
        
        return
    }

    logger.error('Only commits are supported for now')
    
    
    // const filenames = await fs.findAllFilesFromPaths(args)

    // for await (const path of filenames) {
    //     const entry = entries.find(entry => entry.filename === path)

    //     if (!entry) continue

    //     if (entry.type !== 'blob') continue

    //     const object = await repository.readObject(entry.hash)

    //     await fs.write(fs.resolve(repository.workTree, path), object.content())
    // }

}