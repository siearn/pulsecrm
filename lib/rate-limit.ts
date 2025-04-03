export interface RateLimitConfig {
  limit: number
  windowMs: number
}

export class RateLimiter {
  private cache: Map<string, { count: number; resetTime: number }>
  private limit: number
  private windowMs: number

  constructor({ limit, windowMs }: RateLimitConfig) {
    this.cache = new Map()
    this.limit = limit
    this.windowMs = windowMs
  }

  check(key: string): { success: boolean; limit: number; remaining: number; resetTime: number } {
    const now = Date.now()
    const record = this.cache.get(key)

    // If no record exists or the record has expired, create a new one
    if (!record || now > record.resetTime) {
      const resetTime = now + this.windowMs
      this.cache.set(key, { count: 1, resetTime })
      return { success: true, limit: this.limit, remaining: this.limit - 1, resetTime }
    }

    // If the record exists and is within the window, increment the count
    if (record.count < this.limit) {
      record.count++
      this.cache.set(key, record)
      return { success: true, limit: this.limit, remaining: this.limit - record.count, resetTime: record.resetTime }
    }

    // If the record exists and the count is at or above the limit, reject the request
    return { success: false, limit: this.limit, remaining: 0, resetTime: record.resetTime }
  }

  // Clean up expired records periodically
  cleanup() {
    const now = Date.now()
    for (const [key, record] of this.cache.entries()) {
      if (now > record.resetTime) {
        this.cache.delete(key)
      }
    }
  }
}

// Create rate limiters with different configurations
export const apiLimiter = new RateLimiter({ limit: 60, windowMs: 60 * 1000 }) // 60 requests per minute
export const authLimiter = new RateLimiter({ limit: 10, windowMs: 60 * 1000 }) // 10 requests per minute
export const webhookLimiter = new RateLimiter({ limit: 100, windowMs: 60 * 1000 }) // 100 requests per minute

// Middleware to apply rate limiting
export function withRateLimit(limiter: RateLimiter) {
  return async (req: Request) => {
    // Get IP address from headers or request
    const ip = req.headers.get("x-forwarded-for") || "unknown"

    // Check rate limit
    const result = limiter.check(ip)

    if (!result.success) {
      return new Response(JSON.stringify({ error: "Too many requests" }), {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "X-RateLimit-Limit": result.limit.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": Math.ceil(result.resetTime / 1000).toString(),
          "Retry-After": Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
        },
      })
    }

    return null
  }
}

