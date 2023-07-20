import { useArgs } from "../utils/args"
import FVCRepository from "../entities/FVCRepository"

import { logger } from "@poppinss/cliui"
import FVCCommit from "../entities/FVCCommit"

export default async function (baseArgs: string[]){

    const { flags } = useArgs(baseArgs)

    const message = flags['m']
    const dryRun = flags['dry-run']

    if (!message) {
        logger.error('You must provide a message with, Ex: fvc commit -m "My commit message"')

        return
    }

    const repository = await FVCRepository.findRepository()

    const lastCommit = await repository.findLastCommit()

    const stagedTree = await repository.createStagedTree()

    const commit = FVCCommit.from({
        tree: stagedTree.hash(),
        parent: lastCommit?.hash(),
        message,
    })

    if (dryRun) {

        if (lastCommit) {
            logger.log(logger.colors.yellow(`old: ${lastCommit?.hash()}`))
            logger.log(`tree: ${stagedTree.hash()}\n`)
        }

        logger.log(logger.colors.yellow(`new: ${commit.hash()}`))
        logger.log(`tree: ${commit.tree}`)
        return
    }

    await repository.writeObject(stagedTree)
    await repository.writeObject(commit)

    await repository.write('HEAD', commit.hash())
    await repository.write('INDEX', '')

    logger.success(`Commit ${commit.hash()} created`)

}