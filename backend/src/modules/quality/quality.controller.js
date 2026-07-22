const service = require('./quality.service');
const { asyncHandler } = require('../../middleware/errorHandler');

// ─── Checklists ───────────────────────────────────────────────────────

const listChecklists = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, sortBy, sortOrder, search, isActive } = req.query;
  const offset = (page - 1) * limit;
  const result = await service.listChecklists(req.user.organizationId, {
    limit: parseInt(limit, 10), offset: parseInt(offset, 10), sortBy, sortOrder, search, isActive,
  });
  res.json({
    success: true, data: result.data,
    meta: { page: parseInt(page, 10), limit: parseInt(limit, 10), total: result.total },
  });
});

const getChecklist = asyncHandler(async (req, res) => {
  const checklist = await service.getChecklist(req.params.id, req.user.organizationId);
  res.json({ success: true, data: checklist });
});

const createChecklist = asyncHandler(async (req, res) => {
  const checklist = await service.createChecklist({ ...req.body, organizationId: req.user.organizationId }, req.user.id);
  res.status(201).json({ success: true, data: checklist });
});

const updateChecklist = asyncHandler(async (req, res) => {
  const checklist = await service.updateChecklist(req.params.id, req.user.organizationId, req.body, req.user.id);
  res.json({ success: true, data: checklist });
});

const deleteChecklist = asyncHandler(async (req, res) => {
  await service.deleteChecklist(req.params.id, req.user.organizationId, req.user.id);
  res.json({ success: true, data: null });
});

// ─── Inspections ──────────────────────────────────────────────────────

const listInspections = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, sortBy, sortOrder, search, status, referenceType } = req.query;
  const offset = (page - 1) * limit;
  const result = await service.listInspections(req.user.organizationId, {
    limit: parseInt(limit, 10), offset: parseInt(offset, 10), sortBy, sortOrder, search, status, referenceType,
  });
  res.json({
    success: true, data: result.data,
    meta: { page: parseInt(page, 10), limit: parseInt(limit, 10), total: result.total },
  });
});

const getInspection = asyncHandler(async (req, res) => {
  const inspection = await service.getInspection(req.params.id, req.user.organizationId);
  res.json({ success: true, data: inspection });
});

const createInspection = asyncHandler(async (req, res) => {
  const inspection = await service.createInspection({ ...req.body, organizationId: req.user.organizationId }, req.user.id);
  res.status(201).json({ success: true, data: inspection });
});

const recordResults = asyncHandler(async (req, res) => {
  const inspection = await service.recordResults(req.params.id, req.user.organizationId, req.body, req.user.id);
  res.json({ success: true, data: inspection });
});

const deleteInspection = asyncHandler(async (req, res) => {
  await service.deleteInspection(req.params.id, req.user.organizationId, req.user.id);
  res.json({ success: true, data: null });
});

// ─── Criteria ─────────────────────────────────────────────────────────

const listCriteria = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, sortBy, sortOrder, search, productId, isActive } = req.query;
  const offset = (page - 1) * limit;
  const result = await service.listCriteria(req.user.organizationId, {
    limit: parseInt(limit, 10), offset: parseInt(offset, 10), sortBy, sortOrder, search, productId, isActive,
  });
  res.json({
    success: true, data: result.data,
    meta: { page: parseInt(page, 10), limit: parseInt(limit, 10), total: result.total },
  });
});

const getCriterion = asyncHandler(async (req, res) => {
  const criterion = await service.getCriterion(req.params.id, req.user.organizationId);
  res.json({ success: true, data: criterion });
});

const createCriterion = asyncHandler(async (req, res) => {
  const criterion = await service.createCriterion({ ...req.body, organizationId: req.user.organizationId }, req.user.id);
  res.status(201).json({ success: true, data: criterion });
});

const updateCriterion = asyncHandler(async (req, res) => {
  const criterion = await service.updateCriterion(req.params.id, req.user.organizationId, req.body, req.user.id);
  res.json({ success: true, data: criterion });
});

const deleteCriterion = asyncHandler(async (req, res) => {
  await service.deleteCriterion(req.params.id, req.user.organizationId);
  res.json({ success: true, data: null });
});

// ─── Reference Items (for dropdown) ──────────────────────────────────

const listReferenceItems = asyncHandler(async (req, res) => {
  const { referenceType } = req.params;
  const items = await service.listReferenceItems(referenceType, req.user.organizationId);
  res.json({ success: true, data: items });
});

// ─── Reports ──────────────────────────────────────────────────────────

const getInspectionReport = asyncHandler(async (req, res) => {
  const { referenceType, referenceId } = req.params;
  const inspections = await service.getInspectionReport(referenceType, referenceId, req.user.organizationId);
  res.json({ success: true, data: inspections });
});

module.exports = {
  listChecklists, getChecklist, createChecklist, updateChecklist, deleteChecklist,
  listInspections, getInspection, createInspection, recordResults, deleteInspection,
  listCriteria, getCriterion, createCriterion, updateCriterion, deleteCriterion,
  listReferenceItems,
  getInspectionReport,
};
