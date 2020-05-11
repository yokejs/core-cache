![CI](https://github.com/yokejs/core-cache/workflows/Build/badge.svg) ![CI](https://github.com/yokejs/core-cache/workflows/Tests/badge.svg) ![CI](https://github.com/yokejs/core-cache/workflows/Linting/badge.svg)

# [Yoke.js Cache](https://github.com/yokejs/core-cache)

Yoke.js Cache is a simple Node.js cache manager.

It currently supports Redis and Filesystem and provides a uniform API across
cache drivers. Memcache and database drivers will be supported in the future.

## Installation

`$ yarn add "@yokejs/core-cache"`
or
`$ npm install "@yokejs/core-cache"`

## Current drivers

- Filesystem
- Redis

## Peer Dependencies

### Redis
* https://github.com/NodeRedis/node-redis - "^3.0.2"

## Usage

### Initialising the cache

#### Redis

```
import CoreCache, {RedisCache as Cache} from '@yokejs/core-cache'

// Create the redis client
const client = redis.createClient()
const cache = Cache({client, core: CoreCache())})

// Perform operations

client.quit()
```

#### Filesystem

```
import CoreCache, {FileSystemCache as Cache} from '@yokejs/core-cache'

// Define an absolute path to store the cache files
const directory = path.resolve(__dirname, './cache')
const cache = Cache({directory, core: CoreCache()})
```

### Storing an item in the cache

```
// Store an item in the cache forever
await cache.set('my:cache:key', 'my cache value')

// Store an item in the cache for 2 seconds
await cache.set('my:cache:key', 'my cache value', 2000)
```

### Retrieving an item from the cache

```
const value = await cache.get('my:cache:key')
```

### Removing an item from the cache

```
await cache.delete('my:cache:key')
```

### Removing all items from the cache

```
await cache.flush()
```

### Increasing and decreasing values in the cache

```
// Increase and return a cache value by 1
const newValue = await cache.increment('my:cache:key')

// Increase and return a cache value by 99
const newValue = await cache.increment('my:cache:key', 99)

// Decrease and return a cache value by 1
const newValue = await cache.decrement('my:cache:key')

// Decrease and return a cache value by 99
const newValue = await cache.decrement('my:cache:key', 99)
```

## License

Yoke.js Cache is open-sourced software licensed under the
[MIT](https://opensource.org/licenses/MIT) License.
