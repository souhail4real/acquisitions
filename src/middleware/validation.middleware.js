import logger from '#config/logger.js';

// SQL Injection patterns
const SQL_INJECTION_PATTERNS = [
  /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/i,
  /(;|--|\/\*|\*\/)/,
  /(\bor\b.*=.*\bor\b)/i,
  /(\band\b.*=.*\band\b)/i,
  /'.*(\bor\b|\band\b).*'/i,
];

// XSS patterns
const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<iframe|<object|<embed|<applet/gi,
  /expression\s*\(/gi,
];

// NoSQL Injection patterns
const NOSQL_PATTERNS = [
  /\$where/i,
  /\$ne/i,
  /\$gt/i,
  /\$lt/i,
  /\$regex/i,
  /\$or/i,
  /\$and/i,
];

// Path traversal patterns
const PATH_TRAVERSAL_PATTERNS = [
  /\.\.\//g,
  /\.\.\\/g,
  /%2e%2e%2f/gi,
  /%2e%2e%5c/gi,
];

const detectMaliciousContent = (value, patterns) => {
  if (typeof value !== 'string') return false;
  return patterns.some(pattern => pattern.test(value));
};

const sanitizeValue = (value) => {
  if (typeof value === 'string') {
    return value
      .replace(/[<>&"']/g, (char) => {
        const entities = {
          '<': '&lt;',
          '>': '&gt;',
          '&': '&amp;',
          '"': '&quot;',
          "'": '&#x27;'
        };
        return entities[char];
      })
      .trim();
  }
  return value;
};

const validateObject = (obj, path = '') => {
  const threats = [];
  
  if (obj === null || obj === undefined) {
    return threats;
  }
  
  if (typeof obj === 'string') {
    if (detectMaliciousContent(obj, SQL_INJECTION_PATTERNS)) {
      threats.push({ type: 'SQL_INJECTION', path, value: obj });
    }
    if (detectMaliciousContent(obj, XSS_PATTERNS)) {
      threats.push({ type: 'XSS', path, value: obj });
    }
    if (detectMaliciousContent(obj, NOSQL_PATTERNS)) {
      threats.push({ type: 'NOSQL_INJECTION', path, value: obj });
    }
    if (detectMaliciousContent(obj, PATH_TRAVERSAL_PATTERNS)) {
      threats.push({ type: 'PATH_TRAVERSAL', path, value: obj });
    }
    return threats;
  }
  
  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      threats.push(...validateObject(item, `${path}[${index}]`));
    });
    return threats;
  }
  
  if (typeof obj === 'object') {
    Object.keys(obj).forEach(key => {
      const currentPath = path ? `${path}.${key}` : key;
      threats.push(...validateObject(obj[key], currentPath));
    });
  }
  
  return threats;
};

export const inputValidation = (options = {}) => {
  const {
    sanitize = false,
    blockOnThreat = true,
    logThreats = true,
  } = options;

  return (req, res, next) => {
    const startTime = Date.now();
    
    try {
      // Validate body, query, and params
      const threats = [
        ...validateObject(req.body, 'body'),
        ...validateObject(req.query, 'query'),
        ...validateObject(req.params, 'params'),
      ];

      if (threats.length > 0) {
        if (logThreats) {
          logger.warn('Security threat detected', {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            url: req.originalUrl,
            method: req.method,
            threats: threats.map(t => ({
              type: t.type,
              path: t.path,
              value: String(t.value).substring(0, 100), // Limit logged value length
            })),
          });
        }

        if (blockOnThreat) {
          return res.status(400).json({
            error: 'Invalid input detected',
            message: 'Request contains potentially malicious content',
            timestamp: new Date().toISOString(),
          });
        }
      }

      // Sanitize if requested
      if (sanitize) {
        const sanitizeObj = (obj) => {
          if (obj === null || obj === undefined) return obj;
          
          if (typeof obj === 'string') {
            return sanitizeValue(obj);
          }
          
          if (Array.isArray(obj)) {
            return obj.map(sanitizeObj);
          }
          
          if (typeof obj === 'object') {
            const sanitized = {};
            Object.keys(obj).forEach(key => {
              sanitized[key] = sanitizeObj(obj[key]);
            });
            return sanitized;
          }
          
          return obj;
        };

        // Only sanitize body - req.query and req.params are read-only in Express 5
        if (req.body && typeof req.body === 'object') {
          req.body = sanitizeObj(req.body);
        }
      }

      // Add processing time header
      res.set('X-Validation-Time', `${Date.now() - startTime}ms`);
      
      next();
    } catch (error) {
      logger.error('Input validation middleware error', error);
      return res.status(500).json({
        error: 'Internal server error during validation',
      });
    }
  };
};

// Specific validation for API endpoints
export const apiValidation = inputValidation({
  sanitize: true,
  blockOnThreat: true,
  logThreats: true,
});

// Strict validation for auth endpoints
export const authValidation = inputValidation({
  sanitize: false, // Don't sanitize passwords
  blockOnThreat: true,
  logThreats: true,
});