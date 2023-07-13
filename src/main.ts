#!/usr/bin/env node

import init from './commands/init'
import hashObject from './commands/hash-object'
import cat from './commands/cat'

async function main() {
    
    const [commandName, ...args] = process.argv.slice(2)

    const commands = new Map()   
    
    commands.set('init', init)
    
    commands.set('cat', cat)

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
