/**
 * In-memory sliding-window rate limiter.
 *
 * Suitable for single-instance deployments (dev, small VPS).
 * On serverless (Vercel), limits apply per warm instance — adequate for beta
 * abuse prevention. For multi-instance production swap the store for Redis/Upstash.
 */

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

// Prune stale entries every 5 minutes to prevent unbounded memory growth.
const PRUNE_INTERVAL_MS = 5 * 60_000;
const MAX_WINDOW_MS = 10 * 60_000; // keep timestamps up to 10 min back

if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const cutoff = Date.now() - MAX_WINDOW_MS;
    for (const [key, entry] of store.entries()) {
      entry.timestamps = entry.timestamps.filter(t => t > cutoff);
      if (entry.timestamps.length === 0) store.delete(key);
    }
  }, PRUNE_INTERVAL_MS);
}

export interface RateLimitResult {
  /** Whether the request is permitted. */
  allowed: boolean;
  /** Remaining requests in the current window. */
  remaining: number;
  /** Milliseconds until the oldest slot frees up (0 when allowed). */
  resetInMs: number;
}

/**
 * Check and record a request.
 *
 * @param ip       Caller IP address
 * @param route    Route identifier — namespaces limits per endpoint
 * @param max      Maximum requests allowed per window
 * @param windowMs Window duration in milliseconds
 */
export function checkRateLimit(
  ip: string,
  route: string,
  max: number,
  windowMs: number,
): RateLimitResult {
  const key = `${route}:${ip}`;
  const now = Date.now();
  const windowStart = now - windowMs;

  const entry = store.get(key) ?? { timestamps: [] };
  entry.timestamps = entry.timestamps.filter(t => t > windowStart);

  if (entry.timestamps.length >= max) {
    const oldest = entry.timestamps[0];
    return {
      allowed: false,
      remaining: 0,
      resetInMs: Math.max(0, oldest + windowMs - now),
    };
  }

  entry.timestamps.push(now);
  store.set(key, entry);

  return {
    allowed: true,
    remaining: max - entry.timestamps.length,
    resetInMs: 0,
  };
}

/**
 * Extract the best available caller IP from a Next.js request.
 * Handles standard proxy headers and Vercel's x-real-ip.
 */
export function getCallerIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();

  const real = req.headers.get('x-real-ip');
  if (real) return real.trim();

  return 'unknown';
}
