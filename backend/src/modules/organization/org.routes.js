const express = require('express');
const router = express.Router();

const {
  getCurrent,
  update,
  getSettings,
  updateSettings,
  getStats,
} = require('./org.controller');

const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/authorize');
const { auditLog } = require('../../middleware/auditLog');

router.use(authenticate);

router.get('/', authorize('organization:read'), getCurrent);
router.get('/settings', authorize('organization:read'), getSettings);
router.get('/stats', authorize('organization:read'), getStats);
router.patch('/', authorize('organization:update'), auditLog('org.update', { auditableType: 'organization' }), update);
router.patch('/settings', authorize('organization:update'), auditLog('org.update_settings', { auditableType: 'organization' }), updateSettings);

module.exports = router;
