const { v4: uuidv4 } = require('uuid');
const logger = require('../config/logger');
const auditService = require('../modules/audit-trail/audit.service');

const auditLog = (action, options = {}) => {
  const { auditableType, auditableId } = options;

  const resolveAuditableId = typeof auditableId === 'function' ? auditableId : () => auditableId;

  return (req, res, next) => {
    const startTime = Date.now();
    const originalJson = res.json.bind(res);

    res.json = (body) => {
      const duration = Date.now() - startTime;
      const traceId = req.headers['x-trace-id'] || uuidv4();

      // Only log successful requests (2xx) for audit
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const userId = req.user?.id;
        const organizationId = req.user?.organizationId || req.user?.orgId;
        const entityType = auditableType || req.auditableType;
        const entityId = resolveAuditableId(req) || req.params?.id || req.user?.id;
        const changes = extractChanges(req, body);

        const auditEntry = {
          traceId,
          timestamp: new Date().toISOString(),
          action,
          method: req.method,
          path: req.originalUrl,
          userId,
          userEmail: req.user?.email,
          organizationId,
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          statusCode: res.statusCode,
          duration,
          params: sanitizeParams(req.params),
          query: sanitizeQuery(req.query),
          responseSummary: getResponseSummary(body),
        };

        logger.info({ type: 'audit', ...auditEntry });

        // Write to audit_logs table
        if (entityType && entityId && userId) {
          auditService.log(action, entityType, entityId, userId, organizationId, changes, {
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            traceId,
          });
        }
      }

      return originalJson(body);
    };

    next();
  };
};

const extractChanges = (req, body) => {
  // For mutations, capture the request body as changes
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return {
      requestBody: sanitizeBody(req.body),
      responseData: body?.data || null,
    };
  }
  return null;
};

const sanitizeBody = (body) => {
  if (!body) return {};
  const sanitized = { ...body };
  delete sanitized.password;
  delete sanitized.currentPassword;
  delete sanitized.newPassword;
  delete sanitized.confirmPassword;
  delete sanitized.token;
  delete sanitized.refreshToken;
  delete sanitized.secret;
  return sanitized;
};

const sanitizeParams = (params) => {
  if (!params) return {};
  const sanitized = { ...params };
  delete sanitized.password;
  delete sanitized.token;
  delete sanitized.secret;
  return sanitized;
};

const sanitizeQuery = (query) => {
  if (!query) return {};
  const sanitized = { ...query };
  delete sanitized.password;
  delete sanitized.token;
  return sanitized;
};

const getResponseSummary = (body) => {
  if (!body) return null;
  return {
    success: body.success,
    dataCount: Array.isArray(body.data) ? body.data.length : (body.data ? 1 : 0),
    meta: body.meta,
  };
};

module.exports = { auditLog };
