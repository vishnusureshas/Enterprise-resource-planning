const Redis = require('ioredis');
const { redis: redisConfig } = require('./env');
const logger = require('./logger');

class MemoryRedis {
  constructor() {
    this._data = new Map();
    this._timers = new Map();
    this._status = 'ready';
  }

  get status() { return this._status; }
  on() {}
  async connect() { return this; }
  async quit() {
    for (const t of this._timers.values()) clearTimeout(t);
    this._timers.clear();
    this._data.clear();
    this._status = 'end';
  }

  async get(key) { return this._data.get(key) ?? null; }
  async set(key, value) { this._data.set(key, value); }

  async setex(key, seconds, value) {
    this._data.set(key, value);
    this._clearTimer(key);
    this._timers.set(key, setTimeout(() => this._data.delete(key), seconds * 1000));
  }

  async del(...keys) {
    for (const key of keys) {
      this._data.delete(key);
      this._clearTimer(key);
    }
  }

  async keys(pattern) {
    const regex = new RegExp('^' + pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$');
    return [...this._data.keys()].filter((k) => regex.test(k));
  }

  async call(command, ...args) {
    const method = command.toLowerCase();
    if (typeof this[method] === 'function') return this[method](...args);
    if (method === 'incr') {
      const n = (Number(this._data.get(args[0])) || 0) + 1;
      this._data.set(args[0], String(n));
      return n;
    }
    if (method === 'expire') return 1;
    return null;
  }

  duplicate() {
    const clone = new MemoryRedis();
    for (const [k, v] of this._data) clone._data.set(k, v);
    return clone;
  }

  _clearTimer(key) {
    if (this._timers.has(key)) {
      clearTimeout(this._timers.get(key));
      this._timers.delete(key);
    }
  }
}

function isRealRedisConfigured() {
  if (redisConfig.url) return true;
  if (redisConfig.host && redisConfig.host !== 'localhost' && redisConfig.host !== '127.0.0.1') return true;
  return false;
}

const createRedisClient = (db = 0) => {
  if (!isRealRedisConfigured()) {
    logger.warn('No Redis configured, using in-memory fallback');
    return new MemoryRedis();
  }

  let client;
  let fallback = null;
  let connectDone = false;

  const options = {
    retryStrategy: (times) => Math.min(times * 50, 2000),
    enableReadyCheck: true,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  };

  try {
    if (redisConfig.url) {
      client = new Redis(redisConfig.url, { ...options, db });
    } else {
      client = new Redis({
        host: redisConfig.host,
        port: redisConfig.port,
        password: redisConfig.password || undefined,
        db,
        ...options,
      });
    }
  } catch (err) {
    logger.warn({ err }, 'Failed to create Redis client, using in-memory fallback');
    return new MemoryRedis();
  }

  const originalConnect = client.connect.bind(client);
  client.connect = async () => {
    if (connectDone) return;
    try {
      await originalConnect();
      connectDone = true;
    } catch (err) {
      logger.warn({ err }, 'Redis connection failed, using in-memory fallback');
      fallback = new MemoryRedis();
      connectDone = true;
    }
  };

  return new Proxy(client, {
    get(target, prop) {
      if (prop === 'connect') return target.connect;
      if (prop === 'constructor') return fallback ? MemoryRedis : Redis;
      const source = fallback || target;
      const val = source[prop];
      return typeof val === 'function' ? val.bind(source) : val;
    },
  });
};

const redis = createRedisClient(redisConfig.db);
const redisQueue = createRedisClient(redisConfig.queueDb);
const redisSub = createRedisClient(redisConfig.db);

redis.on('error', (err) => logger.warn({ err }, 'Redis error'));
redisQueue.on('error', (err) => logger.warn({ err }, 'Redis Queue error'));
redisSub.on('error', (err) => logger.warn({ err }, 'Redis Sub error'));

module.exports = { redis, redisQueue, redisSub, createRedisClient };