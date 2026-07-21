const Redis = require('ioredis');
const { redis: redisConfig } = require('./env');

const createRedisClient = (db = 0) => {
  if (redisConfig.url) {
    return new Redis(redisConfig.url, {
      db,
      retryStrategy: (times) => Math.min(times * 50, 2000),
      enableReadyCheck: true,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
  }
  return new Redis({
    host: redisConfig.host,
    port: redisConfig.port,
    password: redisConfig.password || undefined,
    db,
    retryStrategy: (times) => Math.min(times * 50, 2000),
    enableReadyCheck: true,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });
};

const redis = createRedisClient(redisConfig.db);
const redisQueue = createRedisClient(redisConfig.queueDb);
const redisSub = createRedisClient(redisConfig.db);

redis.on('error', (err) => console.error('Redis error:', err));
redisQueue.on('error', (err) => console.error('Redis Queue error:', err));
redisSub.on('error', (err) => console.error('Redis Sub error:', err));

module.exports = { redis, redisQueue, redisSub, createRedisClient };