import FileSystemCache, {IFileSystemCacheOptions} from './file-system-cache'

export interface IYokeCache {
  get: (key: string) => Promise<any>,

  store: (key: string, value: any, milliseconds: number) => Promise<void>
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
