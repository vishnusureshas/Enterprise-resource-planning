const db = require('../../config/db');
const { NotFoundError } = require('../../shared/errors');

class VendorRepository {
  async findAll(organizationId, { limit, offset, sortBy, sortOrder, search, status }) {
    const conditions = ['v.organization_id = $1', 'v.deleted_at IS NULL'];
    const params = [organizationId];
    let paramIndex = 2;

    if (search) {
      conditions.push(`(
        LOWER(v.name) LIKE LOWER($${paramIndex}) OR
        LOWER(v.code) LIKE LOWER($${paramIndex}) OR
        LOWER(v.company_name) LIKE LOWER($${paramIndex}) OR
        LOWER(v.email) LIKE LOWER($${paramIndex})
      )`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (status) {
      conditions.push(`v.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');
    const allowedSort = ['name', 'code', 'email', 'company_name', 'status', 'created_at'];
    const sortColumn = allowedSort.includes(sortBy) ? sortBy : 'name';
    const order = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    const countResult = await db.query(
      `SELECT COUNT(*) FROM vendors v WHERE ${whereClause}`, params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const dataResult = await db.query(
      `SELECT v.* FROM vendors v
       WHERE ${whereClause}
       ORDER BY v.${sortColumn} ${order}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    return { data: dataResult.rows, total };
  }

  async findById(id, organizationId) {
    const result = await db.query(
      `SELECT v.* FROM vendors v
       WHERE v.id = $1 AND v.organization_id = $2 AND v.deleted_at IS NULL`,
      [id, organizationId]
    );
    return result.rows[0];
  }

  async findByCode(code, organizationId) {
    const result = await db.query(
      'SELECT id FROM vendors WHERE code = $1 AND organization_id = $2 AND deleted_at IS NULL',
      [code, organizationId]
    );
    return result.rows[0];
  }

  async findByEmail(email, organizationId) {
    const result = await db.query(
      'SELECT id FROM vendors WHERE email = $1 AND organization_id = $2 AND deleted_at IS NULL',
      [email, organizationId]
    );
    return result.rows[0];
  }

  async create(data, organizationId) {
    const result = await db.query(
      `INSERT INTO vendors (organization_id, code, name, email, phone, company_name,
              tax_id, website, payment_terms, credit_limit, notes, status, attributes, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
       RETURNING *`,
      [organizationId, data.code, data.name, data.email || null, data.phone || null,
       data.companyName || null, data.taxId || null, data.website || null,
       data.paymentTerms || null, data.creditLimit || null,
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
      paymentTerms: 'payment_terms', creditLimit: 'credit_limit',
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
      `UPDATE vendors SET ${setClauses.join(', ')}
       WHERE id = $${paramIndex} AND organization_id = $${paramIndex + 1} AND deleted_at IS NULL
       RETURNING *`,
      [...params]
    );
    return result.rows[0];
  }

  async delete(id, organizationId) {
    const result = await db.query(
      `UPDATE vendors SET deleted_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL
       RETURNING id`,
      [id, organizationId]
    );
    if (result.rowCount === 0) throw new NotFoundError('Vendor not found');
    return result.rows[0];
  }

  async findContacts(vendorId) {
    const result = await db.query(
      `SELECT * FROM vendor_contacts WHERE vendor_id = $1 ORDER BY is_primary DESC, created_at ASC`,
      [vendorId]
    );
    return result.rows;
  }

  async findContactById(id, vendorId) {
    const result = await db.query(
      `SELECT * FROM vendor_contacts WHERE id = $1 AND vendor_id = $2`,
      [id, vendorId]
    );
    return result.rows[0];
  }

  async createContact(vendorId, data) {
    if (data.isPrimary) {
      await db.query(
        `UPDATE vendor_contacts SET is_primary = FALSE WHERE vendor_id = $1`,
        [vendorId]
      );
    }
    const result = await db.query(
      `INSERT INTO vendor_contacts (vendor_id, first_name, last_name, email, phone, position, is_primary, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING *`,
      [vendorId, data.firstName || null, data.lastName || null, data.email || null,
       data.phone || null, data.position || null, data.isPrimary || false]
    );
    return result.rows[0];
  }

  async updateContact(id, vendorId, data) {
    if (data.isPrimary) {
      await db.query(
        `UPDATE vendor_contacts SET is_primary = FALSE WHERE vendor_id = $1 AND id != $2`,
        [vendorId, id]
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
    params.push(id, vendorId);

    const result = await db.query(
      `UPDATE vendor_contacts SET ${setClauses.join(', ')}
       WHERE id = $${paramIndex} AND vendor_id = $${paramIndex + 1}
       RETURNING *`,
      [...params]
    );
    return result.rows[0];
  }

  async deleteContact(id, vendorId) {
    const result = await db.query(
      `DELETE FROM vendor_contacts WHERE id = $1 AND vendor_id = $2 RETURNING id`,
      [id, vendorId]
    );
    if (result.rowCount === 0) throw new NotFoundError('Contact not found');
    return result.rows[0];
  }

  async findContracts(vendorId) {
    const result = await db.query(
      `SELECT vc.*,
              jsonb_build_object('id', u.id, 'name', CONCAT(u.first_name, ' ', u.last_name)) AS created_by_user
       FROM vendor_contracts vc
       LEFT JOIN users u ON u.id = vc.created_by
       WHERE vc.vendor_id = $1
       ORDER BY vc.created_at DESC`,
      [vendorId]
    );
    return result.rows;
  }

  async findContractById(id, vendorId) {
    const result = await db.query(
      `SELECT vc.*,
              jsonb_build_object('id', u.id, 'name', CONCAT(u.first_name, ' ', u.last_name)) AS created_by_user
       FROM vendor_contracts vc
       LEFT JOIN users u ON u.id = vc.created_by
       WHERE vc.id = $1 AND vc.vendor_id = $2`,
      [id, vendorId]
    );
    return result.rows[0];
  }

  async createContract(vendorId, data, userId) {
    const result = await db.query(
      `INSERT INTO vendor_contracts (vendor_id, title, contract_number, start_date, end_date,
              value, terms, status, file_url, created_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
       RETURNING *`,
      [vendorId, data.title, data.contractNumber || null, data.startDate || null,
       data.endDate || null, data.value || null, data.terms || null,
       data.status || 'active', data.fileUrl || null, userId]
    );
    return result.rows[0];
  }

  async updateContract(id, vendorId, data) {
    const setClauses = [];
    const params = [];
    let paramIndex = 1;

    const fieldMap = {
      title: 'title', contractNumber: 'contract_number',
      startDate: 'start_date', endDate: 'end_date',
      value: 'value', terms: 'terms', status: 'status', fileUrl: 'file_url',
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
    params.push(id, vendorId);

    const result = await db.query(
      `UPDATE vendor_contracts SET ${setClauses.join(', ')}
       WHERE id = $${paramIndex} AND vendor_id = $${paramIndex + 1}
       RETURNING *`,
      [...params]
    );
    return result.rows[0];
  }

  async deleteContract(id, vendorId) {
    const result = await db.query(
      `DELETE FROM vendor_contracts WHERE id = $1 AND vendor_id = $2 RETURNING id`,
      [id, vendorId]
    );
    if (result.rowCount === 0) throw new NotFoundError('Contract not found');
    return result.rows[0];
  }

  async findPurchaseOrdersByVendor(vendorId, organizationId, { limit, offset }) {
    const result = await db.query(
      `SELECT po.* FROM purchase_orders po
       WHERE po.vendor_id = $1 AND po.organization_id = $2 AND po.deleted_at IS NULL
       ORDER BY po.created_at DESC
       LIMIT $3 OFFSET $4`,
      [vendorId, organizationId, limit, offset]
    );
    const countResult = await db.query(
      `SELECT COUNT(*) FROM purchase_orders
       WHERE vendor_id = $1 AND organization_id = $2 AND deleted_at IS NULL`,
      [vendorId, organizationId]
    );
    return { data: result.rows, total: parseInt(countResult.rows[0].count, 10) };
  }
}

module.exports = new VendorRepository();
