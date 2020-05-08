import FileSystemCache from './file-system-cache'
import * as path from 'path'
import delay from 'delay'
import {promises as fsPromises} from 'fs'
import * as fs from 'fs'
import CoreCache from './core-cache'

describe('FileSystemCache', () => {
  const directory = path.resolve(__dirname, '../__tests__/support/cache')
  const cacheKey = 'some:cache:key'
  const cacheValue = 'some value'

  afterEach(() => {
    return fsPromises.rmdir(directory, {recursive: true})
  })

  const fileSystemCache = FileSystemCache({directory, core: CoreCache()})

  describe('set', () => {
    it('should store the given value in a flat file with the correct expiry timestamp', async () => {
      expect.assertions(1)

      await fileSystemCache.set(cacheKey, cacheValue, 2000)
      expect(await fileSystemCache.get(cacheKey)).toEqual(cacheValue)
    })

    it('should store the given value in a flat file indefinitely if no expiry is given', async () => {
      expect.assertions(1)

      await fileSystemCache.set(cacheKey, cacheValue)

      await delay(1001)

      expect(await fileSystemCache.get(cacheKey)).toEqual(cacheValue)
    })
  })

  describe('get', () => {
    it('should return an unserialized value if still valid', async () => {
      expect.assertions(1)

      await fileSystemCache.set(cacheKey, cacheValue, 6000)

      expect(await fileSystemCache.get(cacheKey)).toEqual(cacheValue)
    })

    it('should return null and delete the file if the cache key has expired', async () => {
      expect.assertions(1)

      const cacheKey = 'some.cache.key'
      const cacheValue = 'some value'

      await fileSystemCache.set(cacheKey, cacheValue, 1000)

      await delay(1001)

      expect(await fileSystemCache.get(cacheKey)).toBeNull()
    })

    it('should return null if the cache file does not exist', async () => {
      expect.assertions(1)

      const cacheKey = 'some:cache:key:which:does:not:exist'

      expect(await fileSystemCache.get(cacheKey)).toBeNull()
    })

    it('throws an error if the expiry timestamp is invalid', async () => {
      expect.assertions(1)

      const contents = `30394"some content"`
      const cacheKey = 'key'
      await fsPromises.mkdir(directory)
      await fsPromises.writeFile(`${directory}/${cacheKey}`, contents)

      try {
        await fileSystemCache.get(cacheKey)
      } catch (e) {
        // TODO: Check error code in the future
        expect(e.message.startsWith("Invalid expiry timestamp")).toBeTruthy()
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
        await fileSystemCache.get(cacheKey)
      } catch (e) {
        // TODO: Check error code in the future
        expect(e.message.startsWith('Unable to parse cache contents')).toBeTruthy()
      }
    })
  })

  describe('delete', () => {
    it('removes the given cache file', async () => {
      expect.assertions(2)

      await fileSystemCache.set(cacheKey, cacheValue, 60000)

      expect(await fileSystemCache.get(cacheKey)).toEqual(cacheValue)

      await fileSystemCache.delete(cacheKey)

      expect(await fileSystemCache.get(cacheKey)).toBeNull()
    })
  })

  describe('flush', () => {
    it('removes the base cache directory', async () => {
      expect.assertions(1)

      await fileSystemCache.flush()

      expect(fs.existsSync(directory)).toBeFalsy()
    })
  })

  describe('increment', () => {
    it('throws an error if the value of the given key is not a number', async () => {
      expect.assertions(1)

      await fileSystemCache.set(cacheKey, "none-integer-value")

      try {
        await fileSystemCache.increment(cacheKey)
      } catch (e) {
        expect(e.message).toEqual("Unable to increment a none integer value")
      }
    })

    it('returns the given incremental number if the key does not exist', async () => {
      expect.assertions(1)

      const incrementedValue = await fileSystemCache.increment(cacheKey, 1234)

      expect(incrementedValue).toEqual(1234)
    })

    it('increases the existing value by the provided number of increments and returns the new value', async () => {
      expect.assertions(1)

      await fileSystemCache.set(cacheKey, 3456)

      const incrementedValue = await fileSystemCache.increment(cacheKey, 33)

      expect(incrementedValue).toEqual(3489)
    })
  })

  describe('decrement', () => {
    it('throws an error if the value of the given key is not a number', async () => {
      expect.assertions(1)

      await fileSystemCache.set(cacheKey, "none-integer-value")

      try {
        await fileSystemCache.decrement(cacheKey)
      } catch (e) {
        expect(e.message).toEqual("Unable to increment a none integer value")
      }
    })

    it('returns the given decremental number if the key does not exist', async () => {
      expect.assertions(1)

      const incrementedValue = await fileSystemCache.decrement(cacheKey, 109)

      expect(incrementedValue).toEqual(-109)
    })

    it('decreases the existing value by the given decremental value and returns the new value', async () => {
      expect.assertions(1)

      await fileSystemCache.set(cacheKey, 3456)

      const incrementedValue = await fileSystemCache.decrement(cacheKey, 2)

      expect(incrementedValue).toEqual(3454)
    })
  })
})
