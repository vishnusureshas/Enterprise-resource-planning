const express = require('express');
const router = express.Router();

const {
  listCarriers, getCarrier, createCarrier, updateCarrier, deleteCarrier,
  listShipments, getShipment, createShipment, updateShipment,
  dispatchShipment, deliverShipment, trackShipment, addTrackingEvent, deleteShipment,
  calculateRates,
} = require('./shipping.controller');

const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/authorize');
const { auditLog } = require('../../middleware/auditLog');
const { cacheAside } = require('../../middleware/cache');

router.use(authenticate);

// Carriers
router.get('/carriers', authorize('shipping:read'), cacheAside({ key: (req) => `erp:${req.user.org}:shipping:carriers:page:${req.query.page || 1}`, ttl: 600 }), listCarriers);
router.get('/carriers/:id', authorize('shipping:read'), cacheAside({ key: (req) => `erp:${req.user.org}:shipping:carrier:${req.params.id}`, ttl: 600 }), getCarrier);
router.post('/carriers', authorize('shipping:create'), auditLog('shipping.carrier.create', { auditableType: 'carrier' }), createCarrier);
router.patch('/carriers/:id', authorize('shipping:update'), auditLog('shipping.carrier.update', { auditableType: 'carrier', auditableId: (req) => req.params.id }), updateCarrier);
router.delete('/carriers/:id', authorize('shipping:delete'), auditLog('shipping.carrier.delete', { auditableType: 'carrier', auditableId: (req) => req.params.id }), deleteCarrier);

// Shipments
router.get('/shipments', authorize('shipping:read'), cacheAside({ key: (req) => `erp:${req.user.org}:shipping:shipments:page:${req.query.page || 1}`, ttl: 120 }), listShipments);
router.get('/shipments/:id', authorize('shipping:read'), cacheAside({ key: (req) => `erp:${req.user.org}:shipping:shipment:${req.params.id}`, ttl: 120 }), getShipment);
router.post('/shipments', authorize('shipping:create'), auditLog('shipping.shipment.create', { auditableType: 'shipment' }), createShipment);
router.patch('/shipments/:id', authorize('shipping:update'), auditLog('shipping.shipment.update', { auditableType: 'shipment', auditableId: (req) => req.params.id }), updateShipment);
router.post('/shipments/:id/dispatch', authorize('shipping:update'), auditLog('shipping.shipment.dispatch', { auditableType: 'shipment', auditableId: (req) => req.params.id }), dispatchShipment);
router.post('/shipments/:id/deliver', authorize('shipping:update'), auditLog('shipping.shipment.deliver', { auditableType: 'shipment', auditableId: (req) => req.params.id }), deliverShipment);
router.post('/shipments/:id/tracking', authorize('shipping:update'), auditLog('shipping.shipment.tracking', { auditableType: 'shipment', auditableId: (req) => req.params.id }), addTrackingEvent);
router.delete('/shipments/:id', authorize('shipping:delete'), auditLog('shipping.shipment.delete', { auditableType: 'shipment', auditableId: (req) => req.params.id }), deleteShipment);

// Tracking (by carrier tracking number)
router.get('/tracking/:trackingNumber', authorize('shipping:read'), cacheAside({ key: (req) => `erp:${req.user.org}:shipping:tracking:${req.params.trackingNumber}`, ttl: 60 }), trackShipment);

// Rates
router.post('/rates', authorize('shipping:read'), calculateRates);

module.exports = router;
