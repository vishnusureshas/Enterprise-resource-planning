const express = require('express');
const router = express.Router();

const {
  list,
  getByEntity,
  getByUser,
  exportLogs,
} = require('./audit.controller');

const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/authorize');
const { cacheAside } = require('../../middleware/cache');

router.use(authenticate);

router.get('/', authorize('audit:read'), cacheAside({ key: (req) => `erp:${req.user.org}:audit-logs:page:${req.query.page || 1}`, ttl: 60 }), list);
router.get('/export', authorize('audit:read'), exportLogs);
router.get('/user/:userId', authorize('audit:read'), cacheAside({ key: (req) => `erp:${req.user.org}:audit-logs:user:${req.params.userId}`, ttl: 60 }), getByUser);
router.get('/:entityType/:entityId', authorize('audit:read'), cacheAside({ key: (req) => `erp:${req.user.org}:audit-logs:entity:${req.params.entityType}:${req.params.entityId}`, ttl: 60 }), getByEntity);

module.exports = router;
