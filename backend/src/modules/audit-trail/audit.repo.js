const db = require('../../config/db');

class AuditRepository {
  async create(entry) {
    const result = await db.query(
      `INSERT INTO audit_logs (entity_type, entity_id, action, user_id, organization_id,
        changes, ip_address, user_agent, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       RETURNING id, created_at`,
      [
        entry.auditableType,
        entry.auditableId,
        entry.action,
        entry.userId,
        entry.organizationId,
        entry.changes ? JSON.stringify(entry.changes) : null,
        entry.ipAddress,
        entry.userAgent,
      ]
    );
    return result.rows[0];
  }

  async findAll(organizationId, { limit, offset, sortBy, sortOrder, action, auditableType, userId, from, to, search }) {
    const conditions = ['al.organization_id = $1'];
    const params = [organizationId];
    let paramIndex = 2;

    if (action) {
      conditions.push(`al.action = $${paramIndex}`);
      params.push(action);
      paramIndex++;
    }

    if (auditableType) {
      conditions.push(`al.entity_type = $${paramIndex}`);
      params.push(auditableType);
      paramIndex++;
    }

    if (userId) {
      conditions.push(`al.user_id = $${paramIndex}`);
      params.push(userId);
      paramIndex++;
    }

    if (from) {
      conditions.push(`al.created_at >= $${paramIndex}`);
      params.push(from);
      paramIndex++;
    }

    if (to) {
      conditions.push(`al.created_at <= $${paramIndex}`);
      params.push(to);
      paramIndex++;
    }

    if (search) {
      conditions.push(`(al.entity_type ILIKE $${paramIndex} OR al.action ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex} OR u.first_name ILIKE $${paramIndex} OR u.last_name ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    const allowedSort = ['created_at', 'action', 'entity_type'];
    const sortColumn = allowedSort.includes(sortBy) ? sortBy : 'created_at';
    const order = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    const countResult = await db.query(
      `SELECT COUNT(*) FROM audit_logs al LEFT JOIN users u ON u.id = al.user_id WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const dataResult = await db.query(
      `SELECT al.id, al.entity_type, al.entity_id, al.action, al.user_id,
              al.changes, al.ip_address, al.user_agent, al.created_at,
              u.email as user_email, u.first_name as user_first_name, u.last_name as user_last_name
       FROM audit_logs al
       LEFT JOIN users u ON u.id = al.user_id
       WHERE ${whereClause}
       ORDER BY al.${sortColumn} ${order}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    return { data: dataResult.rows, total };
  }

  async findByEntity(auditableType, auditableId, organizationId) {
    const result = await db.query(
      `SELECT al.id, al.entity_type, al.entity_id, al.action, al.user_id,
              al.changes, al.ip_address, al.user_agent, al.created_at,
              u.email as user_email, u.first_name as user_first_name, u.last_name as user_last_name
       FROM audit_logs al
       LEFT JOIN users u ON u.id = al.user_id
       WHERE al.entity_type = $1 AND al.entity_id = $2 AND al.organization_id = $3
       ORDER BY al.created_at DESC`,
      [auditableType, auditableId, organizationId]
    );
    return result.rows;
  }

  async findByUser(userId, organizationId, { limit, offset }) {
    const result = await db.query(
      `SELECT al.id, al.entity_type, al.entity_id, al.action, al.user_id,
              al.changes, al.ip_address, al.user_agent, al.created_at
       FROM audit_logs al
       WHERE al.user_id = $1 AND al.organization_id = $2
       ORDER BY al.created_at DESC
       LIMIT $3 OFFSET $4`,
      [userId, organizationId, limit, offset]
    );

    const countResult = await db.query(
      'SELECT COUNT(*) FROM audit_logs WHERE user_id = $1 AND organization_id = $2',
      [userId, organizationId]
    );

    return { data: result.rows, total: parseInt(countResult.rows[0].count, 10) };
  }

  async exportAll(organizationId, { from, to, action, auditableType }) {
    const conditions = ['al.organization_id = $1'];
    const params = [organizationId];
    let paramIndex = 2;

    if (from) { conditions.push(`al.created_at >= $${paramIndex}`); params.push(from); paramIndex++; }
    if (to) { conditions.push(`al.created_at <= $${paramIndex}`); params.push(to); paramIndex++; }
    if (action) { conditions.push(`al.action = $${paramIndex}`); params.push(action); paramIndex++; }
    if (auditableType) { conditions.push(`al.entity_type = $${paramIndex}`); params.push(auditableType); paramIndex++; }

    const result = await db.query(
      `SELECT al.*, u.email as user_email FROM audit_logs al
       LEFT JOIN users u ON u.id = al.user_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY al.created_at DESC`,
      params
    );
    return result.rows;
  }
}

module.exports = new AuditRepository();
