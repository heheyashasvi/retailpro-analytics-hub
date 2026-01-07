// Simple in-memory rate limiting implementation
// In production, you'd want to use Redis or a similar store

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000)

export async function rateLimit(
  identifier: string,
  maxRequests: number,
  windowMs: number
): Promise<boolean> {
  const now = Date.now()
  const key = `${identifier}:${Math.floor(now / windowMs)}`
  
  const entry = rateLimitStore.get(key)
  
  if (!entry) {
    // First request in this window
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
    })
    return true
  }
  
  if (entry.count >= maxRequests) {
    return false
  }
  
  entry.count++
  return true
}

export function getRateLimitInfo(
  identifier: string,
  windowMs: number
): { remaining: number; resetTime: number } | null {
  const now = Date.now()
  const key = `${identifier}:${Math.floor(now / windowMs)}`
  
  const entry = rateLimitStore.get(key)
  
  if (!entry) {
    return null
  }
  
  return {
    remaining: Math.max(0, entry.count),
    resetTime: entry.resetTime,
  }
}