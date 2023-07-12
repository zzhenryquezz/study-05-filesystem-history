import init from './commands/init'


async function main() {
    
    const [commandName, ...args] = process.argv.slice(2)

    const commands = new Map()   
    
    // init command   
    commands.set('init', init)

    // add command
        
    // commit command
    

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
