import { useArgs } from "../utils/args"
import FVCRepository from "../entities/FVCRepository"

import { logger } from "@poppinss/cliui"
import FVCCommit from "../entities/FVCCommit"
import FVCTree from "../entities/FVCTree"

export default async function (baseArgs: string[]){

    const { flags } = useArgs(baseArgs)

    const message = flags['m']

    if (!message) {
        logger.error('You must provide a message with, Ex: fvc commit -m "My commit message"')

        return
    }

    const repository = await FVCRepository.findRepository()

    const lastCommit = await repository.findLastCommit()

    const currentTree = await repository.hashObject('.') as FVCTree

    const stagedTree = await repository.createStagedTree()

    const commit = FVCCommit.from({
        tree: stagedTree.hash(),
        parent: lastCommit?.hash(),
        message,
    })

    await repository.writeObject(stagedTree)
    await repository.writeObject(commit)

    await repository.write('HEAD', commit.hash())
    await repository.write('INDEX', '')

    logger.success(`Commit ${commit.hash()} created`)

}