const db = require('../../config/db');
const { NotFoundError } = require('../../shared/errors');

class RoleRepository {
  async findAll(organizationId) {
    const result = await db.query(
      `SELECT r.id, r.name, r.description, r.created_at, r.updated_at,
              COUNT(ur.user_id)::int as user_count
       FROM roles r
LEFT JOIN user_roles ur ON ur.role_id = r.id
        WHERE r.organization_id = $1
       GROUP BY r.id
       ORDER BY r.created_at DESC`,
      [organizationId]
    );
    return result.rows;
  }

  async findById(roleId, organizationId) {
    const result = await db.query(
      `SELECT r.id, r.name, r.description, r.created_at, r.updated_at,
              COALESCE(
                json_agg(DISTINCT jsonb_build_object('id', p.id, 'name', p.name, 'category', p.category))
                FILTER (WHERE p.id IS NOT NULL), '[]'
              ) as permissions
       FROM roles r
       LEFT JOIN role_permissions rp ON rp.role_id = r.id
       LEFT JOIN permissions p ON p.id = rp.permission_id
       WHERE r.id = $1 AND r.organization_id = $2
       GROUP BY r.id`,
      [roleId, organizationId]
    );
    return result.rows[0];
  }

  async findByName(name, organizationId) {
    const result = await db.query(
      'SELECT id FROM roles WHERE name = $1 AND organization_id = $2',
      [name, organizationId]
    );
    return result.rows[0];
  }

  async create(data, organizationId) {
    const result = await db.query(
      `INSERT INTO roles (name, description, organization_id, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       RETURNING id, name, description, created_at`,
      [data.name, data.description || '', organizationId]
    );
    return result.rows[0];
  }

  async update(roleId, organizationId, data) {
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

    setClauses.push('updated_at = NOW()');
    params.push(roleId, organizationId);

    const result = await db.query(
      `UPDATE roles SET ${setClauses.join(', ')}
       WHERE id = $${paramIndex} AND organization_id = $${paramIndex + 1}
       RETURNING id, name, description, created_at, updated_at`,
      [...params]
    );
    return result.rows[0];
  }

  async delete(roleId, organizationId) {
    const result = await db.query(
      `DELETE FROM roles WHERE id = $1 AND organization_id = $2
       RETURNING id`,
      [roleId, organizationId]
    );
    if (result.rowCount === 0) throw new NotFoundError('Role not found');
    return result.rows[0];
  }

  async setPermissions(roleId, permissionIds) {
    await db.query('DELETE FROM role_permissions WHERE role_id = $1', [roleId]);
    for (const permId of permissionIds) {
      await db.query(
        'INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [roleId, permId]
      );
    }
  }

  async getPermissions(roleId) {
    const result = await db.query(
      `SELECT p.id, p.name, p.category FROM permissions p
       JOIN role_permissions rp ON rp.permission_id = p.id
       WHERE rp.role_id = $1`,
      [roleId]
    );
    return result.rows;
  }

  async getAllPermissions() {
    const result = await db.query(
      'SELECT id, name, category, description FROM permissions ORDER BY category, name'
    );
    return result.rows;
  }

  async assignUsers(roleId, userIds) {
    for (const userId of userIds) {
      await db.query(
        'INSERT INTO user_roles (user_id, role_id, assigned_at) VALUES ($1, $2, NOW()) ON CONFLICT DO NOTHING',
        [userId, roleId]
      );
    }
  }

  async removeUsers(roleId, userIds) {
    for (const userId of userIds) {
      await db.query(
        'DELETE FROM user_roles WHERE role_id = $1 AND user_id = $2',
        [roleId, userId]
      );
    }
  }
}

module.exports = new RoleRepository();
