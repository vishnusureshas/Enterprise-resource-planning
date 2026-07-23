require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const promClient = require('prom-client');
const Sentry = require('@sentry/node');

const env = require('./config/env');
const { redis } = require('./config/redis');
const logger = require('./config/logger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { limiters } = require('./middleware/rateLimiter');

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
const manufacturingRoutes = require('./modules/manufacturing/manufacturing.routes');
const qualityRoutes = require('./modules/quality/quality.routes');

const app = express();

app.set('trust proxy', 1);

if (env.sentry.dsn) {
  Sentry.init({
    dsn: env.sentry.dsn,
    environment: env.nodeEnv,
    tracesSampleRate: 0.1,
  });
  app.use(Sentry.Handlers.requestHandler());
}

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

const allowedOrigins = env.nodeEnv === 'production'
  ? (process.env.CORS_ORIGINS || 'https://*.onrender.com').split(',')
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

app.use(compression());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api/auth', limiters.auth);
app.use('/api', limiters.api);

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

app.get('/api/health', async (req, res) => {
  const dbHealthy = await require('./config/db').healthCheck();
  const redisHealthy = redis.status === 'ready';

  res.status(dbHealthy ? 200 : 503).json({
    status: dbHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    checks: {
      database: dbHealthy,
      redis: redisHealthy,
    },
  });
});

app.get('/api/metrics', async (req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.end(await promClient.register.metrics());
});

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
app.use(`${env.apiPrefix}/manufacturing`, manufacturingRoutes);
app.use(`${env.apiPrefix}/quality`, qualityRoutes);

if (env.sentry.dsn) {
  app.use(Sentry.Handlers.errorHandler());
}

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
