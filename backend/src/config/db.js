const { Pool } = require('pg');
const env = require('./env');
const logger = require('./logger');

const poolConfig = env.db.url
  ? { connectionString: env.db.url }
  : {
      host: env.db.host,
      port: env.db.port,
      database: env.db.name,
      user: env.db.user,
      password: env.db.password,
    };

poolConfig.min = env.db.poolMin;
poolConfig.max = env.db.poolMax;
poolConfig.idleTimeoutMillis = 30000;
poolConfig.connectionTimeoutMillis = 5000;

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  logger.error('Unexpected database pool error', { error: err.message });
});

pool.on('connect', () => {
  logger.debug('New database connection established');
});

const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug('Executed query', { duration, rows: result.rowCount });
    return result;
  } catch (error) {
    logger.error('Query error', { query: text, params, error: error.message });
    throw error;
  }
};

const getClient = async () => {
  const client = await pool.connect();
  const originalQuery = client.query.bind(client);
  const originalRelease = client.release.bind(client);

  client.query = async (text, params) => {
    const start = Date.now();
    try {
      const result = await originalQuery(text, params);
      const duration = Date.now() - start;
      logger.debug('Client query', { duration, rows: result.rowCount });
      return result;
    } catch (error) {
      logger.error('Client query error', { query: text, params, error: error.message });
      throw error;
    }
  };

  client.release = () => {
    logger.debug('Releasing client back to pool');
    originalRelease();
  };

  return client;
};

const transaction = async (callback) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const healthCheck = async () => {
  try {
    const result = await pool.query('SELECT 1');
    return result.rowCount === 1;
  } catch {
    return false;
  }
};

module.exports = {
  pool,
  query,
  getClient,
  transaction,
  healthCheck,
};