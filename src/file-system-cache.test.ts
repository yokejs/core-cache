import FileSystemCache from './file-system-cache'
import * as path from 'path'
import delay from 'delay'
import {promises as fsPromises} from 'fs'

describe('fileSystemCache', () => {
  const directory = path.resolve(__dirname, '../cache')
  const cacheKey = 'some.cache.key'
  const cacheValue = 'some value'

  afterAll(() => {
    return fsPromises.rmdir(directory, {recursive: true})
  })

  const fileSystemCache = FileSystemCache({directory})

  describe('store', () => {
    it('should store the given value in a flat file with the correct expiry timestamp', async () => {
      expect.assertions(1)

      await fileSystemCache.store(cacheKey, cacheValue, 2000)
      expect(await fileSystemCache.get(cacheKey)).toEqual(cacheValue)
    })
  })

  describe('get', () => {
    it('should return an unserialized value if still valid', async () => {
      expect.assertions(1)

      await fileSystemCache.store(cacheKey, cacheValue, 6000)

      expect(await fileSystemCache.get(cacheKey)).toEqual(cacheValue)
    })

    it('should return null and delete the file if the cache key has expired', async () => {
      expect.assertions(1)

      const cacheKey = 'some.cache.key'
      const cacheValue = 'some value'

      await fileSystemCache.store(cacheKey, cacheValue, 1000)

      await delay(1001)

      expect(await fileSystemCache.get(cacheKey)).toBeNull()
    })
  })
})
