// In-memory cache for client-side caching
class MemoryCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()

  set(key: string, data: any, ttlMs: number = 5 * 60 * 1000) { // Default 5 minutes
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    })
  }

  get(key: string): any | null {
    const item = this.cache.get(key)
    
    if (!item) {
      return null
    }

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }

    return item.data
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key)
      }
    }
  }
}

export const memoryCache = new MemoryCache()

// Cleanup expired entries every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    memoryCache.cleanup()
  }, 5 * 60 * 1000)
}

// Cache key generators
export const cacheKeys = {
  products: (filters?: any) => `products:${JSON.stringify(filters || {})}`,
  product: (id: string) => `product:${id}`,
  metrics: (type: string, params?: any) => `metrics:${type}:${JSON.stringify(params || {})}`,
  dashboard: () => 'dashboard:overview',
  admins: () => 'admins:list'
}

// Cached fetch wrapper
export async function cachedFetch<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlMs?: number
): Promise<T> {
  // Try to get from cache first
  const cached = memoryCache.get(key)
  if (cached) {
    return cached
  }

  // Fetch fresh data
  const data = await fetchFn()
  
  // Cache the result
  memoryCache.set(key, data, ttlMs)
  
  return data
}

// Cache invalidation helpers
export const cacheInvalidation = {
  products: () => {
    // Invalidate all product-related cache entries
    const keysToDelete: string[] = []
    for (const [key] of memoryCache['cache'].entries()) {
      if (key.startsWith('products:') || key.startsWith('product:') || key.startsWith('dashboard:')) {
        keysToDelete.push(key)
      }
    }
    keysToDelete.forEach(key => memoryCache.delete(key))
  },
  
  product: (id: string) => {
    memoryCache.delete(cacheKeys.product(id))
    // Also invalidate products list cache
    const keysToDelete: string[] = []
    for (const [key] of memoryCache['cache'].entries()) {
      if (key.startsWith('products:') || key.startsWith('dashboard:')) {
        keysToDelete.push(key)
      }
    }
    keysToDelete.forEach(key => memoryCache.delete(key))
  },
  
  dashboard: () => {
    const keysToDelete: string[] = []
    for (const [key] of memoryCache['cache'].entries()) {
      if (key.startsWith('dashboard:') || key.startsWith('metrics:')) {
        keysToDelete.push(key)
      }
    }
    keysToDelete.forEach(key => memoryCache.delete(key))
  }
}