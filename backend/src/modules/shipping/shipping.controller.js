const shippingService = require('./shipping.service');
const { asyncHandler } = require('../../middleware/errorHandler');
const { validate } = require('../../middleware/validate');
const { paginate, buildPaginatedResponse } = require('../../middleware/pagination');
const schemas = require('./shipping.validation');

const createCarrierValidation = validate(schemas.createCarrier);
const updateCarrierValidation = validate(schemas.updateCarrier);
const createShipmentValidation = validate(schemas.createShipment);
const updateShipmentValidation = validate(schemas.updateShipment);
const addTrackingEventValidation = validate(schemas.addTrackingEvent);
const calculateRatesValidation = validate(schemas.calculateRates);

// ─── Carriers ─────────────────────────────────────────────────────────
const listCarriers = [
  paginate,
  asyncHandler(async (req, res) => {
    const result = await shippingService.listCarriers(req.user.organizationId, {
      ...req.pagination, search: req.query.search, status: req.query.status,
    });
    res.json(buildPaginatedResponse(result.data, result.total, req.pagination));
  }),
];

const getCarrier = asyncHandler(async (req, res) => {
  const carrier = await shippingService.getCarrier(req.params.id, req.user.organizationId);
  res.json({ success: true, data: carrier, error: null });
});

const createCarrier = [
  createCarrierValidation,
  asyncHandler(async (req, res) => {
    const carrier = await shippingService.createCarrier(req.body, req.user.organizationId, req.user.id);
    res.status(201).json({ success: true, data: carrier, error: null });
  }),
];

const updateCarrier = [
  updateCarrierValidation,
  asyncHandler(async (req, res) => {
    const carrier = await shippingService.updateCarrier(req.params.id, req.user.organizationId, req.body);
    res.json({ success: true, data: carrier, error: null });
  }),
];

const deleteCarrier = asyncHandler(async (req, res) => {
  await shippingService.deleteCarrier(req.params.id, req.user.organizationId);
  res.json({ success: true, data: null, error: null });
});

// ─── Shipments ────────────────────────────────────────────────────────
const listShipments = [
  paginate,
  asyncHandler(async (req, res) => {
    const result = await shippingService.listShipments(req.user.organizationId, {
      ...req.pagination, search: req.query.search, status: req.query.status,
      carrierId: req.query.carrierId, salesOrderId: req.query.salesOrderId,
    });
    res.json(buildPaginatedResponse(result.data, result.total, req.pagination));
  }),
];

const getShipment = asyncHandler(async (req, res) => {
  const shipment = await shippingService.getShipment(req.params.id, req.user.organizationId);
  res.json({ success: true, data: shipment, error: null });
});

const createShipment = [
  createShipmentValidation,
  asyncHandler(async (req, res) => {
    const shipment = await shippingService.createShipment(req.body, req.user.organizationId, req.user.id);
    res.status(201).json({ success: true, data: shipment, error: null });
  }),
];

const updateShipment = [
  updateShipmentValidation,
  asyncHandler(async (req, res) => {
    const shipment = await shippingService.updateShipment(req.params.id, req.user.organizationId, req.body);
    res.json({ success: true, data: shipment, error: null });
  }),
];

const dispatchShipment = asyncHandler(async (req, res) => {
  const shipment = await shippingService.dispatchShipment(req.params.id, req.user.organizationId);
  res.json({ success: true, data: shipment, error: null });
});

const deliverShipment = asyncHandler(async (req, res) => {
  const shipment = await shippingService.deliverShipment(req.params.id, req.user.organizationId);
  res.json({ success: true, data: shipment, error: null });
});

const trackShipment = asyncHandler(async (req, res) => {
  const shipment = await shippingService.getShipmentByTrackingNumber(req.params.trackingNumber, req.user.organizationId);
  res.json({ success: true, data: shipment, error: null });
});

const addTrackingEvent = [
  addTrackingEventValidation,
  asyncHandler(async (req, res) => {
    const event = await shippingService.addTrackingEvent(req.params.id, req.user.organizationId, req.body);
    res.status(201).json({ success: true, data: event, error: null });
  }),
];

const deleteShipment = asyncHandler(async (req, res) => {
  await shippingService.deleteShipment(req.params.id, req.user.organizationId);
  res.json({ success: true, data: null, error: null });
});

// ─── Rates ────────────────────────────────────────────────────────────
const calculateRates = [
  calculateRatesValidation,
  asyncHandler(async (req, res) => {
    const rates = await shippingService.calculateRates(req.body);
    res.json({ success: true, data: rates, error: null });
  }),
];

module.exports = {
  listCarriers, getCarrier, createCarrier, updateCarrier, deleteCarrier,
  listShipments, getShipment, createShipment, updateShipment,
  dispatchShipment, deliverShipment, trackShipment, addTrackingEvent, deleteShipment,
  calculateRates,
};
