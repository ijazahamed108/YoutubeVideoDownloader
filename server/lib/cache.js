/** Minimal in-memory TTL cache with LRU-style eviction. */
export class TtlCache {
  constructor({ ttlMs, maxEntries = 200 }) {
    this.ttlMs = ttlMs
    this.maxEntries = maxEntries
    this.map = new Map()
  }

  get(key) {
    const entry = this.map.get(key)
    if (!entry) return undefined
    if (entry.expires < Date.now()) {
      this.map.delete(key)
      return undefined
    }
    // Refresh recency.
    this.map.delete(key)
    this.map.set(key, entry)
    return entry.value
  }

  set(key, value, ttlMs = this.ttlMs) {
    if (this.map.size >= this.maxEntries) {
      this.map.delete(this.map.keys().next().value)
    }
    this.map.set(key, { value, expires: Date.now() + ttlMs })
  }

  delete(key) {
    this.map.delete(key)
  }
}

/** Fixed-window per-key rate limiter. */
export class RateLimiter {
  constructor({ windowMs, max }) {
    this.windowMs = windowMs
    this.max = max
    this.hits = new Map()
    setInterval(() => this.hits.clear(), windowMs).unref()
  }

  allow(key) {
    const count = (this.hits.get(key) || 0) + 1
    this.hits.set(key, count)
    return count <= this.max
  }

  middleware() {
    return (req, res, next) => {
      if (this.allow(req.ip)) return next()
      res.status(429).json({ error: 'Too many requests. Please slow down.' })
    }
  }
}
