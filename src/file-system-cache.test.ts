import FileSystemCache from './file-system-cache'
import * as path from 'path'
import delay from 'delay'
import {promises as fsPromises} from 'fs'

describe('FileSystemCache', () => {
  const directory = path.resolve(__dirname, '../cache')
  const cacheKey = 'some.cache.key'
  const cacheValue = 'some value'

  afterEach(() => {
    return fsPromises.rmdir(directory, {recursive: true})
  })

  const fileSystemCache = FileSystemCache({directory})

  describe('set', () => {
    it('should store the given value in a flat file with the correct expiry timestamp', async () => {
      expect.assertions(1)

      await fileSystemCache.set(cacheKey, cacheValue, 2000)
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

      const cacheKey = 'some.cache.key.which.does.not.exist'

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
        expect(e.message).toEqual('Invalid expiry timestamp in "/key". File has been removed.')
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
        expect(e.message).toEqual('Unable to parse cache contents in "/key". File has been removed. Unexpected token [ in JSON at position 1')
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
})
