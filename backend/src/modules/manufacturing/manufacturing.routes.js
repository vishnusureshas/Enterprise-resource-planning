const express = require('express');
const router = express.Router();

const {
  listBoms, getBom, createBom, updateBom, deleteBom, explodeBom,
  listWorkCenters, getWorkCenter, createWorkCenter, updateWorkCenter, deleteWorkCenter,
  listWorkOrders, getWorkOrder, createWorkOrder, updateWorkOrderStatus,
  startProduction, completeProduction, recordConsumption, recordOutput,
} = require('./manufacturing.controller');

const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/authorize');
const { auditLog } = require('../../middleware/auditLog');
const { cacheAside } = require('../../middleware/cache');
const { validate } = require('../../middleware/validate');
const {
  createBomSchema, updateBomSchema,
  createWorkCenterSchema, updateWorkCenterSchema,
  createWorkOrderSchema, updateWorkOrderStatusSchema,
  consumeSchema, outputSchema,
} = require('./manufacturing.validation');

router.use(authenticate);

// Work Centers
router.get('/work-centers', authorize('manufacturing:read'), cacheAside({ key: (req) => `erp:${req.user.org}:manufacturing:work-centers`, ttl: 600 }), listWorkCenters);
router.get('/work-centers/:id', authorize('manufacturing:read'), cacheAside({ key: (req) => `erp:${req.user.org}:manufacturing:work-center:${req.params.id}`, ttl: 600 }), getWorkCenter);
router.post('/work-centers', authorize('manufacturing:create'), validate(createWorkCenterSchema), auditLog('manufacturing.work_center.create', { auditableType: 'work_center' }), createWorkCenter);
router.patch('/work-centers/:id', authorize('manufacturing:update'), validate(updateWorkCenterSchema), auditLog('manufacturing.work_center.update', { auditableType: 'work_center', auditableId: (req) => req.params.id }), updateWorkCenter);
router.delete('/work-centers/:id', authorize('manufacturing:delete'), auditLog('manufacturing.work_center.delete', { auditableType: 'work_center', auditableId: (req) => req.params.id }), deleteWorkCenter);

// BOM
router.get('/bom', authorize('manufacturing:read'), cacheAside({ key: (req) => `erp:${req.user.org}:manufacturing:bom:page:${req.query.page || 1}`, ttl: 600 }), listBoms);
router.get('/bom/:id', authorize('manufacturing:read'), cacheAside({ key: (req) => `erp:${req.user.org}:manufacturing:bom:${req.params.id}`, ttl: 600 }), getBom);
router.get('/bom/:id/explode', authorize('manufacturing:read'), cacheAside({ key: (req) => `erp:${req.user.org}:manufacturing:bom:${req.params.id}:explode`, ttl: 120 }), explodeBom);
router.post('/bom', authorize('manufacturing:create'), validate(createBomSchema), auditLog('manufacturing.bom.create', { auditableType: 'bom' }), createBom);
router.patch('/bom/:id', authorize('manufacturing:update'), validate(updateBomSchema), auditLog('manufacturing.bom.update', { auditableType: 'bom', auditableId: (req) => req.params.id }), updateBom);
router.delete('/bom/:id', authorize('manufacturing:delete'), auditLog('manufacturing.bom.delete', { auditableType: 'bom', auditableId: (req) => req.params.id }), deleteBom);

// Work Orders
router.get('/work-orders', authorize('manufacturing:read'), cacheAside({ key: (req) => `erp:${req.user.org}:manufacturing:work-orders:page:${req.query.page || 1}`, ttl: 120 }), listWorkOrders);
router.get('/work-orders/:id', authorize('manufacturing:read'), cacheAside({ key: (req) => `erp:${req.user.org}:manufacturing:work-order:${req.params.id}`, ttl: 120 }), getWorkOrder);
router.post('/work-orders', authorize('manufacturing:create'), validate(createWorkOrderSchema), auditLog('manufacturing.work_order.create', { auditableType: 'work_order' }), createWorkOrder);
router.patch('/work-orders/:id/status', authorize('manufacturing:update'), validate(updateWorkOrderStatusSchema), auditLog('manufacturing.work_order.update_status', { auditableType: 'work_order', auditableId: (req) => req.params.id }), updateWorkOrderStatus);

// Production actions
router.post('/work-orders/:id/start', authorize('manufacturing:produce'), auditLog('manufacturing.production.start', { auditableType: 'work_order', auditableId: (req) => req.params.id }), startProduction);
router.post('/work-orders/:id/complete', authorize('manufacturing:produce'), auditLog('manufacturing.production.complete', { auditableType: 'work_order', auditableId: (req) => req.params.id }), completeProduction);
router.post('/work-orders/:id/consume', authorize('manufacturing:produce'), validate(consumeSchema), auditLog('manufacturing.production.consume', { auditableType: 'work_order', auditableId: (req) => req.params.id }), recordConsumption);
router.post('/work-orders/:id/output', authorize('manufacturing:produce'), validate(outputSchema), auditLog('manufacturing.production.output', { auditableType: 'work_order', auditableId: (req) => req.params.id }), recordOutput);

module.exports = router;
