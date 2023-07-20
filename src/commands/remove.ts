import { useArgs } from "../utils/args"
import FVCRepository from "../entities/FVCRepository"

import { logger } from "@poppinss/cliui"

export default async function (baseArgs: string[]){

    const { args } = useArgs(baseArgs)

    const path = args[0]

    if (!path) {
        logger.error('You must provide a path')
        return
    }

    const repository = await FVCRepository.findRepository()
    
    const staged = await repository.read('INDEX')

    const stagedFiles = staged.split('\n').filter(Boolean)

    const content = stagedFiles
        .filter(f => !f.includes(path))
        .filter((value, index, self) => self.indexOf(value) === index).join('\n')

    await repository.makeFile('INDEX', content)


}