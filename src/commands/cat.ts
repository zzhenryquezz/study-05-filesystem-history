import { useArgs } from "../utils/args"
import FVCRepository from "../entities/FVCRepository"

export default async function (baseArgs: string[]){

    const { args, flags } = useArgs(baseArgs)

    const hash = args[0]

    if (!hash) {
        console.error('You must provide a hash')
        return
    }

    const repository = await FVCRepository.findRepository()

    const object = await repository.readObject(hash)

    if (flags.raw) {
        console.log(object.data)
        return
    }

    if (flags.object) {
        console.log(object)
        return
    }

    console.log(object?.content())    
}