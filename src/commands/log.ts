import FVCRepository from "../entities/FVCRepository"
import { logger } from "@poppinss/cliui"
import { useArgs } from "../utils/args"

export default async function (baseArgs: string[]){

    const { args } = useArgs(baseArgs)

    const path = args[0]

    const repository = await FVCRepository.findRepository()
    
    const history = await repository.findHistory(path)
    
    if (!history.length) {
        logger.error('No commits yet')
        return
    }

    history.forEach(commit => {
        console.log(logger.colors.yellow(`commit ${commit.hash()}`))
        console.log(`Date: ${new Date(Number(commit.timestamp))}`)
        console.log(`\n\t${commit.message}`)
    })
}