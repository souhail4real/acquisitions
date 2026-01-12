import logger from '#config/logger.js';

// Suspicious user agent patterns
const SUSPICIOUS_USER_AGENTS = [
  /bot/i,
  /crawler/i,
  /spider/i,
  /scraper/i,
  /curl/i,
  /wget/i,
  /postman/i, // Remove if you use Postman for testing
  /insomnia/i, // Remove if you use Insomnia for testing
];

// Suspicious headers that might indicate automated requests
const SUSPICIOUS_HEADERS = [
  'x-forwarded-for',
  'x-real-ip',
  'cf-connecting-ip',
  'x-client-ip',
];

// Known malicious IPs (you can extend this list)
const BLOCKED_IPS = new Set([
  // Add known malicious IPs here
  // '192.168.1.100',
]);

// Request fingerprinting for anomaly detection
const requestFingerprints = new Map();

const generateFingerprint = (req) => {
  const components = [
    req.ip,
    req.get('User-Agent') || '',
    req.get('Accept-Language') || '',
    req.get('Accept-Encoding') || '',
  ];
  
  return Buffer.from(components.join('|')).toString('base64');
};

export const securityMiddleware = (req, res, next) => {
  const startTime = Date.now();
  
  try {
    // 1. Block known malicious IPs
    if (BLOCKED_IPS.has(req.ip)) {
      logger.warn(`Blocked request from known malicious IP: ${req.ip}`);
      return res.status(403).json({
        error: 'Access denied',
        message: 'Request blocked',
      });
    }

    // 2. Check for suspicious user agents (configurable)
    const userAgent = req.get('User-Agent') || '';
    const suspiciousUA = SUSPICIOUS_USER_AGENTS.some(pattern => pattern.test(userAgent));
    
    if (suspiciousUA && process.env.BLOCK_SUSPICIOUS_UA === 'true') {
      logger.warn(`Suspicious user agent detected: ${userAgent} from IP: ${req.ip}`);
      return res.status(403).json({
        error: 'Access denied',
        message: 'Request blocked',
      });
    }

    // 3. Header validation
    const suspiciousHeaders = Object.keys(req.headers).filter(header => 
      header.toLowerCase().includes('x-forwarded') && 
      req.headers[header].includes(',')
    );

    if (suspiciousHeaders.length > 0) {
      logger.warn(`Potentially spoofed headers detected from IP: ${req.ip}`, {
        headers: suspiciousHeaders,
      });
    }

    // 4. Request size validation
    const contentLength = parseInt(req.get('Content-Length') || '0');
    const maxSize = parseInt(process.env.MAX_REQUEST_SIZE || '10485760'); // 10MB default

    if (contentLength > maxSize) {
      logger.warn(`Request too large: ${contentLength} bytes from IP: ${req.ip}`);
      return res.status(413).json({
        error: 'Payload too large',
        message: `Request size exceeds ${maxSize} bytes`,
      });
    }

    // 5. Request fingerprinting and anomaly detection
    const fingerprint = generateFingerprint(req);
    const now = Date.now();
    
    if (requestFingerprints.has(fingerprint)) {
      const data = requestFingerprints.get(fingerprint);
      data.count += 1;
      data.lastSeen = now;
      
      // If too many requests from same fingerprint in short time
      if (data.count > 10 && (now - data.firstSeen) < 60000) { // 10 requests in 1 minute
        logger.warn(`Potential bot detected - fingerprint: ${fingerprint.substring(0, 10)}... from IP: ${req.ip}`);
        
        if (process.env.BLOCK_RAPID_REQUESTS === 'true') {
          return res.status(429).json({
            error: 'Too many requests',
            message: 'Request pattern indicates automated behavior',
          });
        }
      }
    } else {
      requestFingerprints.set(fingerprint, {
        count: 1,
        firstSeen: now,
        lastSeen: now,
        ip: req.ip,
      });
    }

    // 6. Clean old fingerprints (every hour)
    if (Math.random() < 0.001) { // 0.1% chance per request
      const oneHour = 60 * 60 * 1000;
      for (const [fp, data] of requestFingerprints.entries()) {
        if (now - data.lastSeen > oneHour) {
          requestFingerprints.delete(fp);
        }
      }
    }

    // 7. Add security headers
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    });

    // 8. Log security events
    if (suspiciousUA || suspiciousHeaders.length > 0) {
      logger.info('Security event logged', {
        ip: req.ip,
        userAgent,
        url: req.originalUrl,
        method: req.method,
        suspiciousUA,
        suspiciousHeaders,
        fingerprint: fingerprint.substring(0, 10),
      });
    }

    // Add processing time
    res.set('X-Security-Check-Time', `${Date.now() - startTime}ms`);
    
    next();
  } catch (error) {
    logger.error('Security middleware error', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Security check failed',
    });
  }
};

// IP whitelist middleware for admin routes
export const ipWhitelist = (allowedIPs = []) => {
  const allowedIPsSet = new Set(allowedIPs);
  
  return (req, res, next) => {
    if (allowedIPsSet.size === 0) {
      // If no IPs specified, allow all
      return next();
    }
    
    const clientIP = req.ip;
    
    if (!allowedIPsSet.has(clientIP)) {
      logger.warn(`IP not whitelisted: ${clientIP} attempting to access ${req.originalUrl}`);
      return res.status(403).json({
        error: 'Access denied',
        message: 'IP not authorized',
      });
    }
    
    next();
  };
};

// CORS configuration middleware
export const corsConfig = (req, res, next) => {
  const origin = req.get('Origin');
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:5173').split(',');
  
  if (!origin || allowedOrigins.includes(origin)) {
    res.set({
      'Access-Control-Allow-Origin': origin || '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400', // 24 hours
    });
  } else {
    logger.warn(`CORS: Blocked request from unauthorized origin: ${origin}`);
    return res.status(403).json({
      error: 'CORS error',
      message: 'Origin not allowed',
    });
  }
  
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  next();
};

export default securityMiddleware;