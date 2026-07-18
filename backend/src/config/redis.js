const Redis = require('ioredis');

const createRedisClient = (db = 0) => {
  if (process.env.REDIS_URL) {
    return new Redis(process.env.REDIS_URL, {
      db,
      retryStrategy: (times) => Math.min(times * 50, 2000),
      enableReadyCheck: true,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
  }
  return new Redis({
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT, 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db,
    retryStrategy: (times) => Math.min(times * 50, 2000),
    enableReadyCheck: true,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });
};

const redis = createRedisClient(parseInt(process.env.REDIS_DB, 10));
const redisQueue = createRedisClient(parseInt(process.env.REDIS_QUEUE_DB, 10));
const redisSub = createRedisClient(parseInt(process.env.REDIS_DB, 10));

redis.on('error', (err) => console.error('Redis error:', err));
redisQueue.on('error', (err) => console.error('Redis Queue error:', err));
redisSub.on('error', (err) => console.error('Redis Sub error:', err));

module.exports = { redis, redisQueue, redisSub, createRedisClient };