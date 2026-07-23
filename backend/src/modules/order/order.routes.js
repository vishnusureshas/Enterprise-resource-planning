const express = require('express');
const router = express.Router();

const {
  list, get, create, updateStatus, cancel, recordPayment,
  listDeliveries, getTimeline, bulkCreate,
} = require('./order.controller');

const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/authorize');
const { auditLog } = require('../../middleware/auditLog');
const { cacheAside } = require('../../middleware/cache');

router.use(authenticate);

router.get('/', authorize('order:read'), cacheAside({ key: (req) => `erp:${req.user.org}:orders:page:${req.query.page || 1}:status:${req.query.status || 'all'}`, ttl: 120 }), list);
router.get('/:id', authorize('order:read'), cacheAside({ key: (req) => `erp:${req.user.org}:order:${req.params.id}`, ttl: 120 }), get);
router.post('/', authorize('order:create'), auditLog('order.create', { auditableType: 'sales_order' }), create);
router.post('/bulk', authorize('order:create'), auditLog('order.bulk_create', { auditableType: 'sales_order' }), bulkCreate);
router.patch('/:id/status', authorize('order:update'), auditLog('order.update_status', { auditableType: 'sales_order', auditableId: (req) => req.params.id }), updateStatus);
router.post('/:id/cancel', authorize('order:update'), auditLog('order.cancel', { auditableType: 'sales_order', auditableId: (req) => req.params.id }), cancel);
router.post('/:id/payments', authorize('order:update'), auditLog('order.payment', { auditableType: 'sales_order', auditableId: (req) => req.params.id }), recordPayment);
router.get('/:id/deliveries', authorize('order:read'), cacheAside({ key: (req) => `erp:${req.user.org}:order:${req.params.id}:deliveries`, ttl: 120 }), listDeliveries);
router.get('/:id/timeline', authorize('order:read'), cacheAside({ key: (req) => `erp:${req.user.org}:order:${req.params.id}:timeline`, ttl: 120 }), getTimeline);

module.exports = router;
