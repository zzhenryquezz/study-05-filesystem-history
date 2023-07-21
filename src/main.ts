#!/usr/bin/env node

import init from './commands/init'
import hashObject from './commands/hash-object'
import cat from './commands/cat'
import status from './commands/status'
import add from './commands/add'
import remove from './commands/remove'
import commit from './commands/commit'
import log from './commands/log'
import show from './commands/show'
import checkout from './commands/checkout'

async function main() {
    
    const [commandName, ...args] = process.argv.slice(2)

    const commands = new Map()   
    
    commands.set('init', init)
    
    commands.set('hash-object', hashObject)
    
    commands.set('cat', cat)

    commands.set('add', add)

    commands.set('remove', remove)

    commands.set('status', status)

    commands.set('commit', commit)

    commands.set('show', show)

    commands.set('log', log)

    commands.set('checkout', checkout)

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
