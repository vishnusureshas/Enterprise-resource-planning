require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });

const session = require('express-session');
const RedisStoreSession = require('connect-redis').default;

const env = require('./config/env');
const { redis } = require('./config/redis');
const logger = require('./config/logger');
const app = require('./app');
const { startWorkers, stopWorkers } = require('./jobs');

let server;

async function init() {
  let sessionStore = new session.MemoryStore();

  try {
    await redis.connect();
    if (redis.status === 'ready') {
      sessionStore = new RedisStoreSession({ client: redis, prefix: 'sess:' });
      logger.info('Redis connected, using Redis session store');
    }
  } catch (err) {
    logger.warn({ err }, 'Redis not available, using in-memory session store');
  }

  app.use(session({
    store: sessionStore,
    secret: env.session.secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: env.nodeEnv === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: 'lax',
    },
  }));

  server = app.listen(env.port, () => {
    logger.info(`Server running on port ${env.port} in ${env.nodeEnv} mode`);
  });

  await startWorkers().catch((err) => {
    logger.warn({ err: err.message }, 'Background workers failed to start, continuing without them');
  });
}

init().catch((err) => {
  logger.error({ err }, 'Failed to initialize server');
  process.exit(1);
});

const shutdown = async (signal) => {
  logger.info(`${signal} received, shutting down gracefully`);
  server?.close(async () => {
    logger.info('HTTP server closed');
    await stopWorkers();
    try {
      await redis.quit();
      logger.info('Redis connection closed');
    } catch (err) {
      logger.error('Error during shutdown', { error: err.message });
    }
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { error: err.message, stack: err.stack });
  shutdown('uncaughtException');
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', { reason });
});
