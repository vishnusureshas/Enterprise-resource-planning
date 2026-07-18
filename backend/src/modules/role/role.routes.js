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

router.use(authenticate);

router.get('/', authorize('role:read'), list);
router.get('/permissions', authorize('role:read'), listPermissions);
router.get('/:id', authorize('role:read'), getById);
router.post('/', authorize('role:create'), auditLog('role.create', { auditableType: 'role' }), create);
router.patch('/:id', authorize('role:update'), auditLog('role.update', { auditableType: 'role', auditableId: (req) => req.params.id }), update);
router.delete('/:id', authorize('role:delete'), auditLog('role.delete', { auditableType: 'role', auditableId: (req) => req.params.id }), remove);

module.exports = router;
