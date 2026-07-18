const express = require('express');
const router = express.Router();

const {
  list,
  getById,
  create,
  update,
  remove,
} = require('./user.controller');

const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/authorize');
const { auditLog } = require('../../middleware/auditLog');

router.use(authenticate);

router.get('/', authorize('user:read'), list);
router.get('/:id', authorize('user:read'), getById);
router.post('/', authorize('user:create'), auditLog('user.create', { auditableType: 'user' }), create);
router.patch('/:id', authorize('user:update'), auditLog('user.update', { auditableType: 'user', auditableId: (req) => req.params.id }), update);
router.delete('/:id', authorize('user:delete'), auditLog('user.delete', { auditableType: 'user', auditableId: (req) => req.params.id }), remove);

module.exports = router;
