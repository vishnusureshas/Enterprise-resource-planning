const db = require('../../config/db');
const { NotFoundError } = require('../../shared/errors');

class CustomerRepository {
  async findAll(organizationId, { limit, offset, sortBy, sortOrder, search, status }) {
    const conditions = ['c.organization_id = $1', 'c.deleted_at IS NULL'];
    const params = [organizationId];
    let paramIndex = 2;

    if (search) {
      conditions.push(`(
        LOWER(c.name) LIKE LOWER($${paramIndex}) OR
        LOWER(c.code) LIKE LOWER($${paramIndex}) OR
        LOWER(c.company_name) LIKE LOWER($${paramIndex}) OR
        LOWER(c.email) LIKE LOWER($${paramIndex})
      )`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (status) {
      conditions.push(`c.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');
    const allowedSort = ['name', 'code', 'email', 'company_name', 'status', 'created_at'];
    const sortColumn = allowedSort.includes(sortBy) ? sortBy : 'name';
    const order = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    const countResult = await db.query(
      `SELECT COUNT(*) FROM customers c WHERE ${whereClause}`, params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const dataResult = await db.query(
      `SELECT c.* FROM customers c
       WHERE ${whereClause}
       ORDER BY c.${sortColumn} ${order}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    return { data: dataResult.rows, total };
  }

  async findById(id, organizationId) {
    const result = await db.query(
      `SELECT c.* FROM customers c
       WHERE c.id = $1 AND c.organization_id = $2 AND c.deleted_at IS NULL`,
      [id, organizationId]
    );
    return result.rows[0];
  }

  async findByCode(code, organizationId) {
    const result = await db.query(
      'SELECT id FROM customers WHERE code = $1 AND organization_id = $2 AND deleted_at IS NULL',
      [code, organizationId]
    );
    return result.rows[0];
  }

  async findByEmail(email, organizationId) {
    const result = await db.query(
      'SELECT id FROM customers WHERE email = $1 AND organization_id = $2 AND deleted_at IS NULL',
      [email, organizationId]
    );
    return result.rows[0];
  }

  async create(data, organizationId) {
    const result = await db.query(
      `INSERT INTO customers (organization_id, code, name, email, phone, company_name,
              tax_id, website, notes, status, attributes, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
       RETURNING *`,
      [organizationId, data.code, data.name, data.email || null, data.phone || null,
       data.companyName || null, data.taxId || null, data.website || null,
       data.notes || null, data.status || 'active', JSON.stringify(data.attributes || {})]
    );
    return result.rows[0];
  }

  async update(id, organizationId, data) {
    const setClauses = [];
    const params = [];
    let paramIndex = 1;

    const fieldMap = {
      code: 'code', name: 'name', email: 'email', phone: 'phone',
      companyName: 'company_name', taxId: 'tax_id', website: 'website',
      notes: 'notes', status: 'status',
    };

    for (const [key, value] of Object.entries(data)) {
      const dbField = fieldMap[key];
      if (dbField && value !== undefined) {
        setClauses.push(`${dbField} = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
    }

    if (data.attributes !== undefined) {
      setClauses.push(`attributes = $${paramIndex}::jsonb`);
      params.push(JSON.stringify(data.attributes));
      paramIndex++;
    }

    if (setClauses.length === 0) return null;

    setClauses.push('updated_at = NOW()');
    params.push(id, organizationId);

    const result = await db.query(
      `UPDATE customers SET ${setClauses.join(', ')}
       WHERE id = $${paramIndex} AND organization_id = $${paramIndex + 1} AND deleted_at IS NULL
       RETURNING *`,
      [...params]
    );
    return result.rows[0];
  }

  async delete(id, organizationId) {
    const result = await db.query(
      `UPDATE customers SET deleted_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL
       RETURNING id`,
      [id, organizationId]
    );
    if (result.rowCount === 0) throw new NotFoundError('Customer not found');
    return result.rows[0];
  }

  async findAddresses(customerId) {
    const result = await db.query(
      `SELECT * FROM customer_addresses WHERE customer_id = $1 ORDER BY is_default DESC, created_at ASC`,
      [customerId]
    );
    return result.rows;
  }

  async findAddressById(id, customerId) {
    const result = await db.query(
      `SELECT * FROM customer_addresses WHERE id = $1 AND customer_id = $2`,
      [id, customerId]
    );
    return result.rows[0];
  }

  async createAddress(customerId, data) {
    if (data.isDefault) {
      await db.query(
        `UPDATE customer_addresses SET is_default = FALSE WHERE customer_id = $1`,
        [customerId]
      );
    }
    const result = await db.query(
      `INSERT INTO customer_addresses (customer_id, type, address_line1, address_line2,
              city, state, postal_code, country, is_default, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
       RETURNING *`,
      [customerId, data.type || 'shipping', data.addressLine1 || null, data.addressLine2 || null,
       data.city || null, data.state || null, data.postalCode || null, data.country || 'US',
       data.isDefault || false]
    );
    return result.rows[0];
  }

  async updateAddress(id, customerId, data) {
    if (data.isDefault) {
      await db.query(
        `UPDATE customer_addresses SET is_default = FALSE WHERE customer_id = $1 AND id != $2`,
        [customerId, id]
      );
    }
    const setClauses = [];
    const params = [];
    let paramIndex = 1;

    const fieldMap = {
      type: 'type', addressLine1: 'address_line1', addressLine2: 'address_line2',
      city: 'city', state: 'state', postalCode: 'postal_code', country: 'country',
      isDefault: 'is_default',
    };

    for (const [key, value] of Object.entries(data)) {
      const dbField = fieldMap[key];
      if (dbField && value !== undefined) {
        setClauses.push(`${dbField} = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
    }

    if (setClauses.length === 0) return null;
    setClauses.push('updated_at = NOW()');
    params.push(id, customerId);

    const result = await db.query(
      `UPDATE customer_addresses SET ${setClauses.join(', ')}
       WHERE id = $${paramIndex} AND customer_id = $${paramIndex + 1}
       RETURNING *`,
      [...params]
    );
    return result.rows[0];
  }

  async deleteAddress(id, customerId) {
    const result = await db.query(
      `DELETE FROM customer_addresses WHERE id = $1 AND customer_id = $2 RETURNING id`,
      [id, customerId]
    );
    if (result.rowCount === 0) throw new NotFoundError('Address not found');
    return result.rows[0];
  }

  async findContacts(customerId) {
    const result = await db.query(
      `SELECT * FROM customer_contacts WHERE customer_id = $1 ORDER BY is_primary DESC, created_at ASC`,
      [customerId]
    );
    return result.rows;
  }

  async findContactById(id, customerId) {
    const result = await db.query(
      `SELECT * FROM customer_contacts WHERE id = $1 AND customer_id = $2`,
      [id, customerId]
    );
    return result.rows[0];
  }

  async createContact(customerId, data) {
    if (data.isPrimary) {
      await db.query(
        `UPDATE customer_contacts SET is_primary = FALSE WHERE customer_id = $1`,
        [customerId]
      );
    }
    const result = await db.query(
      `INSERT INTO customer_contacts (customer_id, first_name, last_name, email, phone, position, is_primary, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING *`,
      [customerId, data.firstName || null, data.lastName || null, data.email || null,
       data.phone || null, data.position || null, data.isPrimary || false]
    );
    return result.rows[0];
  }

  async updateContact(id, customerId, data) {
    if (data.isPrimary) {
      await db.query(
        `UPDATE customer_contacts SET is_primary = FALSE WHERE customer_id = $1 AND id != $2`,
        [customerId, id]
      );
    }
    const setClauses = [];
    const params = [];
    let paramIndex = 1;

    const fieldMap = {
      firstName: 'first_name', lastName: 'last_name', email: 'email',
      phone: 'phone', position: 'position', isPrimary: 'is_primary',
    };

    for (const [key, value] of Object.entries(data)) {
      const dbField = fieldMap[key];
      if (dbField && value !== undefined) {
        setClauses.push(`${dbField} = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
    }

    if (setClauses.length === 0) return null;
    setClauses.push('updated_at = NOW()');
    params.push(id, customerId);

    const result = await db.query(
      `UPDATE customer_contacts SET ${setClauses.join(', ')}
       WHERE id = $${paramIndex} AND customer_id = $${paramIndex + 1}
       RETURNING *`,
      [...params]
    );
    return result.rows[0];
  }

  async deleteContact(id, customerId) {
    const result = await db.query(
      `DELETE FROM customer_contacts WHERE id = $1 AND customer_id = $2 RETURNING id`,
      [id, customerId]
    );
    if (result.rowCount === 0) throw new NotFoundError('Contact not found');
    return result.rows[0];
  }

  async findNotes(customerId) {
    const result = await db.query(
      `SELECT n.*, CONCAT(u.first_name, ' ', u.last_name) AS created_by_name
       FROM customer_notes n
       LEFT JOIN users u ON u.id = n.created_by
       WHERE n.customer_id = $1
       ORDER BY n.created_at DESC`,
      [customerId]
    );
    return result.rows;
  }

  async createNote(customerId, content, userId) {
    const result = await db.query(
      `INSERT INTO customer_notes (customer_id, content, created_by, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING *`,
      [customerId, content, userId]
    );
    return result.rows[0];
  }
}

module.exports = new CustomerRepository();
