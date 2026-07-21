const crypto = require('crypto');

const missing = [];

if (!process.env.DATABASE_URL) {
  for (const key of ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD']) {
    if (!process.env[key]) missing.push(key);
  }
}

if (missing.length > 0) {
  console.error('❌ Missing required environment variables:');
  missing.forEach((key) => console.error(`   - ${key}`));
  process.exit(1);
}

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  process.env.JWT_SECRET = crypto.randomBytes(32).toString('hex');
  console.warn('⚠️ JWT_SECRET auto-generated. Set it in Render Dashboard for persistence across restarts.');
}

if (!process.env.JWT_ACCESS_EXPIRY) {
  process.env.JWT_ACCESS_EXPIRY = '15m';
}

if (!process.env.JWT_REFRESH_EXPIRY) {
  process.env.JWT_REFRESH_EXPIRY = '7d';
}

if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
  process.env.SESSION_SECRET = crypto.randomBytes(32).toString('hex');
  console.warn('⚠️ SESSION_SECRET auto-generated. Set it in Render Dashboard for persistence across restarts.');
}

if (!process.env.ENCRYPTION_KEY || process.env.ENCRYPTION_KEY.length !== 64) {
  process.env.ENCRYPTION_KEY = crypto.randomBytes(32).toString('hex');
  console.warn('⚠️ ENCRYPTION_KEY auto-generated. Set it in Render Dashboard for persistence across restarts.');
}

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  apiPrefix: process.env.API_PREFIX || '/api',
  db: process.env.DATABASE_URL
    ? { url: process.env.DATABASE_URL, poolMin: 2, poolMax: 20 }
    : {
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT, 10),
        name: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        poolMin: parseInt(process.env.DB_POOL_MIN, 10) || 2,
        poolMax: parseInt(process.env.DB_POOL_MAX, 10) || 20,
      },
  redis: process.env.REDIS_URL
    ? { url: process.env.REDIS_URL, db: 0, queueDb: 1 }
    : {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT, 10) || 6379,
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB, 10) || 0,
        queueDb: parseInt(process.env.REDIS_QUEUE_DB, 10) || 1,
      },
  jwt: {
    secret: process.env.JWT_SECRET,
    accessExpiry: process.env.JWT_ACCESS_EXPIRY,
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY,
  },
  session: {
    secret: process.env.SESSION_SECRET,
  },
  encryption: {
    key: Buffer.from(process.env.ENCRYPTION_KEY, 'hex'),
  },
  email: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.EMAIL_FROM,
  },
  storage: {
    provider: process.env.STORAGE_PROVIDER || 'local',
    s3: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      bucket: process.env.AWS_S3_BUCKET,
      region: process.env.AWS_S3_REGION,
    },
  },
  sentry: {
    dsn: process.env.SENTRY_DSN,
  },
};