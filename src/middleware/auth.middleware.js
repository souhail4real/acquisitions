import logger from '#config/logger.js';
import { jwttoken } from '#utils/jwt.js';

export const authenticateToken = (req, res, next) => {
  try {
    // Get token from cookie or Authorization header
    let token = req.cookies?.token;
    
    if (!token) {
      const authHeader = req.headers['authorization'];
      token = authHeader && authHeader.startsWith('Bearer ') 
        ? authHeader.substring(7) 
        : null;
    }

    if (!token) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'No token provided',
      });
    }

    // Verify token
    const decoded = jwttoken.verify(token);
    
    if (!decoded) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Invalid token',
      });
    }

    // Attach user info to request
    req.user = decoded;
    
    logger.info(`User ${decoded.email} authenticated successfully`);
    next();
  } catch (error) {
    logger.error('Authentication middleware error', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Token expired',
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Invalid token',
      });
    }
    
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Authentication failed',
    });
  }
};

export const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'User not authenticated',
      });
    }

    const userRole = req.user.role;
    
    if (!allowedRoles.includes(userRole)) {
      logger.warn(`User ${req.user.email} attempted to access restricted resource. Role: ${userRole}, Required: ${allowedRoles.join(', ')}`);
      
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient permissions',
      });
    }

    next();
  };
};

// Optional authentication - continues even if no token
export const optionalAuth = (req, res, next) => {
  try {
    let token = req.cookies?.token;
    
    if (!token) {
      const authHeader = req.headers['authorization'];
      token = authHeader && authHeader.startsWith('Bearer ') 
        ? authHeader.substring(7) 
        : null;
    }

    if (token) {
      const decoded = jwttoken.verify(token);
      if (decoded) {
        req.user = decoded;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication if token is invalid
    logger.debug('Optional auth failed, continuing without user context', error);
    next();
  }
};