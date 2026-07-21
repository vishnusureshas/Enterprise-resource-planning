const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const { redis } = require('../config/redis');
const env = require('../config/env');

const createRateLimiter = (options = {}) => {
  // Skip rate limiting in test environment
  if (env.nodeEnv === 'test') {
    return (req, res, next) => next();
  }

  const defaultOptions = {
    windowMs: 60 * 1000, // 1 minute
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        error: {
          code: 'TOO_MANY_REQUESTS',
          message: 'Too many requests, please try again later',
        },
      });
    },
    skip: (req) => req.path === '/api/health' || req.path === '/api/metrics',
  };

  const limiterOptions = { ...defaultOptions, ...options };

  if (env.nodeEnv === 'production' && redis.status === 'ready') {
    limiterOptions.store = new RedisStore({
      sendCommand: (...args) => redis.call(...args),
      prefix: 'ratelimit:',
    });
  }

  return rateLimit(limiterOptions);
};

// Predefined limiters for different endpoint types
const limiters = {
  // Auth endpoints - strict
  auth: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'development' ? 50 : 5,
    message: 'Too many authentication attempts, please try again later',
  }),

  // API endpoints - moderate
  api: createRateLimiter({
    windowMs: 60 * 1000,
    max: 100,
  }),

  // Search/Report endpoints - stricter
  heavy: createRateLimiter({
    windowMs: 60 * 1000,
    max: 20,
  }),

  // File upload - very strict
  upload: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50,
  }),

  // Webhook endpoints - moderate
  webhook: createRateLimiter({
    windowMs: 60 * 1000,
    max: 1000,
  }),
};

module.exports = { createRateLimiter, limiters };