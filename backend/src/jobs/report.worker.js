const logger = require('../config/logger');

async function generateReport(job) {
  logger.info({ jobId: job.id, reportType: job.data.reportType }, 'Generating report');
}

module.exports = { generateReport };
