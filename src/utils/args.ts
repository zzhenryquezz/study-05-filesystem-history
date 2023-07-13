export function useArgs(baseArgs: string[]) {
    const flags: Record<string, string> = {}
    const args = [] as string[]

    const queue = baseArgs.slice()


    while (queue.length) {
        const [current, next] = queue

        if (current.startsWith('--')) {
            flags[current.slice(2)] = next || 'true'

            queue.splice(0, 2)

            continue
        }

        args.push(current)
        
        queue.splice(0, 1)
    }

    return {
        flags,
        args
    }
}