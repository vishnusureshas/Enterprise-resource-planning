const auditService = require('./audit.service');
const { asyncHandler } = require('../../middleware/errorHandler');
const { paginate, buildPaginatedResponse } = require('../../middleware/pagination');

const list = [
  paginate,
  asyncHandler(async (req, res) => {
    const result = await auditService.list(req.user.organizationId, {
      ...req.pagination,
      action: req.query.action,
      auditableType: req.query.auditableType,
      userId: req.query.userId,
      from: req.query.from,
      to: req.query.to,
      search: req.query.search,
    });
    res.json(buildPaginatedResponse(result.data, result.total, req.pagination));
  }),
];

const getByEntity = asyncHandler(async (req, res) => {
  const { entityType, entityId } = req.params;
  const logs = await auditService.getByEntity(entityType, entityId, req.user.organizationId);
  res.json({ success: true, data: logs, error: null });
});

const getByUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const result = await auditService.getByUser(userId, req.user.organizationId, {
    limit: parseInt(req.query.limit, 10) || 50,
    offset: parseInt(req.query.offset, 10) || 0,
  });
  res.json({
    success: true,
    data: result.data,
    meta: { total: result.total, limit: result.limit, offset: result.offset },
    error: null,
  });
});

const exportLogs = asyncHandler(async (req, res) => {
  const logs = await auditService.exportLogs(req.user.organizationId, {
    from: req.query.from,
    to: req.query.to,
    action: req.query.action,
    auditableType: req.query.auditableType,
  });

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.json');
  res.json({ success: true, data: logs, error: null });
});

module.exports = {
  list,
  getByEntity,
  getByUser,
  exportLogs,
};
