const { Worker } = require('bullmq');
const env = require('../config/env');
const logger = require('../config/logger');

const { processInvoice } = require('./invoice.worker');
const { sendEmail } = require('./email.worker');
const { generateReport } = require('./report.worker');
const { checkStockAlerts } = require('./stockAlert.worker');
const { syncData } = require('./dataSync.worker');

const workers = [];

function getRedisConnection() {
  if (env.redis.url) {
    return { url: env.redis.url };
  }
  return {
    host: env.redis.host,
    port: env.redis.port,
    password: env.redis.password || undefined,
  };
}

async function startWorkers() {
  const redisConf = env.redis;
  if (!redisConf.url && (!redisConf.host || redisConf.host === 'localhost' || redisConf.host === '127.0.0.1')) {
    logger.warn('No real Redis configured, skipping background workers');
    return;
  }

  const connection = {
    connection: getRedisConnection(),
    concurrency: 5,
    limiter: { max: 100, duration: 1000 },
  };

  workers.push(
    new Worker('invoice-generation', processInvoice, connection),
    new Worker('email-notification', sendEmail, connection),
    new Worker('report-generation', generateReport, connection),
    new Worker('stock-alert', checkStockAlerts, { ...connection, concurrency: 1 }),
    new Worker('data-sync', syncData, { ...connection, concurrency: 2 }),
  );

  for (const w of workers) {
    w.on('completed', (job) => logger.info({ jobId: job.id, queue: job.queueName }, 'Job completed'));
    w.on('failed', (job, err) => logger.error({ jobId: job?.id, queue: job?.queueName, err: err.message }, 'Job failed'));
  }

  logger.info(`Background workers initialized: ${workers.length} queues`);
}

async function stopWorkers() {
  await Promise.all(workers.map((w) => w.close()));
  logger.info('Background workers stopped');
}

module.exports = { startWorkers, stopWorkers };
