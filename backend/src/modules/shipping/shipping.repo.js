const db = require('../../config/db');
const { NotFoundError } = require('../../shared/errors');

class ShippingRepository {
  // ─── Carriers ─────────────────────────────────────────────────────
  async findAllCarriers(organizationId, { limit, offset, sortBy, sortOrder, search, status }) {
    const conditions = ['c.organization_id = $1', 'c.deleted_at IS NULL'];
    const params = [organizationId];
    let paramIndex = 2;

    if (search) {
      conditions.push(`(LOWER(c.name) LIKE LOWER($${paramIndex}) OR LOWER(c.code) LIKE LOWER($${paramIndex}))`);
      params.push(`%${search}%`);
      paramIndex++;
    }
    if (status) {
      conditions.push(`c.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');
    const allowedSort = ['name', 'code', 'status', 'created_at'];
    const sortColumn = allowedSort.includes(sortBy) ? sortBy : 'name';
    const order = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    const countResult = await db.query(
      `SELECT COUNT(*) FROM carriers c WHERE ${whereClause}`, params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const dataResult = await db.query(
      `SELECT c.* FROM carriers c
       WHERE ${whereClause}
       ORDER BY c.${sortColumn} ${order}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    return { data: dataResult.rows, total };
  }

  async findCarrierById(id, organizationId) {
    const result = await db.query(
      `SELECT c.* FROM carriers c
       WHERE c.id = $1 AND c.organization_id = $2 AND c.deleted_at IS NULL`,
      [id, organizationId]
    );
    return result.rows[0];
  }

  async findByCarrierCode(code, organizationId) {
    const result = await db.query(
      `SELECT id FROM carriers WHERE code = $1 AND organization_id = $2 AND deleted_at IS NULL`,
      [code, organizationId]
    );
    return result.rows[0];
  }

  async createCarrier(data, organizationId, userId) {
    const result = await db.query(
      `INSERT INTO carriers (organization_id, code, name, description, website, phone, email,
              tracking_url_template, status, attributes, created_by, updated_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
       RETURNING *`,
      [organizationId, data.code, data.name, data.description || null,
       data.website || null, data.phone || null, data.email || null,
       data.trackingUrlTemplate || null, data.status || 'active',
       JSON.stringify(data.attributes || {}), userId, userId]
    );
    return result.rows[0];
  }

  async updateCarrier(id, organizationId, data) {
    const setClauses = [];
    const params = [];
    let paramIndex = 1;

    const fieldMap = {
      code: 'code', name: 'name', description: 'description',
      website: 'website', phone: 'phone', email: 'email',
      trackingUrlTemplate: 'tracking_url_template', status: 'status',
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
      `UPDATE carriers SET ${setClauses.join(', ')}
       WHERE id = $${paramIndex} AND organization_id = $${paramIndex + 1} AND deleted_at IS NULL
       RETURNING *`,
      [...params]
    );
    return result.rows[0];
  }

  async deleteCarrier(id, organizationId) {
    const result = await db.query(
      `UPDATE carriers SET deleted_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL
       RETURNING id`,
      [id, organizationId]
    );
    if (result.rowCount === 0) throw new NotFoundError('Carrier not found');
    return result.rows[0];
  }

  // ─── Shipments ────────────────────────────────────────────────────
  async findAllShipments(organizationId, { limit, offset, sortBy, sortOrder, search, status, carrierId, salesOrderId }) {
    const conditions = ['s.organization_id = $1', 's.deleted_at IS NULL'];
    const params = [organizationId];
    let paramIndex = 2;

    if (search) {
      conditions.push(`(
        LOWER(s.shipment_number) LIKE LOWER($${paramIndex}) OR
        LOWER(s.carrier_tracking_number) LIKE LOWER($${paramIndex})
      )`);
      params.push(`%${search}%`);
      paramIndex++;
    }
    if (status) {
      conditions.push(`s.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }
    if (carrierId) {
      conditions.push(`s.carrier_id = $${paramIndex}`);
      params.push(carrierId);
      paramIndex++;
    }
    if (salesOrderId) {
      conditions.push(`s.sales_order_id = $${paramIndex}`);
      params.push(salesOrderId);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');
    const allowedSort = ['shipment_number', 'status', 'shipped_date', 'estimated_delivery_date', 'created_at'];
    const sortColumn = allowedSort.includes(sortBy) ? sortBy : 'created_at';
    const order = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    const countResult = await db.query(
      `SELECT COUNT(*) FROM shipments s WHERE ${whereClause}`, params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const dataResult = await db.query(
      `SELECT s.*,
              jsonb_build_object('id', c.id, 'name', c.name, 'code', c.code) AS carrier,
              jsonb_build_object('id', so.id, 'order_number', so.order_number) AS sales_order
       FROM shipments s
       LEFT JOIN carriers c ON c.id = s.carrier_id
       LEFT JOIN sales_orders so ON so.id = s.sales_order_id
       WHERE ${whereClause}
       ORDER BY s.${sortColumn} ${order}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    return { data: dataResult.rows, total };
  }

  async findShipmentById(id, organizationId) {
    const result = await db.query(
      `SELECT s.*,
              jsonb_build_object('id', c.id, 'name', c.name, 'code', c.code, 'tracking_url_template', c.tracking_url_template) AS carrier,
              jsonb_build_object('id', so.id, 'order_number', so.order_number) AS sales_order
       FROM shipments s
       LEFT JOIN carriers c ON c.id = s.carrier_id
       LEFT JOIN sales_orders so ON so.id = s.sales_order_id
       WHERE s.id = $1 AND s.organization_id = $2 AND s.deleted_at IS NULL`,
      [id, organizationId]
    );
    return result.rows[0];
  }

  async findShipmentByTrackingNumber(trackingNumber, organizationId) {
    const result = await db.query(
      `SELECT s.*,
              jsonb_build_object('id', c.id, 'name', c.name, 'code', c.code) AS carrier
       FROM shipments s
       LEFT JOIN carriers c ON c.id = s.carrier_id
       WHERE s.carrier_tracking_number = $1 AND s.organization_id = $2 AND s.deleted_at IS NULL`,
      [trackingNumber, organizationId]
    );
    return result.rows[0];
  }

  async generateShipmentNumber(organizationId) {
    const result = await db.query(
      `SELECT COUNT(*) FROM shipments WHERE organization_id = $1`,
      [organizationId]
    );
    const count = parseInt(result.rows[0].count, 10) + 1;
    const prefix = 'SHP';
    return `${prefix}-${String(count).padStart(6, '0')}`;
  }

  async createShipment(data, organizationId, userId) {
    const shipmentNumber = await this.generateShipmentNumber(organizationId);
    const result = await db.query(
      `INSERT INTO shipments (organization_id, shipment_number, sales_order_id, carrier_id,
              carrier_tracking_number, status, origin_address, destination_address,
              estimated_delivery_date, total_weight, weight_unit, total_value,
              shipping_cost, currency, notes, created_by, updated_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), NOW())
       RETURNING *`,
      [organizationId, shipmentNumber, data.salesOrderId || null,
       data.carrierId || null, data.carrierTrackingNumber || null,
       data.status || 'draft', data.originAddress || null,
       data.destinationAddress || null, data.estimatedDeliveryDate || null,
       data.totalWeight || null, data.weightUnit || 'kg',
       data.totalValue || null, data.shippingCost || null,
       data.currency || 'USD', data.notes || null, userId, userId]
    );
    return result.rows[0];
  }

  async updateShipment(id, organizationId, data) {
    const setClauses = [];
    const params = [];
    let paramIndex = 1;

    const fieldMap = {
      carrierId: 'carrier_id', carrierTrackingNumber: 'carrier_tracking_number',
      originAddress: 'origin_address', destinationAddress: 'destination_address',
      estimatedDeliveryDate: 'estimated_delivery_date',
      totalWeight: 'total_weight', weightUnit: 'weight_unit',
      totalValue: 'total_value', shippingCost: 'shipping_cost',
      currency: 'currency', notes: 'notes', status: 'status',
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
    params.push(id, organizationId);

    const result = await db.query(
      `UPDATE shipments SET ${setClauses.join(', ')}
       WHERE id = $${paramIndex} AND organization_id = $${paramIndex + 1} AND deleted_at IS NULL
       RETURNING *`,
      [...params]
    );
    return result.rows[0];
  }

  async updateShipmentStatus(id, organizationId, status, additionalFields = {}) {
    const setClauses = [`status = $3`, `updated_at = NOW()`];
    const params = [status];
    let paramIndex = 4;

    if (additionalFields.shippedDate) {
      setClauses.push(`shipped_date = $${paramIndex}`);
      params.push(additionalFields.shippedDate);
      paramIndex++;
    }
    if (additionalFields.actualDeliveryDate) {
      setClauses.push(`actual_delivery_date = $${paramIndex}`);
      params.push(additionalFields.actualDeliveryDate);
      paramIndex++;
    }

    const result = await db.query(
      `UPDATE shipments SET ${setClauses.join(', ')}
       WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL
       RETURNING *`,
      [id, organizationId, ...params]
    );
    if (result.rowCount === 0) throw new NotFoundError('Shipment not found');
    return result.rows[0];
  }

  async deleteShipment(id, organizationId) {
    const result = await db.query(
      `UPDATE shipments SET deleted_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL
       RETURNING id`,
      [id, organizationId]
    );
    if (result.rowCount === 0) throw new NotFoundError('Shipment not found');
    return result.rows[0];
  }

  // ─── Shipment Items ───────────────────────────────────────────────
  async findShipmentItems(shipmentId) {
    const result = await db.query(
      `SELECT si.*,
              jsonb_build_object('id', p.id, 'name', p.name, 'sku', p.sku) AS product
       FROM shipment_items si
       LEFT JOIN products p ON p.id = si.product_id
       WHERE si.shipment_id = $1
       ORDER BY si.created_at`,
      [shipmentId]
    );
    return result.rows;
  }

  async createShipmentItems(shipmentId, items) {
    if (!items || items.length === 0) return [];
    const values = [];
    const params = [];
    let paramIndex = 1;

    for (const item of items) {
      values.push(`($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, NOW())`);
      params.push(shipmentId, item.productId || null, item.salesOrderItemId || null, item.quantity, item.unitWeight || null);
      paramIndex += 5;
    }

    const result = await db.query(
      `INSERT INTO shipment_items (shipment_id, product_id, sales_order_item_id, quantity, unit_weight, created_at)
       VALUES ${values.join(', ')} RETURNING *`,
      params
    );
    return result.rows;
  }

  // ─── Tracking Events ──────────────────────────────────────────────
  async findTrackingEvents(shipmentId) {
    const result = await db.query(
      `SELECT * FROM shipment_tracking_events
       WHERE shipment_id = $1
       ORDER BY occurred_at DESC`,
      [shipmentId]
    );
    return result.rows;
  }

  async createTrackingEvent(shipmentId, data) {
    const result = await db.query(
      `INSERT INTO shipment_tracking_events (shipment_id, status, location, description, occurred_at, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [shipmentId, data.status, data.location || null, data.description || null, data.occurredAt || new Date()]
    );
    return result.rows[0];
  }
}

module.exports = new ShippingRepository();
