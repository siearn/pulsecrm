type CacheItem<T> = {
  value: T
  expiry: number
}

export class Cache<T> {
  private cache: Map<string, CacheItem<T>>
  private defaultTtl: number

  constructor(defaultTtl = 60 * 1000) {
    // Default TTL: 1 minute
    this.cache = new Map()
    this.defaultTtl = defaultTtl
  }

  set(key: string, value: T, ttl = this.defaultTtl): void {
    const expiry = Date.now() + ttl
    this.cache.set(key, { value, expiry })
  }

  get(key: string): T | undefined {
    const item = this.cache.get(key)

    // Return undefined if item doesn't exist or has expired
    if (!item || Date.now() > item.expiry) {
      if (item) this.cache.delete(key) // Clean up expired item
      return undefined
    }

    return item.value
  }

  has(key: string): boolean {
    const item = this.cache.get(key)

    // Return false if item doesn't exist or has expired
    if (!item || Date.now() > item.expiry) {
      if (item) this.cache.delete(key) // Clean up expired item
      return false
    }

    return true
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  // Clean up expired items
  cleanup(): void {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key)
      }
    }
  }

  // Get all valid keys
  keys(): string[] {
    const now = Date.now()
    const validKeys: string[] = []

    for (const [key, item] of this.cache.entries()) {
      if (now <= item.expiry) {
        validKeys.push(key)
      }
    }

    return validKeys
  }

  // Get cache size (valid items only)
  size(): number {
    return this.keys().length
  }
}

// Create cache instances for different purposes
export const userCache = new Cache<any>(5 * 60 * 1000) // 5 minutes
export const companyCache = new Cache<any>(10 * 60 * 1000) // 10 minutes
export const settingsCache = new Cache<any>(30 * 60 * 1000) // 30 minutes

