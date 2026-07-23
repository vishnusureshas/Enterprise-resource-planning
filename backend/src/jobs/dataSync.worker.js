const logger = require('../config/logger');

async function syncData(job) {
  logger.info({ jobId: job.id, entity: job.data.entity }, 'Syncing data');
}

module.exports = { syncData };
