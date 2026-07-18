require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const session = require('express-session');
const RedisStoreSession = require('connect-redis').default;
const promClient = require('prom-client');
const Sentry = require('@sentry/node');

const env = require('./config/env');
const { redis } = require('./config/redis');
const logger = require('./config/logger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { limiters } = require('./middleware/rateLimiter');
const { authenticate } = require('./middleware/auth');

const authRoutes = require('./modules/auth/auth.routes');
const userRoutes = require('./modules/user/user.routes');
const roleRoutes = require('./modules/role/role.routes');
const orgRoutes = require('./modules/organization/org.routes');
const auditRoutes = require('./modules/audit-trail/audit.routes');
const inventoryRoutes = require('./modules/inventory/inventory.routes');
const customerRoutes = require('./modules/customer/customer.routes');
const orderRoutes = require('./modules/order/order.routes');
const vendorRoutes = require('./modules/vendor/vendor.routes');
const purchaseOrderRoutes = require('./modules/procurement/purchase-order.routes');

// Connect Redis on startup (lazyConnect is used in config)
redis.connect().catch((err) => logger.error({ err }, 'Redis connection failed'));

const app = express();

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Sentry initialization
if (env.sentry.dsn) {
  Sentry.init({
    dsn: env.sentry.dsn,
    environment: env.nodeEnv,
    tracesSampleRate: 0.1,
  });
  app.use(Sentry.Handlers.requestHandler());
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

// CORS
const allowedOrigins = env.nodeEnv === 'production'
  ? (process.env.CORS_ORIGINS || 'https://*.up.railway.app').split(',')
  : ['http://localhost:3000', 'http://localhost:5173'];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.some(o => o.includes('*') ? new RegExp(o.replace('*', '.*')).test(origin) : o === origin)) {
      cb(null, true);
    } else {
      cb(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session
app.use(session({
  store: new RedisStoreSession({ client: redis, prefix: 'sess:' }),
  secret: env.session.secret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: env.nodeEnv === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax',
  },
}));

// Rate limiting
app.use('/api/auth', limiters.auth);
app.use('/api', limiters.api);

// Prometheus metrics
const collectDefaultMetrics = promClient.collectDefaultMetrics;
collectDefaultMetrics({ timeout: 5000 });

const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
});

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration.observe({ method: req.method, route: req.route?.path || req.path, status_code: res.statusCode }, duration);
  });
  next();
});

// Health check
app.get('/api/health', async (req, res) => {
  const dbHealthy = await require('./config/db').healthCheck();
  const redisHealthy = redis.status === 'ready';

  const healthy = dbHealthy && redisHealthy;

  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    checks: {
      database: dbHealthy,
      redis: redisHealthy,
    },
  });
});

// Prometheus metrics endpoint
app.get('/api/metrics', async (req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.end(await promClient.register.metrics());
});

// API routes
app.use(`${env.apiPrefix}/auth`, authRoutes);
app.use(`${env.apiPrefix}/users`, userRoutes);
app.use(`${env.apiPrefix}/roles`, roleRoutes);
app.use(`${env.apiPrefix}/organizations`, orgRoutes);
app.use(`${env.apiPrefix}/audit-logs`, auditRoutes);
app.use(`${env.apiPrefix}/inventory`, inventoryRoutes);
app.use(`${env.apiPrefix}/customers`, customerRoutes);
app.use(`${env.apiPrefix}/orders`, orderRoutes);
app.use(`${env.apiPrefix}/vendors`, vendorRoutes);
app.use(`${env.apiPrefix}/purchase-orders`, purchaseOrderRoutes);

// Sentry error handler (before other error handlers)
if (env.sentry.dsn) {
  app.use(Sentry.Handlers.errorHandler());
}

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Start server
const server = app.listen(env.port, () => {
  logger.info(`Server running on port ${env.port} in ${env.nodeEnv} mode`);
});

// Graceful shutdown
const shutdown = async (signal) => {
  logger.info(`${signal} received, shutting down gracefully`);
  server.close(async () => {
    logger.info('HTTP server closed');
    try {
      await redis.quit();
      logger.info('Redis connection closed');
      process.exit(0);
    } catch (err) {
      logger.error('Error during shutdown', { error: err.message });
      process.exit(1);
    }
  });

  // Force close after 10 seconds
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

module.exports = app;