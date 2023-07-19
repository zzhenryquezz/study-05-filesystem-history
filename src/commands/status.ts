import { useArgs } from "../utils/args"
import FVCRepository from "../entities/FVCRepository"
import FVCTree from "../entities/FVCTree"
import { diffChars } from "diff"

import { logger, sticker } from "@poppinss/cliui"

export default async function (baseArgs: string[]){

    const { args, flags } = useArgs(baseArgs)

    const repository = await FVCRepository.findRepository()
    
    const staged = await repository.read('INDEX')

    const stagedFiles = staged.split('\n').filter(Boolean)

    const currentTree = await repository.hashObject('.')

    // diff
    const output = sticker()
    
    if (stagedFiles.length) {
        output
            .add('STAGED FILES')
            .add('')
    
        stagedFiles.forEach(filename => output.add(logger.colors.green(`${filename}`)))
    }

    const diff = diffChars('', currentTree.serialize())

    const files = diff
        .filter(part => part.added || part.removed)
        .map(part => (part.value.split(' ').at(-1) || '').trim())
        .filter(f => !stagedFiles.includes(f))

    if (files.length) {

        if (stagedFiles.length) output.add('')
        
        output
            .add('UNTRACKED FILES')
            .add('')

        files.forEach(f => output.add(logger.colors.yellow(f)))
    }
        
    output.render()

}