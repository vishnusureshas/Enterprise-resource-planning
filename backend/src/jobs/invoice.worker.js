const logger = require('../config/logger');

async function processInvoice(job) {
  logger.info({ jobId: job.id, orderId: job.data.orderId }, 'Processing invoice generation');
}

module.exports = { processInvoice };
