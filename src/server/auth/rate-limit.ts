interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up stale entries every 10 minutes
if (typeof setInterval !== "undefined") {
  setInterval(
    () => {
      const now = Date.now();
      for (const [key, value] of store.entries()) {
        if (now > value.resetAt) {
          store.delete(key);
        }
      }
    },
    10 * 60 * 1000,
  ).unref?.();
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
}

/**
 * In-memory sliding rate limiter for authentication endpoints.
 * @param identifier Unique key (e.g. `login:${ip}:${employeeId}`)
 * @param limit Max attempts allowed in window
 * @param windowSeconds Window length in seconds (default: 900s = 15m)
 */
export function checkRateLimit(
  identifier: string,
  limit = 5,
  windowSeconds = 900,
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(identifier);

  if (!entry || now > entry.resetAt) {
    store.set(identifier, {
      count: 1,
      resetAt: now + windowSeconds * 1000,
    });
    return {
      allowed: true,
      remaining: limit - 1,
      resetInSeconds: windowSeconds,
    };
  }

  if (entry.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetInSeconds: Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  entry.count += 1;
  return {
    allowed: true,
    remaining: limit - entry.count,
    resetInSeconds: Math.ceil((entry.resetAt - now) / 1000),
  };
}

export function resetRateLimit(identifier: string): void {
  store.delete(identifier);
}
