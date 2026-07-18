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

router.use(authenticate);

router.get('/', authorize('audit:read'), list);
router.get('/export', authorize('audit:read'), exportLogs);
router.get('/user/:userId', authorize('audit:read'), getByUser);
router.get('/:entityType/:entityId', authorize('audit:read'), getByEntity);

module.exports = router;
