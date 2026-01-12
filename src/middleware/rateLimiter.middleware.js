import logger from '#config/logger.js';

// Simple in-memory rate limiter (for production, consider Redis)
const requestCounts = new Map();
const blockedIPs = new Map();

// Clean up old entries every hour
setInterval(() => {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  
  for (const [key, data] of requestCounts.entries()) {
    if (now - data.firstRequest > oneHour) {
      requestCounts.delete(key);
    }
  }
  
  for (const [ip, blockTime] of blockedIPs.entries()) {
    if (now - blockTime > oneHour) {
      blockedIPs.delete(ip);
    }
  }
}, 60 * 60 * 1000);

export const createRateLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    maxRequests = 100, // max requests per window
    blockDuration = 60 * 60 * 1000, // 1 hour block
    skipSuccessfulRequests = false,
    keyGenerator = (req) => req.ip,
    message = 'Too many requests, please try again later.',
  } = options;

  return (req, res, next) => {
    const key = keyGenerator(req);
    const now = Date.now();

    // Check if IP is currently blocked
    if (blockedIPs.has(key)) {
      const blockTime = blockedIPs.get(key);
      if (now - blockTime < blockDuration) {
        logger.warn(`Blocked request from ${key} - still in cooldown period`);
        return res.status(429).json({
          error: 'IP temporarily blocked due to too many requests',
          retryAfter: Math.ceil((blockTime + blockDuration - now) / 1000),
        });
      } else {
        blockedIPs.delete(key);
      }
    }

    // Get or create request data for this key
    let requestData = requestCounts.get(key);
    if (!requestData) {
      requestData = {
        count: 0,
        firstRequest: now,
      };
    }

    // Reset if window has passed
    if (now - requestData.firstRequest > windowMs) {
      requestData = {
        count: 0,
        firstRequest: now,
      };
    }

    // Increment request count
    requestData.count += 1;
    requestCounts.set(key, requestData);

    // Check if limit exceeded
    if (requestData.count > maxRequests) {
      blockedIPs.set(key, now);
      logger.warn(`Rate limit exceeded for ${key}. Blocking for ${blockDuration}ms`);
      
      return res.status(429).json({
        error: message,
        retryAfter: Math.ceil(blockDuration / 1000),
      });
    }

    // Add rate limit headers
    res.set({
      'X-RateLimit-Limit': maxRequests,
      'X-RateLimit-Remaining': Math.max(0, maxRequests - requestData.count),
      'X-RateLimit-Reset': new Date(requestData.firstRequest + windowMs).toISOString(),
    });

    next();
  };
};

// Specific rate limiter for auth endpoints
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 attempts per 15 minutes
  blockDuration: 30 * 60 * 1000, // 30 minutes block
  message: 'Too many authentication attempts, please try again later.',
});

// General API rate limiter
export const apiRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests per 15 minutes
  message: 'Too many requests, please try again later.',
});