import FVCRepository from "../entities/FVCRepository"
import { logger } from "@poppinss/cliui"
import { useArgs } from "../utils/args"
import FVCTree from "../entities/FVCTree"
import FVCBlob from "../entities/FVCBlob"

export default async function (baseArgs: string[]){

    const { args } = useArgs(baseArgs)

    const path = args[0]

    if (!path) {
        logger.error('You must provide a path')
        return
    }

    const repository = await FVCRepository.findRepository()
    
    const history = await repository.findHistory(path)
    
    if (!history.length) {
        logger.error('No commits yet')
        return
    }

    const objects = [] as FVCBlob[]

    for await (const commit of history) {
        const tree = await repository.readObject(commit.tree) as FVCTree

        const entry = tree.findFiles().find(f => f.filename === path)

        if (!entry) continue

        const alreadyAdded = objects.some(o => o.hash() === entry.hash)

        if (alreadyAdded) continue

        const object = await repository.readObject(entry.hash) as FVCBlob

        logger.log(logger.colors.yellow(`commit: ${commit.hash()}`))
        logger.log(`blob: ${object.hash()}`)
        logger.log(`Date: ${new Date(Number(commit.timestamp))}`)
        logger.log(`Message: ${commit.message}`)
        logger.log(`${'-'.repeat(80)}\n`)

        console.log(object.content())

        objects.push(object)
    }
}