import { useArgs } from "../utils/args"
import FVCRepository from "../entities/FVCRepository"
import { logger } from "@poppinss/cliui"
import FVCCommit from "../entities/FVCCommit"

export default async function (baseArgs: string[]){

    const repository = await FVCRepository.findRepository()

    const lastCommit = await repository.findLastCommit()


    if (!lastCommit) {
        logger.error('No commits yet')
        return
    }

    const allCommits = [lastCommit]

    let hash = lastCommit.parent

    while (hash) {
        const commit = await repository.readObject(hash) as FVCCommit

        allCommits.push(commit)

        hash = commit.parent
    }

    allCommits.forEach(commit => {
        console.log(logger.colors.yellow(`commit ${commit.hash()}`))
        console.log(`Date: ${new Date(Number(commit.timestamp))}`)
        console.log(`\n\t${commit.message}`)
    })


}