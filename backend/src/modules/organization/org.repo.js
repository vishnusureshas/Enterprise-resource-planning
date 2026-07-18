const db = require('../../config/db');
const { NotFoundError } = require('../../shared/errors');

class OrganizationRepository {
  async findById(orgId) {
    const result = await db.query(
      `SELECT id, name, slug, logo_url, website, phone, address,
              timezone, date_format, currency, created_at, updated_at
       FROM organizations WHERE id = $1 AND deleted_at IS NULL`,
      [orgId]
    );
    return result.rows[0];
  }

  async update(orgId, data) {
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
    params.push(orgId);

    const result = await db.query(
      `UPDATE organizations SET ${setClauses.join(', ')}
       WHERE id = $${paramIndex} AND deleted_at IS NULL
       RETURNING id, name, slug, logo_url, website, phone, address,
                 timezone, date_format, currency, created_at, updated_at`,
      [...params]
    );
    return result.rows[0];
  }

  async getSettings(orgId) {
    const result = await db.query(
      `SELECT settings FROM organization_settings WHERE organization_id = $1`,
      [orgId]
    );
    return result.rows[0]?.settings || null;
  }

  async upsertSettings(orgId, settings) {
    const existing = await db.query(
      'SELECT id FROM organization_settings WHERE organization_id = $1',
      [orgId]
    );

    if (existing.rowCount > 0) {
      await db.query(
        `UPDATE organization_settings SET settings = settings || $1::jsonb, updated_at = NOW()
         WHERE organization_id = $2`,
        [JSON.stringify(settings), orgId]
      );
    } else {
      await db.query(
        `INSERT INTO organization_settings (organization_id, settings, created_at, updated_at)
         VALUES ($1, $2::jsonb, NOW(), NOW())`,
        [orgId, JSON.stringify(settings)]
      );
    }

    return this.getSettings(orgId);
  }

  async getStats(orgId) {
    const result = await db.query(
      `SELECT
        (SELECT COUNT(*) FROM users WHERE organization_id = $1 AND deleted_at IS NULL) as user_count,
        (SELECT COUNT(*) FROM roles WHERE organization_id = $1) as role_count`,
      [orgId]
    );
    return result.rows[0];
  }
}

module.exports = new OrganizationRepository();
