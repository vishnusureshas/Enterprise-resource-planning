const auditRepo = require('./audit.repo');
const logger = require('../../config/logger');

class AuditService {
  async log(action, auditableType, auditableId, userId, organizationId, changes, options = {}) {
    const entry = {
      auditableType,
      auditableId,
      action,
      userId,
      organizationId,
      changes,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      traceId: options.traceId,
    };

    try {
      const result = await auditRepo.create(entry);
      logger.debug('Audit log created', { id: result.id, action, auditableType, auditableId });
      return result;
    } catch (err) {
      logger.error({ err }, 'Failed to write audit log');
      // Don't throw — audit failures should never break the main operation
    }
  }

  async list(organizationId, query) {
    const pagination = {
      limit: query.limit || 20,
      offset: query.offset || 0,
      sortBy: query.sortBy || 'created_at',
      sortOrder: query.sortOrder || 'DESC',
    };

    const { data, total } = await auditRepo.findAll(organizationId, {
      ...pagination,
      action: query.action,
      auditableType: query.auditableType,
      userId: query.userId,
      from: query.from,
      to: query.to,
      search: query.search,
    });

    const logs = data.map((l) => ({
      id: l.id,
      auditableType: l.entity_type,
      auditableId: l.entity_id,
      action: l.action,
      userId: l.user_id,
      user: l.user_email ? {
        email: l.user_email,
        firstName: l.user_first_name,
        lastName: l.user_last_name,
      } : null,
      changes: l.changes ? this.parseChanges(l.changes) : null,
      ipAddress: l.ip_address,
      userAgent: l.user_agent,
      traceId: null,
      createdAt: l.created_at,
    }));

    return { data: logs, total, ...pagination };
  }

  async getByEntity(auditableType, auditableId, organizationId) {
    const logs = await auditRepo.findByEntity(auditableType, auditableId, organizationId);
    return logs.map((l) => ({
      id: l.id,
      action: l.action,
      userId: l.user_id,
      user: l.user_email ? {
        email: l.user_email,
        firstName: l.user_first_name,
        lastName: l.user_last_name,
      } : null,
      changes: l.changes ? this.parseChanges(l.changes) : null,
      ipAddress: l.ip_address,
      userAgent: l.user_agent,
      traceId: null,
      createdAt: l.created_at,
    }));
  }

  async getByUser(userId, organizationId, query) {
    const limit = query.limit || 50;
    const offset = query.offset || 0;

    const { data, total } = await auditRepo.findByUser(userId, organizationId, { limit, offset });

    const logs = data.map((l) => ({
      id: l.id,
      auditableType: l.entity_type,
      auditableId: l.entity_id,
      action: l.action,
      changes: l.changes ? this.parseChanges(l.changes) : null,
      ipAddress: l.ip_address,
      userAgent: l.user_agent,
      traceId: null,
      createdAt: l.created_at,
    }));

    return { data: logs, total, limit, offset };
  }

  async exportLogs(organizationId, filters) {
    const logs = await auditRepo.exportAll(organizationId, filters);
    return logs.map((l) => ({
      id: l.id,
      auditableType: l.entity_type,
      auditableId: l.entity_id,
      action: l.action,
      userId: l.user_id,
      userEmail: l.user_email,
      changes: l.changes,
      ipAddress: l.ip_address,
      traceId: null,
      createdAt: l.created_at,
    }));
  }

  parseChanges(changesJson) {
    try {
      return typeof changesJson === 'string' ? JSON.parse(changesJson) : changesJson;
    } catch {
      return changesJson;
    }
  }
}

module.exports = new AuditService();
