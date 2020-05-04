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

const resolveCacheDirectory = (key: string): string => {
  // TODO: De-dupe
  const keyDirectory = key.split('.').join(path.sep).split(path.sep)

  keyDirectory.pop()

  return keyDirectory.join(path.sep)
}

const resolveCacheFile = (key: string): string => {
  // TODO: De-dupe
  const keyDirectory = key.split('.').join(path.sep).split(path.sep)

  return keyDirectory[keyDirectory.length - 1]
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

      // TODO: Check valid timestamp
      const timestamp = parseInt(contents.toString().substr(0, 13))

      if (isNaN(timestamp)) {
        await fsPromises.unlink(`${cacheDir}/${cacheFile}`)

        // TODO: Should I just return null?
        throw new Error(`Invalid expiry timestamp in "${cacheDir}/${cacheFile}". File has been removed.`)
      }

      if (timestamp < new Date().getTime()) {
        await fsPromises.unlink(`${cacheDir}/${cacheFile}`)

        return null
      }

      const value = contents.toString().substr(13)

      try {
        return JSON.parse(value)
      } catch (e) {
        await fsPromises.unlink(`${cacheDir}/${cacheFile}`)

        // TODO: Should I just return null?
        throw new Error(`Unable to parse cache contents in "${cacheDir}/${cacheFile}". File has been removed. ${e.message}`)
      }
    },

    store: async (key: string, value: any, milliseconds: number): Promise<void> => {
      const cacheDir = `${directory}/${resolveCacheDirectory(key)}`
      const now = new Date()

      now.setMilliseconds(now.getMilliseconds() + milliseconds)

      await createDirectoryIfNotExists(cacheDir)

      const contents = `${now.getTime()}${JSON.stringify(value)}`

      await fsPromises.writeFile(`${cacheDir}/${resolveCacheFile(key)}`, contents)
    }
  }
}

export default FileSystemCache
