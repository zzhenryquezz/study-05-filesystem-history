import { useArgs } from "../utils/args"
import FVCRepository from "../entities/FVCRepository"
import FVCTree from "../entities/FVCTree"

import { logger } from "@poppinss/cliui"

export default async function (baseArgs: string[]){

    const repository = await FVCRepository.findRepository()
    
    const staged = await repository.read('INDEX')

    const stagedFiles = staged.split('\n').filter(Boolean)

    const currentTree = await repository.hashObject('.') as FVCTree

    const lastTree = await repository.findLastTree()

    const lastTreeChildren = lastTree?.findFiles() || []
    const currentTreeChildren = currentTree.findFiles()

    const addedEntries = currentTreeChildren.filter(f => {
        const search = lastTreeChildren.find(f2 => f2.filename === f.filename)

        if (stagedFiles.includes(f.filename)) return false

        return !search
    })

    const changedEntries = currentTreeChildren.filter(f => {
        const search = lastTreeChildren.find(f2 => f2.filename === f.filename)

        if (!search) return false

        if (stagedFiles.includes(f.filename)) return false

        return search.hash !== f.hash
    })

    if (stagedFiles.length) {
        logger.log('STAGED ENTRIES')

        stagedFiles.forEach(f => logger.log(logger.colors.yellow('\t+ ' + f)))
    }

    if (changedEntries.length) {
        logger.log('CHANGED ENTRIES')
        
        changedEntries.forEach(f => logger.log(logger.colors.blue('\t+ ' + f.filename)))
    }


    if (addedEntries.length) {
        logger.log('NEW ENTRIES')
        
        addedEntries.forEach(f => logger.log( logger.colors.green('\t+ ' + f.filename)))
    }

    const allEmpty = !addedEntries.length && !changedEntries.length && !stagedFiles.length

    if (allEmpty) {
        logger.log('Nothing to commit')
    }

}