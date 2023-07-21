import { useArgs } from "../utils/args"
import FVCRepository from "../entities/FVCRepository"
import FVCTree from "../entities/FVCTree"

import { logger } from "@poppinss/cliui"

export default async function (baseArgs: string[]){

    const repository = await FVCRepository.findRepository()
    
    const staged = await repository.read('INDEX')

    const stagedFiles = staged.split('\n').filter(Boolean).map(f => {
        const [hash, filename] = f.split(' ')
        
        return { hash, filename }
    })

    const currentTree = await repository.hashObject('.') as FVCTree

    const lastTree = await repository.findLastTree()

    const committedTreeEntries = lastTree ? await repository.findAllTreeEntries(lastTree) : []

    const workTreeEntries = await repository.findAllTreeEntries(currentTree)

    const entries = workTreeEntries.filter(e => e.type !== 'tree')

    const addedEntries = entries.filter(({ filename, hash }) => {
        const committedEntry = committedTreeEntries.find(f => filename === f.filename)
        
        const stagedEntry = stagedFiles.find(f => filename === f.filename)

        if (committedEntry) return false

        if (stagedEntry) return false

        return true
    })

    const changedEntries = entries.filter(({ filename, hash }) => {
        const committedEntry = committedTreeEntries.find(f => filename === f.filename)

        if (!committedEntry) return false

        if (committedEntry.hash === hash) return false

        const stagedEntry = stagedFiles.find(f => filename === f.filename && f.hash === hash)

        if (stagedEntry) return false
        
        return true       
    })

    const deletedEntries = committedTreeEntries.filter(({ filename }) => {
        const workTreeEntry = workTreeEntries.find(f => filename === f.filename)

        if (workTreeEntry) return false

        const stagedEntry = stagedFiles.find(f => filename === f.filename)

        if (stagedEntry) return false

        return true
    })

    if (stagedFiles.length) {
        logger.log('STAGED ENTRIES')

        stagedFiles.forEach(f => logger.log(logger.colors.yellow('+ ' + f.filename)))
    }

    if (changedEntries.length) {
        logger.log('CHANGED ENTRIES')
        
        changedEntries.forEach(f => logger.log(logger.colors.blue('+ ' + f.filename)))
    }


    if (addedEntries.length) {
        logger.log('NEW ENTRIES')
        
        addedEntries.forEach(f => logger.log( logger.colors.green('+ ' + f.filename)))
    }

    if (deletedEntries.length) {
        logger.log('DELETED ENTRIES')
        
        deletedEntries.forEach(f => logger.log( logger.colors.red('- ' + f.filename)))
    }

    const allEmpty = [stagedFiles, changedEntries, addedEntries, deletedEntries].every(e => !e.length)

    if (allEmpty) {
        logger.log('Nothing to commit')
    }

}