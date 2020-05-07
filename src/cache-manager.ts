import FileSystemCache, {IFileSystemCacheOptions} from './file-system-cache'

export interface IYokeCache {
  get: (key: string) => Promise<any>,

  set: (key: string, value: any, milliseconds?: number) => Promise<void>

  increment: (key: string, by?: number) => Promise<number>

  decrement: (key: string, by?: number) => Promise<number>

  delete: (key: string) => Promise<void>

  flush: () => Promise<void>
}

enum YokeCacheDriver {
  FileSystem
}

type IYokeCacheOptions = IFileSystemCacheOptions

const resolve = <O extends IYokeCacheOptions>(driver: YokeCacheDriver, options: O) => ({
  [YokeCacheDriver.FileSystem]: FileSystemCache(options)
})

const cacheManager = <O extends IYokeCacheOptions>(driver: YokeCacheDriver, options: O) => {
  return resolve(driver, options)
}

export default cacheManager
