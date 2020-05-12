import FileSystemCache from './file-system-cache'
import * as path from 'path'
import delay from 'delay'
import { promises as fsPromises } from 'fs'
import * as fs from 'fs'
import Cache from './cache'

describe('FileSystemCache', () => {
  const directory = path.resolve(__dirname, '../__tests__/support/cache')
  const cacheKey = 'some:cache:key'
  const cacheValue = 'some value'

  afterEach(() => {
    return fsPromises.rmdir(directory, { recursive: true })
  })

  const cache = Cache(FileSystemCache({ directory }))

  describe('set', () => {
    it('should store the given value in a flat file with the correct expiry timestamp', async () => {
      expect.assertions(1)

      await cache.set(cacheKey, cacheValue, 2000)
      expect(await cache.get(cacheKey)).toEqual(cacheValue)
    })

    it('should store the given value in a flat file indefinitely if no expiry is given', async () => {
      expect.assertions(1)

      await cache.set(cacheKey, cacheValue)

      await delay(1001)

      expect(await cache.get(cacheKey)).toEqual(cacheValue)
    })
  })

  describe('get', () => {
    it('should return an unserialized value if still valid', async () => {
      expect.assertions(1)

      await cache.set(cacheKey, cacheValue, 6000)

      expect(await cache.get(cacheKey)).toEqual(cacheValue)
    })

    it('should return null and delete the file if the cache key has expired', async () => {
      expect.assertions(1)

      const cacheKey = 'some.cache.key'
      const cacheValue = 'some value'

      await cache.set(cacheKey, cacheValue, 1000)

      await delay(1001)

      expect(await cache.get(cacheKey)).toBeNull()
    })

    it('should return null if the cache file does not exist', async () => {
      expect.assertions(1)

      const cacheKey = 'some:cache:key:which:does:not:exist'

      expect(await cache.get(cacheKey)).toBeNull()
    })

    it('throws an error if the expiry timestamp is invalid', async () => {
      expect.assertions(1)

      const contents = `30394"some content"`
      const cacheKey = 'key'
      await fsPromises.mkdir(directory)
      await fsPromises.writeFile(`${directory}/${cacheKey}`, contents)

      try {
        await cache.get(cacheKey)
      } catch (e) {
        // TODO: Check error code in the future
        expect(e.message.startsWith('Invalid expiry timestamp')).toBeTruthy()
      }
    })

    it('throws an error if the cache value is invalid', async () => {
      expect.assertions(1)

      const now = new Date()
      now.setMilliseconds(now.getMilliseconds() + 60000)

      const contents = `${now.getTime()}{[ldldflfd/:ffkfkf`
      const cacheKey = 'key'
      await fsPromises.mkdir(directory)
      await fsPromises.writeFile(`${directory}/${cacheKey}`, contents)

      try {
        await cache.get(cacheKey)
      } catch (e) {
        // TODO: Check error code in the future
        expect(
          e.message.startsWith('Unable to parse cache contents'),
        ).toBeTruthy()
      }
    })
  })

  describe('delete', () => {
    it('removes the given cache file and returns 1', async () => {
      expect.assertions(3)

      await cache.set(cacheKey, cacheValue, 60000)

      expect(await cache.get(cacheKey)).toEqual(cacheValue)

      const keysDeleted = await cache.delete(cacheKey)

      expect(keysDeleted).toEqual(1)

      expect(await cache.get(cacheKey)).toBeNull()
    })
  })

  describe('flush', () => {
    it('removes the base cache directory', async () => {
      expect.assertions(1)

      await cache.flush()

      expect(fs.existsSync(directory)).toBeFalsy()
    })
  })

  describe('increment', () => {
    it('throws an error if the value of the given key is not a number', async () => {
      expect.assertions(1)

      await cache.set(cacheKey, 'none-integer-value')

      try {
        await cache.increment(cacheKey)
      } catch (e) {
        expect(e.message).toEqual('Unable to increment a none integer value')
      }
    })

    it('returns the given incremental number if the key does not exist', async () => {
      expect.assertions(1)

      const incrementedValue = await cache.increment(cacheKey, 1234)

      expect(incrementedValue).toEqual(1234)
    })

    it('increases the existing value by the provided number of increments and returns the new value', async () => {
      expect.assertions(1)

      await cache.set(cacheKey, 3456)

      const incrementedValue = await cache.increment(cacheKey, 33)

      expect(incrementedValue).toEqual(3489)
    })
  })

  describe('decrement', () => {
    it('throws an error if the value of the given key is not a number', async () => {
      expect.assertions(1)

      await cache.set(cacheKey, 'none-integer-value')

      try {
        await cache.decrement(cacheKey)
      } catch (e) {
        expect(e.message).toEqual('Unable to increment a none integer value')
      }
    })

    it('returns the given decremental number if the key does not exist', async () => {
      expect.assertions(1)

      const incrementedValue = await cache.decrement(cacheKey, 109)

      expect(incrementedValue).toEqual(-109)
    })

    it('decreases the existing value by the given decremental value and returns the new value', async () => {
      expect.assertions(1)

      await cache.set(cacheKey, 3456)

      const incrementedValue = await cache.decrement(cacheKey, 2)

      expect(incrementedValue).toEqual(3454)
    })
  })
})
