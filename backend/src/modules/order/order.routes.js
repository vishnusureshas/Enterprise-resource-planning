const express = require('express');
const router = express.Router();

const {
  list, get, create, updateStatus, cancel, recordPayment,
  listDeliveries, getTimeline, bulkCreate,
} = require('./order.controller');

const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/authorize');
const { auditLog } = require('../../middleware/auditLog');

router.use(authenticate);

router.get('/', authorize('order:read'), list);
router.get('/:id', authorize('order:read'), get);
router.post('/', authorize('order:create'), auditLog('order.create', { auditableType: 'sales_order' }), create);
router.post('/bulk', authorize('order:create'), auditLog('order.bulk_create', { auditableType: 'sales_order' }), bulkCreate);
router.patch('/:id/status', authorize('order:update'), auditLog('order.update_status', { auditableType: 'sales_order', auditableId: (req) => req.params.id }), updateStatus);
router.post('/:id/cancel', authorize('order:update'), auditLog('order.cancel', { auditableType: 'sales_order', auditableId: (req) => req.params.id }), cancel);
router.post('/:id/payments', authorize('order:update'), auditLog('order.payment', { auditableType: 'sales_order', auditableId: (req) => req.params.id }), recordPayment);
router.get('/:id/deliveries', authorize('order:read'), listDeliveries);
router.get('/:id/timeline', authorize('order:read'), getTimeline);

module.exports = router;
