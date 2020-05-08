import fs from 'fs'
import {promises as fsPromises} from 'fs'
import {IYokeCache} from './core-cache'
import * as path from 'path'
import CoreCache from './core-cache'

export interface IFileSystemCacheOptions {
  core: ReturnType<typeof CoreCache>
  directory: string
}

/**
 * Recursively create the cache directory if it does not exist.
 */
const createDirectoryIfNotExists = async (directory: string) => {
  if (!fs.existsSync(directory)) {
    await fsPromises.mkdir(directory, {recursive: true})
  }
}

/**
 * Convert the given key to an array of paths using the OS separator. Supports dot notation.
 */
const resolveCachePaths = (key: string, separator: string): string[] => {
  return key.split(separator).join(path.sep).split(path.sep)
}

/**
 * Resolve the cache directory based on the given key. Supports dot notation.
 */
const resolveCacheDirectory = (key: string, separator: string): string => {
  const cacheKey = resolveCachePaths(key, separator)

  cacheKey.pop()

  return cacheKey.join(path.sep)
}

/**
 * Resolve the cache file based on the given key. Supports dot notation.
 */
const resolveCacheFile = (key: string, separator: string): string => {
  const cacheKey = resolveCachePaths(key, separator)

  return cacheKey[cacheKey.length - 1]
}

/**
 * Resolve the absolute cache file path from the directory and file.
 */
const resolveAbsoluteCacheFilePath = (cacheDir: string, cacheFile: string): string => {
  return path.normalize(`${cacheDir}/${cacheFile}`)
}

/**
 * Determine whether the given expiry timestamp is valid.
 */
const isValidExpiry = (timestamp: string): boolean => {
  if (isIndefiniteExpiryTimestamp(timestamp)) {
    return true
  }

  const isValidTimestamp = /^\d+$/.test(timestamp)

  return isValidTimestamp && !!new Date(parseInt(timestamp)).getTime()
}

/**
 * A placeholder timestamp to flag a cache as indefinite. "0000000000000".
 */
const indefiniteExpiryTimestamp = (): string => {
  return "".padStart(13, "0")
}

/**
 * Determine whether the given timestamp is indefinite.
 */
const isIndefiniteExpiryTimestamp = (timestamp: string): boolean => {
  return timestamp === indefiniteExpiryTimestamp()
}

const FileSystemCache = ({core, directory}: IFileSystemCacheOptions): IYokeCache => {
  return {
    ...core,
    /**
     * Get a value from the cache.
     */
    get: async (key: string): Promise<any> => {
      const cacheDir = `${directory}/${resolveCacheDirectory(key, core.cacheKeySeparator())}`
      const cacheFile = resolveCacheFile(key, core.cacheKeySeparator())
      const absoluteCacheFilePath = resolveAbsoluteCacheFilePath(cacheDir, cacheFile)

      if (!await fs.existsSync(absoluteCacheFilePath)) {
        return null
      }

      const contents = await fsPromises.readFile(absoluteCacheFilePath)
      const timestamp = contents.toString().substr(0, 13)

      if (!isValidExpiry(timestamp)) {
        await fsPromises.unlink(absoluteCacheFilePath)

        throw new Error(`Invalid expiry timestamp in "${absoluteCacheFilePath}". File has been removed.`)
      }

      if (!isIndefiniteExpiryTimestamp(timestamp) && parseInt(timestamp) < new Date().getTime()) {
        await fsPromises.unlink(absoluteCacheFilePath)

        return null
      }

      const value = contents.toString().substr(13)

      try {
        return JSON.parse(value)
      } catch (e) {
        await fsPromises.unlink(absoluteCacheFilePath)

        throw new Error(`Unable to parse cache contents in "${absoluteCacheFilePath}". File has been removed. ${e.message}`)
      }
    },

    /**
     * Set a value in the cache.
     */
    set: async (key: string, value: any, milliseconds?: number): Promise<void> => {
      const cacheDir = path.normalize(`${directory}/${resolveCacheDirectory(key, core.cacheKeySeparator())}`)
      const cacheFile = resolveCacheFile(key, core.cacheKeySeparator())
      const absoluteCacheFilePath = resolveAbsoluteCacheFilePath(cacheDir, cacheFile)

      const now = new Date()

      if (milliseconds) {
        now.setMilliseconds(now.getMilliseconds() + milliseconds)
      }

      const expiryTimestamp = milliseconds ? now.getTime() : indefiniteExpiryTimestamp()
      await createDirectoryIfNotExists(cacheDir)

      const contents = `${expiryTimestamp}${JSON.stringify(value)}`

      await fsPromises.writeFile(absoluteCacheFilePath, contents)
    },

    /**
     * Increase and return a value in the cache by the given number, defaulting to 1.
     *
     * If the key does not exist, sets to zero before performing the operation.
     */
    increment: async (key: string, by: number = 1): Promise<number> => {
      const value = await FileSystemCache({core, directory}).get(key) || 0
      const parsed = parseInt(value)

      if (isNaN(parsed)) {
        throw new Error("Unable to increment a none integer value")
      }

      return parsed + by
    },

    /**
     * Decrease and return a value in the cache by the given number, defaulting to 1.
     *
     * If the key does not exist, sets to zero before performing the operation.
     */
    decrement: async (key: string, by: number = 1): Promise<number> => {
      return (await FileSystemCache({core, directory}).increment(key, by * -1))
    },

    /**
     * Delete an item in the cache.
     */
    delete: async (key: string): Promise<void> => {
      const cacheDir = path.normalize(`${directory}/${resolveCacheDirectory(key, core.cacheKeySeparator())}`)
      const cacheFile = resolveCacheFile(key, core.cacheKeySeparator())
      const absoluteCacheFilePath = resolveAbsoluteCacheFilePath(cacheDir, cacheFile)

      if (!fs.existsSync(absoluteCacheFilePath)) {
        return
      }

      try {
        await fsPromises.unlink(absoluteCacheFilePath)
      } catch (e) {
        // TODO: Write test
        throw new Error(`Unable to remove file "${absoluteCacheFilePath}". ${e.message}`)
      }
    },

    /**
     * Delete all items in the cache.
     */
    flush: async (): Promise<void> => {
      await fsPromises.rmdir(directory, {recursive: true})
    },
  }
}

export default FileSystemCache
