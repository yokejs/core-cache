# [Yoke.js Cache](https://github.com/yokejs/core-cache)

Yoke.js Cache is a simple Node.js cache manager.

It provides a uniform API across cache drivers and will in the future support Redis,
Memcached, database and more.

## Installation

`$ yarn add "@yokejs/core-cache"`
or
`$ npm install "@yokejs/core-cache"`

## Current drivers

- Filesystem

## Usage

```
import CoreCache, {FileSystemCache} from '@yokejs/core-cache'

// Define a cache directory in your application to use as file storage
const directory = './storage/cache'

const fileSystemCache = FileSystemCache({directory, core: CoreCache()})

await fileSystemCache.set('my:cache:key', 'my cache value', 2000)
```

### Storing an item in the cache

```
// Store an item in the cache forever
await fileSystemCache.set('my:cache:key', 'my cache value')

// Store an item in the cache for 2 seconds
await fileSystemCache.set('my:cache:key', 'my cache value', 2000)
```

### Retrieving an item from the cache

```
const value = await fileSystemCache.get('my:cache:key')
```

### Removing an item from the cache

```
await fileSystemCache.delete('my:cache:key')
```

### Removing all items from the cache

```
await fileSystemCache.flush()
```

### Increasing and decreasing values in the cache

```
// Increase and return a cache value by 1
const newValue = await fileSystemCache.increment('my:cache:key')

// Increase and return a cache value by 99
const newValue = await fileSystemCache.increment('my:cache:key', 99)

// Decrease and return a cache value by 1
const newValue = await fileSystemCache.decrement('my:cache:key')

// Incremenent and return a cache value by 99
const newValue = await fileSystemCache.decrement('my:cache:key', 99)
```

## License

Yoke.js Cache is open-sourced software licensed under the
[MIT](https://opensource.org/licenses/MIT) License.
