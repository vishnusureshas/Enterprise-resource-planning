const express = require('express');
const router = express.Router();

const {
  list, get, create, updateStatus, receiveGoods, getReceipt, getTimeline,
} = require('./purchase-order.controller');

const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/authorize');
const { auditLog } = require('../../middleware/auditLog');

router.use(authenticate);

router.get('/', authorize('procurement:read'), list);
router.get('/:id', authorize('procurement:read'), get);
router.post('/', authorize('procurement:create'), auditLog('purchase_order.create', { auditableType: 'purchase_order' }), create);
router.patch('/:id/status', authorize('procurement:approve'), auditLog('purchase_order.update_status', { auditableType: 'purchase_order', auditableId: (req) => req.params.id }), updateStatus);
router.post('/:id/receive', authorize('procurement:receive'), auditLog('purchase_order.receive', { auditableType: 'purchase_order', auditableId: (req) => req.params.id }), receiveGoods);
router.get('/:id/receipts/:receiptId', authorize('procurement:read'), getReceipt);
router.get('/:id/timeline', authorize('procurement:read'), getTimeline);

module.exports = router;
