import RedisCache from './redis-cache'
import CoreCache from './core-cache'
import redis from 'redis-mock'
import delay from 'delay'

describe('RedisCache', () => {
  const client = redis.createClient()
  const cacheKey = 'some:cache:key'
  const cacheValue = 'some value'

  const redisCache = RedisCache({ client, core: CoreCache() })

  afterEach(client.flushall)

  describe('set', () => {
    it('should store the given value in the redis cache for 2 seconds', async () => {
      expect.assertions(2)

      await redisCache.set(cacheKey, cacheValue, 2000)

      expect(await redisCache.get(cacheKey)).toEqual(cacheValue)

      await delay(2001)

      expect(await redisCache.get(cacheKey)).toBeNull()
    })

    it('should store the given value in the redis cache indefinitely', async () => {
      expect.assertions(1)

      await redisCache.set(cacheKey, cacheValue)

      await delay(1001)

      expect(await redisCache.get(cacheKey)).toEqual(cacheValue)
    })
  })

  describe('get', () => {
    it('should return the value for the given key', async () => {
      expect.assertions(1)

      await redisCache.set(cacheKey, cacheValue)

      expect(await redisCache.get(cacheKey)).toEqual(cacheValue)
    })

    it('should return null if the key does not exist', async () => {
      expect.assertions(1)

      expect(await redisCache.get(cacheKey)).toBeNull()
    })
  })

  describe('delete', () => {
    it('should remove the cache key and return 1', async () => {
      expect.assertions(2)

      await redisCache.set(cacheKey, cacheValue)

      const keysDeleted = await redisCache.delete(cacheKey)

      expect(keysDeleted).toEqual(1)
      expect(await redisCache.get(cacheKey)).toBeNull()
    })
  })

  describe('flush', () => {
    it('removes all keys from cache', async () => {
      expect.assertions(1)

      await redisCache.set(cacheKey, cacheValue)

      await redisCache.flush()

      expect(await redisCache.get(cacheKey)).toBeNull()
    })
  })

  describe('increment', () => {
    it('increments and returns a value in the cache', async () => {
      expect.assertions(2)

      await redisCache.set(cacheKey, 99)

      const newValue = await redisCache.increment(cacheKey)

      expect(newValue).toEqual(100)
      expect(await redisCache.get(cacheKey)).toEqual('100')
    })

    it('increments and returns a value in the cache by the given increment', async () => {
      expect.assertions(2)

      await redisCache.set(cacheKey, 99)

      const newValue = await redisCache.increment(cacheKey, 100)

      expect(newValue).toEqual(199)
      expect(await redisCache.get(cacheKey)).toEqual('199')
    })
  })

  describe('decrement', () => {
    it('decrements and returns a value in the cache', async () => {
      expect.assertions(2)

      await redisCache.set(cacheKey, 99)

      const newValue = await redisCache.decrement(cacheKey)

      expect(newValue).toEqual(98)
      expect(await redisCache.get(cacheKey)).toEqual('98')
    })

    it('decrements and returns a value in the cache by the given decrement', async () => {
      expect.assertions(2)

      await redisCache.set(cacheKey, 99)

      const newValue = await redisCache.decrement(cacheKey, 100)

      expect(newValue).toEqual(-1)
      expect(await redisCache.get(cacheKey)).toEqual('-1')
    })
  })
})
