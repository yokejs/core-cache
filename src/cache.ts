interface IYokeCacheCore {
  /**
   * Return the separator used for cache keys.
   */
  cacheKeySeparator: () => string
}

export interface IYokeCacheDriver {
  /**
   * Get a value from the cache.
   */
  get: (key: string) => Promise<any>

  /**
   * Set a value in the cache.
   */
  set: (key: string, value: any, milliseconds?: number) => Promise<void>

  /**
   * Increase and return a value in the cache by the given number, defaulting to 1.
   *
   * If the key does not exist, sets to zero before performing the operation.
   */
  increment: (key: string, by?: number) => Promise<number>

  /**
   * Decrease and return a value in the cache by the given number, defaulting to 1.
   *
   * If the key does not exist, sets to zero before performing the operation.
   */
  decrement: (key: string, by?: number) => Promise<number>

  /**
   * Delete an item in the cache and return the number of keys removed.
   */
  delete: (key: string) => Promise<number>

  /**
   * Delete all items in the cache.
   */
  flush: () => Promise<void>

  /**
   * Return the separator used for cache keys.
   */
  cacheKeySeparator?: () => string
}

export type IYokeCache = IYokeCacheCore & IYokeCacheDriver

/**
 * Return the separator used for cache keys.
 */
export const cacheKeySeparator = (): string => {
  return ':'
}

const Cache = (driver: IYokeCacheDriver): IYokeCache => {
  return {
    cacheKeySeparator,
    ...driver,
  }
}

export default Cache
