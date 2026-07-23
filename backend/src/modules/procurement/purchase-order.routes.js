const express = require('express');
const router = express.Router();

const {
  list, get, create, updateStatus, receiveGoods, getReceipt, getTimeline, returnToVendor,
} = require('./purchase-order.controller');

const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/authorize');
const { auditLog } = require('../../middleware/auditLog');
const { cacheAside } = require('../../middleware/cache');

router.use(authenticate);

router.get('/', authorize('procurement:read'), cacheAside({ key: (req) => `erp:${req.user.org}:purchase-orders:page:${req.query.page || 1}:status:${req.query.status || 'all'}`, ttl: 120 }), list);
router.get('/:id', authorize('procurement:read'), cacheAside({ key: (req) => `erp:${req.user.org}:purchase-order:${req.params.id}`, ttl: 120 }), get);
router.post('/', authorize('procurement:create'), auditLog('purchase_order.create', { auditableType: 'purchase_order' }), create);
router.patch('/:id/status', authorize('procurement:approve'), auditLog('purchase_order.update_status', { auditableType: 'purchase_order', auditableId: (req) => req.params.id }), updateStatus);
router.post('/:id/receive', authorize('procurement:receive'), auditLog('purchase_order.receive', { auditableType: 'purchase_order', auditableId: (req) => req.params.id }), receiveGoods);
router.get('/:id/receipts/:receiptId', authorize('procurement:read'), cacheAside({ key: (req) => `erp:${req.user.org}:purchase-order:${req.params.id}:receipt:${req.params.receiptId}`, ttl: 300 }), getReceipt);
router.get('/:id/timeline', authorize('procurement:read'), cacheAside({ key: (req) => `erp:${req.user.org}:purchase-order:${req.params.id}:timeline`, ttl: 300 }), getTimeline);
router.post('/:id/return', authorize('procurement:create'), auditLog('purchase_order.return', { auditableType: 'purchase_order', auditableId: (req) => req.params.id }), returnToVendor);

module.exports = router;
