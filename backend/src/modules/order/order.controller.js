const orderService = require('./order.service');
const { asyncHandler } = require('../../middleware/errorHandler');
const { validate } = require('../../middleware/validate');
const { paginate, buildPaginatedResponse } = require('../../middleware/pagination');
const schemas = require('./order.validation');

const createOrderValidation = validate(schemas.createOrder);
const updateOrderStatusValidation = validate(schemas.updateOrderStatus);
const recordPaymentValidation = validate(schemas.recordPayment);
const cancelOrderValidation = validate(schemas.cancelOrder);
const bulkCreateOrdersValidation = validate(schemas.bulkCreateOrders);

const list = [
  paginate,
  asyncHandler(async (req, res) => {
    const result = await orderService.list(req.user.organizationId, {
      ...req.pagination, search: req.query.search, status: req.query.status,
      customerId: req.query.customerId, fromDate: req.query.fromDate, toDate: req.query.toDate,
    });
    res.json(buildPaginatedResponse(result.data, result.total, req.pagination));
  }),
];

const get = asyncHandler(async (req, res) => {
  const order = await orderService.getById(req.params.id, req.user.organizationId);
  res.json({ success: true, data: order, error: null });
});

const create = [
  createOrderValidation,
  asyncHandler(async (req, res) => {
    const order = await orderService.create(req.body, req.user.organizationId, req.user.id);
    res.status(201).json({ success: true, data: order, error: null });
  }),
];

const updateStatus = [
  updateOrderStatusValidation,
  asyncHandler(async (req, res) => {
    const order = await orderService.updateStatus(req.params.id, req.user.organizationId, req.body.status);
    res.json({ success: true, data: order, error: null });
  }),
];

const cancel = [
  cancelOrderValidation,
  asyncHandler(async (req, res) => {
    const order = await orderService.cancel(req.params.id, req.user.organizationId, req.body.reason);
    res.json({ success: true, data: order, error: null });
  }),
];

const recordPayment = [
  recordPaymentValidation,
  asyncHandler(async (req, res) => {
    const payment = await orderService.recordPayment(req.params.id, req.user.organizationId, req.body, req.user.id);
    res.status(201).json({ success: true, data: payment, error: null });
  }),
];

const listDeliveries = asyncHandler(async (req, res) => {
  res.json({ success: true, data: [], error: null });
});

const getTimeline = asyncHandler(async (req, res) => {
  const timeline = await orderService.getTimeline(req.params.id, req.user.organizationId);
  res.json({ success: true, data: timeline, error: null });
});

const bulkCreate = [
  bulkCreateOrdersValidation,
  asyncHandler(async (req, res) => {
    const results = [];
    for (const orderData of req.body.orders) {
      const order = await orderService.create(orderData, req.user.organizationId, req.user.id);
      results.push(order);
    }
    res.status(201).json({ success: true, data: results, error: null });
  }),
];

module.exports = {
  list, get, create, updateStatus, cancel, recordPayment,
  listDeliveries, getTimeline, bulkCreate,
};
