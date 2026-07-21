const db = require('../../config/db');
const { NotFoundError } = require('../../shared/errors');

class ManufacturingRepository {
  // ─── Work Centers ───────────────────────────────────────────────────

  async findAllWorkCenters(organizationId, { limit, offset, sortBy, sortOrder, search }) {
    const conditions = ['wc.organization_id = $1', 'wc.deleted_at IS NULL'];
    const params = [organizationId];
    let paramIndex = 2;

    if (search) {
      conditions.push(`(LOWER(wc.name) LIKE LOWER($${paramIndex}) OR LOWER(wc.code) LIKE LOWER($${paramIndex}))`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');
    const allowedSort = ['name', 'code', 'capacity_per_shift', 'created_at'];
    const sortColumn = allowedSort.includes(sortBy) ? sortBy : 'name';
    const order = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    const countResult = await db.query(
      `SELECT COUNT(*) FROM work_centers wc WHERE ${whereClause}`, params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const dataResult = await db.query(
      `SELECT wc.* FROM work_centers wc
       WHERE ${whereClause}
       ORDER BY wc.${sortColumn} ${order}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    return { data: dataResult.rows, total };
  }

  async findWorkCenterById(id, organizationId) {
    const result = await db.query(
      'SELECT * FROM work_centers WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL',
      [id, organizationId]
    );
    return result.rows[0] || null;
  }

  async findWorkCenterByCode(code, organizationId) {
    const result = await db.query(
      'SELECT id FROM work_centers WHERE organization_id = $1 AND code = $2 AND deleted_at IS NULL',
      [organizationId, code]
    );
    return result.rows[0] || null;
  }

  async createWorkCenter(data, userId) {
    const result = await db.query(
      `INSERT INTO work_centers (organization_id, name, code, description, capacity_per_shift, operating_hours, is_active, created_by, updated_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8) RETURNING *`,
      [data.organizationId, data.name, data.code, data.description, data.capacityPerShift, JSON.stringify(data.operatingHours || {}), data.isActive, userId]
    );
    return result.rows[0];
  }

  async updateWorkCenter(id, organizationId, data, userId) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (data.name !== undefined) { fields.push(`name = $${paramIndex++}`); values.push(data.name); }
    if (data.code !== undefined) { fields.push(`code = $${paramIndex++}`); values.push(data.code); }
    if (data.description !== undefined) { fields.push(`description = $${paramIndex++}`); values.push(data.description); }
    if (data.capacityPerShift !== undefined) { fields.push(`capacity_per_shift = $${paramIndex++}`); values.push(data.capacityPerShift); }
    if (data.operatingHours !== undefined) { fields.push(`operating_hours = $${paramIndex++}`); values.push(JSON.stringify(data.operatingHours)); }
    if (data.isActive !== undefined) { fields.push(`is_active = $${paramIndex++}`); values.push(data.isActive); }

    if (fields.length === 0) return null;

    fields.push(`updated_at = NOW(), updated_by = $${paramIndex++}`);
    values.push(userId);
    values.push(id, organizationId);

    const result = await db.query(
      `UPDATE work_centers SET ${fields.join(', ')} WHERE id = $${paramIndex} AND organization_id = $${paramIndex + 1} AND deleted_at IS NULL RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  async deleteWorkCenter(id, organizationId, userId) {
    const result = await db.query(
      'UPDATE work_centers SET deleted_at = NOW(), updated_at = NOW(), updated_by = $1 WHERE id = $2 AND organization_id = $3 AND deleted_at IS NULL RETURNING id',
      [userId, id, organizationId]
    );
    return result.rows[0] || null;
  }

  // ─── BOM ────────────────────────────────────────────────────────────

  async findAllBoms(organizationId, { limit, offset, sortBy, sortOrder, search, productId, isActive }) {
    const conditions = ['b.organization_id = $1', 'b.deleted_at IS NULL'];
    const params = [organizationId];
    let paramIndex = 2;

    if (search) {
      conditions.push(`(LOWER(b.name) LIKE LOWER($${paramIndex}) OR LOWER(p.name) LIKE LOWER($${paramIndex}) OR LOWER(p.sku) LIKE LOWER($${paramIndex}))`);
      params.push(`%${search}%`);
      paramIndex++;
    }
    if (productId) {
      conditions.push(`b.product_id = $${paramIndex++}`);
      params.push(productId);
    }
    if (isActive !== undefined) {
      conditions.push(`b.is_active = $${paramIndex++}`);
      params.push(isActive === 'true' || isActive === true);
    }

    const whereClause = conditions.join(' AND ');
    const allowedSort = ['name', 'version', 'quantity', 'created_at'];
    const sortColumn = allowedSort.includes(sortBy) ? sortBy : 'created_at';
    const order = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    const countResult = await db.query(
      `SELECT COUNT(*) FROM bom b JOIN products p ON p.id = b.product_id WHERE ${whereClause}`, params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const dataResult = await db.query(
      `SELECT b.*,
              jsonb_build_object('id', p.id, 'name', p.name, 'sku', p.sku) AS product
       FROM bom b
       JOIN products p ON p.id = b.product_id
       WHERE ${whereClause}
       ORDER BY b.${sortColumn} ${order}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    return { data: dataResult.rows, total };
  }

  async findBomById(id, organizationId) {
    const result = await db.query(
      `SELECT b.*,
              jsonb_build_object('id', p.id, 'name', p.name, 'sku', p.sku) AS product,
              COALESCE(
                (SELECT jsonb_agg(
                  jsonb_build_object(
                    'id', bi.id, 'product_id', bi.product_id, 'quantity', bi.quantity,
                    'unit_cost', bi.unit_cost, 'sequence', bi.sequence, 'notes', bi.notes,
                    'product', jsonb_build_object('id', cp.id, 'name', cp.name, 'sku', cp.sku)
                  ) ORDER BY bi.sequence
                ) FROM bom_items bi
                JOIN products cp ON cp.id = bi.product_id
                WHERE bi.bom_id = b.id),
              '[]'::jsonb
       ) AS items
       FROM bom b
       JOIN products p ON p.id = b.product_id
       WHERE b.id = $1 AND b.organization_id = $2 AND b.deleted_at IS NULL`,
      [id, organizationId]
    );
    return result.rows[0] || null;
  }

  async createBom(data, userId) {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      const bomResult = await client.query(
        `INSERT INTO bom (organization_id, product_id, name, version, quantity, is_active, notes, created_by, updated_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8) RETURNING *`,
        [data.organizationId, data.productId, data.name, data.version, data.quantity, data.isActive, data.notes, userId]
      );
      const bom = bomResult.rows[0];

      for (const item of data.items) {
        await client.query(
          `INSERT INTO bom_items (bom_id, product_id, quantity, unit_cost, sequence, notes)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [bom.id, item.productId, item.quantity, item.unitCost || null, item.sequence || 0, item.notes || null]
        );
      }

      await client.query('COMMIT');
      return this.findBomById(bom.id, data.organizationId);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async updateBom(id, organizationId, data, userId) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (data.name !== undefined) { fields.push(`name = $${paramIndex++}`); values.push(data.name); }
    if (data.version !== undefined) { fields.push(`version = $${paramIndex++}`); values.push(data.version); }
    if (data.quantity !== undefined) { fields.push(`quantity = $${paramIndex++}`); values.push(data.quantity); }
    if (data.isActive !== undefined) { fields.push(`is_active = $${paramIndex++}`); values.push(data.isActive); }
    if (data.notes !== undefined) { fields.push(`notes = $${paramIndex++}`); values.push(data.notes); }

    if (fields.length === 0 && !data.items) return null;

    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      if (fields.length > 0) {
        fields.push(`updated_at = NOW(), updated_by = $${paramIndex++}`);
        values.push(userId);
        values.push(id, organizationId);

        await client.query(
          `UPDATE bom SET ${fields.join(', ')} WHERE id = $${paramIndex} AND organization_id = $${paramIndex + 1} AND deleted_at IS NULL`,
          values
        );
      }

      if (data.items) {
        await client.query('DELETE FROM bom_items WHERE bom_id = $1', [id]);
        for (const item of data.items) {
          await client.query(
            `INSERT INTO bom_items (bom_id, product_id, quantity, unit_cost, sequence, notes)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [id, item.productId, item.quantity, item.unitCost || null, item.sequence || 0, item.notes || null]
          );
        }
      }

      await client.query('COMMIT');
      return this.findBomById(id, organizationId);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async deleteBom(id, organizationId, userId) {
    const result = await db.query(
      'UPDATE bom SET deleted_at = NOW(), updated_at = NOW(), updated_by = $1 WHERE id = $2 AND organization_id = $3 AND deleted_at IS NULL RETURNING id',
      [userId, id, organizationId]
    );
    return result.rows[0] || null;
  }

  async explodeBom(bomId, organizationId) {
    const result = await db.query(
      `WITH RECURSIVE bom_tree AS (
        SELECT bi.id, bi.bom_id, bi.product_id, bi.quantity AS qty_per_parent,
               bi.quantity AS total_quantity, 1 AS level,
               p.name AS product_name, p.sku AS product_sku, bi.unit_cost
        FROM bom_items bi
        JOIN products p ON p.id = bi.product_id
        WHERE bi.bom_id = $1

        UNION ALL

        SELECT bi.id, bi.bom_id, bi.product_id, bi.quantity,
               bi.quantity * bt.total_quantity,
               bt.level + 1,
               p.name, p.sku, bi.unit_cost
        FROM bom_items bi
        JOIN bom_tree bt ON bt.product_id = bi.bom_id
        JOIN products p ON p.id = bi.product_id
        JOIN bom b ON b.id = bi.bom_id
        WHERE b.organization_id = $2 AND b.deleted_at IS NULL AND b.is_active = true
      )
      SELECT * FROM bom_tree ORDER BY level, product_name`,
      [bomId, organizationId]
    );
    return result.rows;
  }

  // ─── Work Orders ────────────────────────────────────────────────────

  async findAllWorkOrders(organizationId, { limit, offset, sortBy, sortOrder, search, status, productId }) {
    const conditions = ['wo.organization_id = $1', 'wo.deleted_at IS NULL'];
    const params = [organizationId];
    let paramIndex = 2;

    if (search) {
      conditions.push(`(LOWER(wo.work_order_number) LIKE LOWER($${paramIndex}) OR LOWER(p.name) LIKE LOWER($${paramIndex}) OR LOWER(p.sku) LIKE LOWER($${paramIndex}))`);
      params.push(`%${search}%`);
      paramIndex++;
    }
    if (status) {
      conditions.push(`wo.status = $${paramIndex++}`);
      params.push(status);
    }
    if (productId) {
      conditions.push(`wo.product_id = $${paramIndex++}`);
      params.push(productId);
    }

    const whereClause = conditions.join(' AND ');
    const allowedSort = ['work_order_number', 'quantity', 'status', 'start_date', 'due_date', 'created_at'];
    const sortColumn = allowedSort.includes(sortBy) ? sortBy : 'created_at';
    const order = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    const countResult = await db.query(
      `SELECT COUNT(*) FROM work_orders wo JOIN products p ON p.id = wo.product_id WHERE ${whereClause}`, params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const dataResult = await db.query(
      `SELECT wo.*,
              jsonb_build_object('id', p.id, 'name', p.name, 'sku', p.sku) AS product,
              CASE WHEN wc.id IS NOT NULL THEN jsonb_build_object('id', wc.id, 'name', wc.name) ELSE NULL END AS work_center,
              CASE WHEN b.id IS NOT NULL THEN jsonb_build_object('id', b.id, 'name', b.name) ELSE NULL END AS bom
       FROM work_orders wo
       JOIN products p ON p.id = wo.product_id
       LEFT JOIN work_centers wc ON wc.id = wo.work_center_id
       LEFT JOIN bom b ON b.id = wo.bom_id
       WHERE ${whereClause}
       ORDER BY wo.${sortColumn} ${order}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    return { data: dataResult.rows, total };
  }

  async findWorkOrderById(id, organizationId) {
    const result = await db.query(
      `SELECT wo.*,
              jsonb_build_object('id', p.id, 'name', p.name, 'sku', p.sku) AS product,
              CASE WHEN wc.id IS NOT NULL THEN jsonb_build_object('id', wc.id, 'name', wc.name) ELSE NULL END AS work_center,
              CASE WHEN b.id IS NOT NULL THEN jsonb_build_object('id', b.id, 'name', b.name) ELSE NULL END AS bom,
              COALESCE(
                (SELECT jsonb_agg(
                  jsonb_build_object(
                    'id', op.id, 'sequence', op.sequence, 'name', op.name,
                    'work_center_id', op.work_center_id, 'planned_duration_minutes', op.planned_duration_minutes,
                    'actual_duration_minutes', op.actual_duration_minutes, 'status', op.status,
                    'start_time', op.start_time, 'end_time', op.end_time,
                    'work_center', CASE WHEN wc2.id IS NOT NULL THEN jsonb_build_object('id', wc2.id, 'name', wc2.name) ELSE NULL END
                  ) ORDER BY op.sequence
                ) FROM work_order_operations op
                LEFT JOIN work_centers wc2 ON wc2.id = op.work_center_id
                WHERE op.work_order_id = wo.id),
              '[]'::jsonb
       ) AS operations,
              COALESCE(
                (SELECT jsonb_agg(
                  jsonb_build_object(
                    'id', c.id, 'product_id', c.product_id, 'quantity_planned', c.quantity_planned,
                    'quantity_actual', c.quantity_actual, 'warehouse_stock_id', c.warehouse_stock_id,
                    'unit_cost', c.unit_cost, 'notes', c.notes,
                    'product', jsonb_build_object('id', cp.id, 'name', cp.name, 'sku', cp.sku)
                  ) ORDER BY c.created_at
                ) FROM work_order_consumptions c
                JOIN products cp ON cp.id = c.product_id
                WHERE c.work_order_id = wo.id),
              '[]'::jsonb
       ) AS consumptions,
              COALESCE(
                (SELECT jsonb_agg(
                  jsonb_build_object(
                    'id', o.id, 'product_id', o.product_id, 'quantity', o.quantity,
                    'warehouse_stock_id', o.warehouse_stock_id, 'batch_number', o.batch_number,
                    'is_defective', o.is_defective, 'notes', o.notes,
                    'product', jsonb_build_object('id', op2.id, 'name', op2.name, 'sku', op2.sku)
                  ) ORDER BY o.created_at
                ) FROM work_order_outputs o
                JOIN products op2 ON op2.id = o.product_id
                WHERE o.work_order_id = wo.id),
              '[]'::jsonb
       ) AS outputs
       FROM work_orders wo
       JOIN products p ON p.id = wo.product_id
       LEFT JOIN work_centers wc ON wc.id = wo.work_center_id
       LEFT JOIN bom b ON b.id = wo.bom_id
       WHERE wo.id = $1 AND wo.organization_id = $2 AND wo.deleted_at IS NULL`,
      [id, organizationId]
    );
    return result.rows[0] || null;
  }

  async generateWorkOrderNumber(organizationId) {
    const result = await db.query(
      `SELECT COUNT(*)::int + 1 AS next FROM work_orders WHERE organization_id = $1 AND created_at >= date_trunc('year', NOW())`,
      [organizationId]
    );
    const year = new Date().getFullYear();
    const seq = String(result.rows[0].next).padStart(5, '0');
    return `WO-${year}-${seq}`;
  }

  async createWorkOrder(data, userId) {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      const woNumber = await this.generateWorkOrderNumber(data.organizationId);

      const result = await client.query(
        `INSERT INTO work_orders (organization_id, work_order_number, product_id, bom_id, work_center_id,
          quantity, priority, start_date, due_date, notes, status, created_by, updated_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'draft', $11, $11) RETURNING *`,
        [data.organizationId, woNumber, data.productId, data.bomId || null, data.workCenterId || null,
         data.quantity, data.priority, data.startDate || null, data.dueDate || null, data.notes || null, userId]
      );

      await client.query('COMMIT');
      return this.findWorkOrderById(result.rows[0].id, data.organizationId);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async updateWorkOrderStatus(id, organizationId, status, userId) {
    const result = await db.query(
      `UPDATE work_orders SET status = $1, updated_at = NOW(), updated_by = $2
       WHERE id = $3 AND organization_id = $4 AND deleted_at IS NULL RETURNING *`,
      [status, userId, id, organizationId]
    );
    return result.rows[0] || null;
  }

  async startWorkOrder(id, organizationId, userId) {
    const result = await db.query(
      `UPDATE work_orders SET status = 'in_progress', start_date = COALESCE(start_date, NOW()), updated_at = NOW(), updated_by = $1
       WHERE id = $2 AND organization_id = $3 AND deleted_at IS NULL AND status IN ('draft', 'planned') RETURNING *`,
      [userId, id, organizationId]
    );
    return result.rows[0] || null;

  }

  async completeWorkOrder(id, organizationId, userId) {
    const result = await db.query(
      `UPDATE work_orders SET status = 'completed', completed_date = NOW(), updated_at = NOW(), updated_by = $1
       WHERE id = $2 AND organization_id = $3 AND deleted_at IS NULL AND status = 'in_progress' RETURNING *`,
      [userId, id, organizationId]
    );
    return result.rows[0] || null;
  }

  async createConsumption(workOrderId, data, userId) {
    const result = await db.query(
      `INSERT INTO work_order_consumptions (work_order_id, product_id, quantity_planned, quantity_actual, warehouse_stock_id, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [workOrderId, data.productId, data.quantityPlanned || data.quantityActual, data.quantityActual,
       data.warehouseStockId || null, data.notes || null, userId]
    );
    return result.rows[0];
  }

  async createOutput(workOrderId, data, userId) {
    const result = await db.query(
      `INSERT INTO work_order_outputs (work_order_id, product_id, quantity, warehouse_stock_id, batch_number, is_defective, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [workOrderId, data.productId, data.quantity, data.warehouseStockId || null,
       data.batchNumber || null, data.isDefective || false, data.notes || null, userId]
    );
    return result.rows[0];
  }

  async updateWorkOrderQuantities(id, producedDelta, scrappedDelta) {
    await db.query(
      `UPDATE work_orders SET quantity_produced = quantity_produced + $1, quantity_scrapped = quantity_scrapped + $2,
       updated_at = NOW() WHERE id = $3`,
      [producedDelta || 0, scrappedDelta || 0, id]
    );
  }

  async deductStock(warehouseStockId, quantity) {
    await db.query(
      `UPDATE warehouse_stock SET quantity = quantity - $1, updated_at = NOW() WHERE id = $2 AND quantity >= $1`,
      [quantity, warehouseStockId]
    );
  }

  async addStock(warehouseStockId, quantity) {
    await db.query(
      `UPDATE warehouse_stock SET quantity = quantity + $1, updated_at = NOW() WHERE id = $2`,
      [quantity, warehouseStockId]
    );
  }
}

module.exports = new ManufacturingRepository();
