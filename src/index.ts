import Cache from './cache'

export type { IYokeCache, IYokeCacheDriver } from './cache'

export { default as FileSystemCache } from './file-system-cache'
export { default as RedisCache } from './redis-cache'

export default Cache
