import logger from './logger.js';

const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];

const optionalEnvVars = ['NODE_ENV', 'PORT', 'LOG_LEVEL'];

export const validateEnv = () => {
  const missing = [];
  const isDevelopment = process.env.NODE_ENV === 'development';

  requiredEnvVars.forEach(envVar => {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  });

  if (missing.length > 0 && !isDevelopment) {
    logger.error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }

  if (missing.length > 0 && isDevelopment) {
    logger.warn(
      `Missing environment variables in development: ${missing.join(', ')}`
    );
  }

  // Warn about missing optional vars
  optionalEnvVars.forEach(envVar => {
    if (!process.env[envVar]) {
      logger.debug(`Optional environment variable ${envVar} is not set`);
    }
  });

  // Validate specific values
  if (
    !['development', 'production', 'test'].includes(
      process.env.NODE_ENV || 'development'
    )
  ) {
    logger.warn(
      `Invalid NODE_ENV: ${process.env.NODE_ENV}. Using 'development'`
    );
  }

  if (
    process.env.NODE_ENV === 'production' &&
    process.env.JWT_SECRET ===
      'your-super-secret-jwt-key-change-this-in-production-12345!@#'
  ) {
    logger.error(
      '⚠️  CRITICAL: Using default JWT_SECRET in production! Change JWT_SECRET immediately!'
    );
    throw new Error('Cannot run in production with default JWT_SECRET');
  }

  logger.info('Environment variables validated successfully');
};
