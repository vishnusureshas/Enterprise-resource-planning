const logger = require('../config/logger');

async function checkStockAlerts(job) {
  logger.info({ jobId: job.id }, 'Checking stock alerts');
}

module.exports = { checkStockAlerts };
