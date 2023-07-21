import fg from 'fast-glob'

import { promises as fs } from "fs"
import { resolve as pathResolve, dirname } from "path"

export function useFs(){

    function pwd(){
        return process.cwd()
    }
    
    function resolve(...args: string[]){
        return pathResolve(pwd(), ...args)
    }

    async function exists(...path: string[]){
        return fs.stat(resolve(...path)).then(() => true).catch(() => false)
    }
    
    async function isFolder(...path: string[]){
        return fs.stat(resolve(...path)).then(stat => stat.isDirectory()).catch(() => false)
    }

    async function mkdir(path: string) {
        await fs.mkdir(path, { recursive: true })
    }

    async function write(path: string, content: any) {

        const folderPath = dirname(path)

        const folderExists = await exists(folderPath)

        if (!folderExists) {
            await mkdir(folderPath)
        }

        await fs.writeFile(path, content)
    }

    async function read(path: string) {
        return fs.readFile(path, 'utf-8')
    }

    async function readDir(path: string) {
        return fs.readdir(path)
    }

    async function rm(path: string) {
        return fs.rm(path, { recursive: true })
    }

    async function findAllFilesFromPaths(paths: string[]) {
        const filenames: string[] = []

        for await (const path of paths) {
            const pathIsFolder = await isFolder(path)
    
            if (!pathIsFolder) {
                filenames.push(path)
                continue
            }
    
            const children = await fg(resolve(path, '**/*'), { onlyFiles: true })
    
            filenames.push(...children)
        }

        return filenames
    }

    return {
        exists,
        isFolder,
        mkdir,
        write,
        read,
        readDir,
        resolve,
        rm,
        pwd,
        findAllFilesFromPaths
    }
}