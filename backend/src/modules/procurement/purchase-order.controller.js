const poService = require('./purchase-order.service');
const { asyncHandler } = require('../../middleware/errorHandler');
const { validate } = require('../../middleware/validate');
const { paginate, buildPaginatedResponse } = require('../../middleware/pagination');
const schemas = require('./purchase-order.validation');

const createPurchaseOrderValidation = validate(schemas.createPurchaseOrder);
const updateStatusValidation = validate(schemas.updatePurchaseOrderStatus);
const recordPaymentValidation = validate(schemas.recordPayment);
const receiveGoodsValidation = validate(schemas.receiveGoods);

const list = [
  paginate,
  asyncHandler(async (req, res) => {
    const result = await poService.list(req.user.organizationId, {
      ...req.pagination, search: req.query.search, status: req.query.status,
      vendorId: req.query.vendorId, fromDate: req.query.fromDate, toDate: req.query.toDate,
    });
    res.json(buildPaginatedResponse(result.data, result.total, req.pagination));
  }),
];

const get = asyncHandler(async (req, res) => {
  const po = await poService.getById(req.params.id, req.user.organizationId);
  res.json({ success: true, data: po, error: null });
});

const create = [
  createPurchaseOrderValidation,
  asyncHandler(async (req, res) => {
    const po = await poService.create(req.body, req.user.organizationId, req.user.id);
    res.status(201).json({ success: true, data: po, error: null });
  }),
];

const updateStatus = [
  updateStatusValidation,
  asyncHandler(async (req, res) => {
    const po = await poService.updateStatus(req.params.id, req.user.organizationId, req.body.status);
    res.json({ success: true, data: po, error: null });
  }),
];

const receiveGoods = [
  receiveGoodsValidation,
  asyncHandler(async (req, res) => {
    const receipt = await poService.receiveGoods(req.params.id, req.user.organizationId, req.body, req.user.id);
    res.status(201).json({ success: true, data: receipt, error: null });
  }),
];

const getReceipt = asyncHandler(async (req, res) => {
  const receipt = await poService.getReceiptDetails(req.params.receiptId, req.user.organizationId);
  res.json({ success: true, data: receipt, error: null });
});

const getTimeline = asyncHandler(async (req, res) => {
  const timeline = await poService.getTimeline(req.params.id, req.user.organizationId);
  res.json({ success: true, data: timeline, error: null });
});

module.exports = {
  list, get, create, updateStatus, receiveGoods, getReceipt, getTimeline,
};
