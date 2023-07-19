#!/usr/bin/env node

import init from './commands/init'
import hashObject from './commands/hash-object'
import cat from './commands/cat'
import status from './commands/status'
import add from './commands/add'
import remove from './commands/remove'

async function main() {
    
    const [commandName, ...args] = process.argv.slice(2)

    const commands = new Map()   
    
    commands.set('init', init)
    
    commands.set('cat', cat)

    commands.set('status', status)

    commands.set('add', add)

    commands.set('remove', remove)

    commands.set('hash-object', hashObject)

    const command = commands.get(commandName)

    if (!command) {

        console.log('Commands available:', Array.from(commands.keys()).join())
        
        process.exit(1)
    }

    await command(args)

}

main().catch(err => {
    console.error(err)
    process.exit(1)
})
