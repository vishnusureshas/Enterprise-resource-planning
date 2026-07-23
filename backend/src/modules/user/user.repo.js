const db = require('../../config/db');
const { NotFoundError } = require('../../shared/errors');

class UserRepository {
  async findAll(organizationId, { limit, offset, sortBy, sortOrder, search, status, role }) {
    const conditions = ['u.organization_id = $1', 'u.deleted_at IS NULL'];
    const params = [organizationId];
    let paramIndex = 2;

    if (search) {
      conditions.push(`(LOWER(u.email) LIKE LOWER($${paramIndex}) OR LOWER(u.first_name) LIKE LOWER($${paramIndex}) OR LOWER(u.last_name) LIKE LOWER($${paramIndex}))`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (status) {
      conditions.push(`u.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (role) {
      conditions.push(`EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = u.id AND r.id = $${paramIndex})`);
      params.push(role);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    const allowedSort = ['created_at', 'email', 'first_name', 'last_name', 'status', 'last_login'];
    const sortColumn = allowedSort.includes(sortBy) ? sortBy : 'created_at';
    const order = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    const countResult = await db.query(
      `SELECT COUNT(*) FROM users u WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const dataResult = await db.query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.avatar_url,
              u.status, u.mfa_enabled, u.created_at, u.updated_at, u.last_login,
              COALESCE(
                json_agg(DISTINCT jsonb_build_object('id', r.id, 'name', r.name))
                FILTER (WHERE r.id IS NOT NULL), '[]'
              ) as roles
       FROM users u
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r ON r.id = ur.role_id
       WHERE ${whereClause}
       GROUP BY u.id
       ORDER BY u.${sortColumn} ${order}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    return { data: dataResult.rows, total };
  }

  async findById(userId, organizationId) {
    const result = await db.query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.avatar_url,
              u.status, u.mfa_enabled, u.created_at, u.updated_at, u.last_login,
              u.organization_id,
              COALESCE(
                json_agg(DISTINCT jsonb_build_object('id', r.id, 'name', r.name, 'description', r.description))
                FILTER (WHERE r.id IS NOT NULL), '[]'
              ) as roles,
              COALESCE(
                json_agg(DISTINCT jsonb_build_object('id', p.id, 'name', p.name, 'category', p.category))
                FILTER (WHERE p.id IS NOT NULL), '[]'
              ) as permissions
       FROM users u
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r ON r.id = ur.role_id
       LEFT JOIN role_permissions rp ON rp.role_id = r.id
       LEFT JOIN permissions p ON p.id = rp.permission_id
       WHERE u.id = $1 AND u.organization_id = $2 AND u.deleted_at IS NULL
       GROUP BY u.id`,
      [userId, organizationId]
    );
    return result.rows[0];
  }

  async findByEmail(email) {
    const result = await db.query('SELECT id FROM users WHERE email = $1 AND deleted_at IS NULL', [email]);
    return result.rows[0];
  }

  async create(userData, organizationId) {
    const result = await db.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone, organization_id, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'active', NOW(), NOW())
       RETURNING id, email, first_name, last_name, phone, status, mfa_enabled, created_at, updated_at`,
      [userData.email, userData.passwordHash, userData.firstName, userData.lastName, userData.phone || null, organizationId]
    );
    return result.rows[0];
  }

  async update(userId, organizationId, data) {
    const setClauses = [];
    const params = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        setClauses.push(`${key} = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
    }

    if (setClauses.length === 0) return null;

    setClauses.push(`updated_at = NOW()`);

    params.push(userId, organizationId);
    const result = await db.query(
      `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${paramIndex} AND organization_id = $${paramIndex + 1} AND deleted_at IS NULL
       RETURNING id, email, first_name, last_name, phone, avatar_url, status, mfa_enabled, created_at, updated_at`,
      [...params]
    );
    return result.rows[0];
  }

  async softDelete(userId, organizationId) {
    const result = await db.query(
      `UPDATE users SET deleted_at = NOW(), status = 'deleted', updated_at = NOW()
       WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL
       RETURNING id`,
      [userId, organizationId]
    );
    if (result.rowCount === 0) throw new NotFoundError('User not found');
    return result.rows[0];
  }

  async setRoles(userId, roleIds) {
    await db.query('DELETE FROM user_roles WHERE user_id = $1', [userId]);
    for (const roleId of roleIds) {
      await db.query(
        'INSERT INTO user_roles (user_id, role_id, assigned_at) VALUES ($1, $2, NOW())',
        [userId, roleId]
      );
    }
  }

  async getRoles(userId) {
    const result = await db.query(
      `SELECT r.id, r.name, r.description FROM roles r
       JOIN user_roles ur ON ur.role_id = r.id
       WHERE ur.user_id = $1`,
      [userId]
    );
    return result.rows;
  }

  async getPermissions(userId) {
    const result = await db.query(
      `SELECT DISTINCT p.name FROM permissions p
       JOIN role_permissions rp ON p.id = rp.permission_id
       JOIN roles r ON r.id = rp.role_id
       JOIN user_roles ur ON ur.role_id = r.id
       WHERE ur.user_id = $1`,
      [userId]
    );
    return result.rows.map(r => r.name);
  }
}

module.exports = new UserRepository();
