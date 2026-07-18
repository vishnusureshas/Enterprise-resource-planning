const { redis } = require('../config/redis');
const logger = require('../config/logger');

function cacheAside({ key, ttl = 300 } = {}) {
  return async (req, res, next) => {
    if (!key) return next();

    const cacheKey = typeof key === 'function' ? key(req) : key;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        logger.debug(`Cache HIT: ${cacheKey}`);
        res.set('X-Cache', 'HIT');
        return res.json(JSON.parse(cached));
      }

      logger.debug(`Cache MISS: ${cacheKey}`);
      res.set('X-Cache', 'MISS');

      const originalJson = res.json.bind(res);
      res.json = (body) => {
        if (res.statusCode < 400) {
          redis.setex(cacheKey, ttl, JSON.stringify(body)).catch((err) => {
            logger.warn({ err: err.message }, 'Failed to set cache');
          });
        }
        return originalJson(body);
      };

      next();
    } catch (err) {
      logger.warn({ err: err.message, cacheKey }, 'Cache read error');
      next();
    }
  };
}

async function invalidateCache(keys) {
  if (!keys || keys.length === 0) return;

  try {
    const pipeline = redis.pipeline();
    for (const key of keys) {
      if (key.includes('*')) {
        const stream = redis.scanStream({ match: key, count: 100 });
        for await (const matchedKeys of stream) {
          if (matchedKeys.length > 0) {
            pipeline.del(...matchedKeys);
          }
        }
      } else {
        pipeline.del(key);
      }
    }
    await pipeline.exec();
    logger.debug({ keys }, 'Cache invalidated');
  } catch (err) {
    logger.warn({ err: err.message, keys }, 'Cache invalidation error');
  }
}

module.exports = { cacheAside, invalidateCache };
