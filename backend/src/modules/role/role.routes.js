const express = require('express');
const router = express.Router();

const {
  list,
  getById,
  create,
  update,
  remove,
  listPermissions,
} = require('./role.controller');

const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/authorize');
const { auditLog } = require('../../middleware/auditLog');
const { cacheAside } = require('../../middleware/cache');

router.use(authenticate);

router.get('/', authorize('role:read'), cacheAside({ key: (req) => `erp:${req.user.org}:roles`, ttl: 600 }), list);
router.get('/permissions', authorize('role:read'), cacheAside({ key: (req) => `erp:${req.user.org}:permissions`, ttl: 600 }), listPermissions);
router.get('/:id', authorize('role:read'), cacheAside({ key: (req) => `erp:${req.user.org}:role:${req.params.id}`, ttl: 600 }), getById);
router.post('/', authorize('role:create'), auditLog('role.create', { auditableType: 'role' }), create);
router.patch('/:id', authorize('role:update'), auditLog('role.update', { auditableType: 'role', auditableId: (req) => req.params.id }), update);
router.delete('/:id', authorize('role:delete'), auditLog('role.delete', { auditableType: 'role', auditableId: (req) => req.params.id }), remove);

module.exports = router;
