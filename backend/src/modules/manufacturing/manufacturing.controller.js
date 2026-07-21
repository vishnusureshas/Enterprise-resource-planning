const service = require('./manufacturing.service');
const { asyncHandler } = require('../../middleware/errorHandler');

// ─── Work Centers ─────────────────────────────────────────────────────

const listWorkCenters = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, sortBy, sortOrder, search } = req.query;
  const offset = (page - 1) * limit;
  const result = await service.listWorkCenters(req.user.organizationId, {
    limit: parseInt(limit, 10), offset: parseInt(offset, 10), sortBy, sortOrder, search,
  });
  res.json({
    success: true, data: result.data,
    meta: { page: parseInt(page, 10), limit: parseInt(limit, 10), total: result.total },
  });
});

const getWorkCenter = asyncHandler(async (req, res) => {
  const center = await service.getWorkCenter(req.params.id, req.user.organizationId);
  res.json({ success: true, data: center });
});

const createWorkCenter = asyncHandler(async (req, res) => {
  const center = await service.createWorkCenter({ ...req.body, organizationId: req.user.organizationId }, req.user.id);
  res.status(201).json({ success: true, data: center });
});

const updateWorkCenter = asyncHandler(async (req, res) => {
  const center = await service.updateWorkCenter(req.params.id, req.user.organizationId, req.body, req.user.id);
  res.json({ success: true, data: center });
});

const deleteWorkCenter = asyncHandler(async (req, res) => {
  await service.deleteWorkCenter(req.params.id, req.user.organizationId, req.user.id);
  res.json({ success: true, data: null });
});

// ─── BOM ──────────────────────────────────────────────────────────────

const listBoms = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, sortBy, sortOrder, search, productId, isActive } = req.query;
  const offset = (page - 1) * limit;
  const result = await service.listBoms(req.user.organizationId, {
    limit: parseInt(limit, 10), offset: parseInt(offset, 10), sortBy, sortOrder, search, productId, isActive,
  });
  res.json({
    success: true, data: result.data,
    meta: { page: parseInt(page, 10), limit: parseInt(limit, 10), total: result.total },
  });
});

const getBom = asyncHandler(async (req, res) => {
  const bom = await service.getBom(req.params.id, req.user.organizationId);
  res.json({ success: true, data: bom });
});

const explodeBom = asyncHandler(async (req, res) => {
  const result = await service.explodeBom(req.params.id, req.user.organizationId);
  res.json({ success: true, data: result });
});

const createBom = asyncHandler(async (req, res) => {
  const bom = await service.createBom({ ...req.body, organizationId: req.user.organizationId }, req.user.id);
  res.status(201).json({ success: true, data: bom });
});

const updateBom = asyncHandler(async (req, res) => {
  const bom = await service.updateBom(req.params.id, req.user.organizationId, req.body, req.user.id);
  res.json({ success: true, data: bom });
});

const deleteBom = asyncHandler(async (req, res) => {
  await service.deleteBom(req.params.id, req.user.organizationId, req.user.id);
  res.json({ success: true, data: null });
});

// ─── Work Orders ──────────────────────────────────────────────────────

const listWorkOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, sortBy, sortOrder, search, status, productId } = req.query;
  const offset = (page - 1) * limit;
  const result = await service.listWorkOrders(req.user.organizationId, {
    limit: parseInt(limit, 10), offset: parseInt(offset, 10), sortBy, sortOrder, search, status, productId,
  });
  res.json({
    success: true, data: result.data,
    meta: { page: parseInt(page, 10), limit: parseInt(limit, 10), total: result.total },
  });
});

const getWorkOrder = asyncHandler(async (req, res) => {
  const wo = await service.getWorkOrder(req.params.id, req.user.organizationId);
  res.json({ success: true, data: wo });
});

const createWorkOrder = asyncHandler(async (req, res) => {
  const wo = await service.createWorkOrder({ ...req.body, organizationId: req.user.organizationId }, req.user.id);
  res.status(201).json({ success: true, data: wo });
});

const updateWorkOrderStatus = asyncHandler(async (req, res) => {
  const wo = await service.updateWorkOrderStatus(req.params.id, req.user.organizationId, req.body.status, req.user.id);
  res.json({ success: true, data: wo });
});

const startProduction = asyncHandler(async (req, res) => {
  const wo = await service.startProduction(req.params.id, req.user.organizationId, req.user.id);
  res.json({ success: true, data: wo });
});

const completeProduction = asyncHandler(async (req, res) => {
  const wo = await service.completeProduction(req.params.id, req.user.organizationId, req.user.id);
  res.json({ success: true, data: wo });
});

const recordConsumption = asyncHandler(async (req, res) => {
  const consumption = await service.recordConsumption(req.params.id, req.user.organizationId, req.body, req.user.id);
  res.status(201).json({ success: true, data: consumption });
});

const recordOutput = asyncHandler(async (req, res) => {
  const output = await service.recordOutput(req.params.id, req.user.organizationId, req.body, req.user.id);
  res.status(201).json({ success: true, data: output });
});

module.exports = {
  listWorkCenters, getWorkCenter, createWorkCenter, updateWorkCenter, deleteWorkCenter,
  listBoms, getBom, createBom, updateBom, deleteBom, explodeBom,
  listWorkOrders, getWorkOrder, createWorkOrder, updateWorkOrderStatus,
  startProduction, completeProduction, recordConsumption, recordOutput,
};
