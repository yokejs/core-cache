import { IYokeCacheDriver } from './cache'
import { RedisClient } from 'redis'
import { promisify } from 'util'

export interface IRedisCacheOptions {
  client: RedisClient
}

const RedisCache = ({ client }: IRedisCacheOptions): IYokeCacheDriver => {
  const getAsync = promisify(client.get).bind(client)
  const setAsync = promisify(client.set).bind(client)
  const setExAsync = promisify(client.setex).bind(client)
  const incrementAsync = promisify(client.incr).bind(client)
  const decrementAsync = promisify(client.decr).bind(client)
  const incrementByAsync = promisify(client.incrby).bind(client)
  const decrementByAsync = promisify(client.decrby).bind(client)
  const deleteAsync = promisify(client.del).bind(client)
  const flushAsync = promisify(client.flushall).bind(client)

  return {
    /**
     * Get a value from the cache.
     */
    get: async (key: string): Promise<any> => {
      return getAsync(key)
    },

    /**
     * Set a value in the cache.
     */
    set: async (
      key: string,
      value: any,
      milliseconds?: number,
    ): Promise<void> => {
      if (milliseconds) {
        const seconds = Math.floor(milliseconds / 1000)
        await setExAsync(key, seconds, value)
        return
      } 
      await setAsync(key, value)
    },

    /**
     * Increase and return a value in the cache by the given number, defaulting to 1.
     *
     * If the key does not exist, sets to zero before performing the operation.
     */
    increment: async (key: string, by: number = 1): Promise<number> => {
      if (by) {
        return incrementByAsync(key, by)
      }

      return incrementAsync(key)
    },

    /**
     * Decrease and return a value in the cache by the given number, defaulting to 1.
     *
     * If the key does not exist, sets to zero before performing the operation.
     */
    decrement: async (key: string, by: number = 1): Promise<number> => {
      if (by) {
        return decrementByAsync(key, by)
      }

      return decrementAsync(key)
    },

    /**
     * Delete an item in the cache.
     */
    delete: async (key: string): Promise<number> => {
      // @ts-ignore TODO: Fix
      return deleteAsync(key)
    },

    /**
     * Delete all items in the cache.
     */
    flush: async (): Promise<void> => {
      await flushAsync()

      return
    },
  }
}

export default RedisCache
