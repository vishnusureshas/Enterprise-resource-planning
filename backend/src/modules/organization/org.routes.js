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
const { cacheAside } = require('../../middleware/cache');

router.use(authenticate);

router.get('/', authorize('organization:read'), cacheAside({ key: (req) => `erp:${req.user.org}:organization`, ttl: 600 }), getCurrent);
router.get('/settings', authorize('organization:read'), cacheAside({ key: (req) => `erp:${req.user.org}:organization:settings`, ttl: 600 }), getSettings);
router.get('/stats', authorize('organization:read'), cacheAside({ key: (req) => `erp:${req.user.org}:organization:stats`, ttl: 120 }), getStats);
router.patch('/', authorize('organization:update'), auditLog('org.update', { auditableType: 'organization' }), update);
router.patch('/settings', authorize('organization:update'), auditLog('org.update_settings', { auditableType: 'organization' }), updateSettings);

module.exports = router;
