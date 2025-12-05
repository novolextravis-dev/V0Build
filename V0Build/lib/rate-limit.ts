interface RateLimitStore {
  [key: string]: { count: number; resetTime: number }
}

const store: RateLimitStore = {}

export function rateLimit(identifier: string, limit: number = 10, windowMs: number = 60000): boolean {
  const now = Date.now()
  const record = store[identifier]

  if (!record || now > record.resetTime) {
    store[identifier] = { count: 1, resetTime: now + windowMs }
    return true
  }

  if (record.count < limit) {
    record.count++
    return true
  }

  return false
}

export function getRateLimitInfo(identifier: string): { remaining: number; resetTime: number } {
  const now = Date.now()
  const record = store[identifier]

  if (!record || now > record.resetTime) {
    return { remaining: 10, resetTime: now + 60000 }
  }

  return {
    remaining: Math.max(0, 10 - record.count),
    resetTime: record.resetTime,
  }
}
