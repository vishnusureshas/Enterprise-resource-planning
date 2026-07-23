const { Worker } = require('bullmq');
const { redisQueue } = require('../config/redis');
const logger = require('../config/logger');

const { processInvoice } = require('./invoice.worker');
const { sendEmail } = require('./email.worker');
const { generateReport } = require('./report.worker');
const { checkStockAlerts } = require('./stockAlert.worker');
const { syncData } = require('./dataSync.worker');

const workers = [];

async function startWorkers() {
  const connection = {
    connection: redisQueue,
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
