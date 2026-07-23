const logger = require('../config/logger');

async function sendEmail(job) {
  logger.info({ jobId: job.id, to: job.data.to, subject: job.data.subject }, 'Sending email');
}

module.exports = { sendEmail };
