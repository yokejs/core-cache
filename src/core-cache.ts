const CoreCache = () => {
  return {
    /**
     * Return the separator used for cache keys.
     */
    cacheKeySeparator: (): string => {
      return ':'
    },
  }
}

export default CoreCache
