import fs from 'fs'
import {promises as fsPromises} from 'fs'
import {IYokeCache} from './cache-manager'
import * as path from 'path'

export interface IFileSystemCacheOptions {
  directory: string
}

const createDirectoryIfNotExists = async (directory: string) => {
  if (!fs.existsSync(directory)) {
    await fsPromises.mkdir(directory, {recursive: true})
  }
}

const resolveCacheKey = (key: string): string[] => {
  return key.split('.').join(path.sep).split(path.sep)
}

const resolveCacheDirectory = (key: string): string => {
  const cacheKey = resolveCacheKey(key)

  cacheKey.pop()

  return cacheKey.join(path.sep)
}

const resolveCacheFile = (key: string): string => {
  const cacheKey = resolveCacheKey(key)

  return cacheKey[cacheKey.length - 1]
}

const isValidExpiry = (timestamp: string): boolean => {
  const isValidTimestamp = /^\d+$/.test(timestamp)

  return isValidTimestamp && !!new Date(parseInt(timestamp)).getTime()
}

const FileSystemCache = ({directory}: IFileSystemCacheOptions): IYokeCache => {
  return {
    get: async (key: string): Promise<any> => {
      const cacheDir = `${directory}/${resolveCacheDirectory(key)}`
      const cacheFile = resolveCacheFile(key)

      if (!await fs.existsSync(`${cacheDir}/${cacheFile}`)) {
        return null
      }

      const contents = await fsPromises.readFile(`${cacheDir}/${cacheFile}`)
      const timestamp = contents.toString().substr(0, 13)

      if (!isValidExpiry(timestamp)) {
        await fsPromises.unlink(`${cacheDir}/${cacheFile}`)

        throw new Error(`Invalid expiry timestamp in "${resolveCacheDirectory(key)}/${cacheFile}". File has been removed.`)
      }

      if (parseInt(timestamp) < new Date().getTime()) {
        await fsPromises.unlink(`${cacheDir}/${cacheFile}`)

        return null
      }

      const value = contents.toString().substr(13)

      try {
        const unserialized = JSON.parse(value)

        return unserialized
      } catch (e) {
        await fsPromises.unlink(`${cacheDir}/${cacheFile}`)

        // TODO: Write test
        throw new Error(`Unable to parse cache contents in "${resolveCacheDirectory(key)}/${cacheFile}". File has been removed. ${e.message}`)
      }
    },

    set: async (key: string, value: any, milliseconds: number): Promise<void> => {
      const cacheDir = `${directory}/${resolveCacheDirectory(key)}`
      const now = new Date()

      now.setMilliseconds(now.getMilliseconds() + milliseconds)

      await createDirectoryIfNotExists(cacheDir)

      const contents = `${now.getTime()}${JSON.stringify(value)}`

      await fsPromises.writeFile(`${cacheDir}/${resolveCacheFile(key)}`, contents)
    },

    delete: async (key: string): Promise<void> => {
      const cacheDir = `${directory}/${resolveCacheDirectory(key)}`
      const cacheFile = resolveCacheFile(key)

      if(!fs.existsSync(`${cacheDir}/${cacheFile}`)) {
        return
      }

     try {
       await fsPromises.unlink(`${cacheDir}/${cacheFile}`)
     } catch (e) {
        // TODO: Write test
       throw new Error(`Unable to remove file "${resolveCacheDirectory(key)}/${cacheFile}". ${e.message}`)
     }
    },

    flush: async (): Promise<void> => {

    }
  }
}

export default FileSystemCache
