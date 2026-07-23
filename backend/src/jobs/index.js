const logger = require('../config/logger');

async function startWorkers() {
  logger.info('Background workers initialized');
}

module.exports = { startWorkers };
