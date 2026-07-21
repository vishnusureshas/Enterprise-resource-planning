const db = require('../../config/db');
const { NotFoundError } = require('../../shared/errors');

class QualityRepository {
  // ─── Checklists ─────────────────────────────────────────────────────

  async findAllChecklists(organizationId, { limit, offset, sortBy, sortOrder, search, isActive }) {
    const conditions = ['c.organization_id = $1', 'c.deleted_at IS NULL'];
    const params = [organizationId];
    let paramIndex = 2;

    if (search) {
      conditions.push(`LOWER(c.name) LIKE LOWER($${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }
    if (isActive !== undefined) {
      conditions.push(`c.is_active = $${paramIndex++}`);
      params.push(isActive === 'true' || isActive === true);
    }

    const whereClause = conditions.join(' AND ');
    const allowedSort = ['name', 'created_at'];
    const sortColumn = allowedSort.includes(sortBy) ? sortBy : 'created_at';
    const order = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    const countResult = await db.query(
      `SELECT COUNT(*) FROM quality_checklists c WHERE ${whereClause}`, params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const dataResult = await db.query(
      `SELECT c.*,
              COALESCE(
                (SELECT jsonb_agg(
                  jsonb_build_object(
                    'id', ci.id, 'sequence', ci.sequence, 'description', ci.description,
                    'expected_value', ci.expected_value, 'min_value', ci.min_value,
                    'max_value', ci.max_value, 'unit', ci.unit,
                    'is_critical', ci.is_critical, 'inspection_method', ci.inspection_method
                  ) ORDER BY ci.sequence
                ) FROM quality_checklist_items ci WHERE ci.checklist_id = c.id),
              '[]'::jsonb
       ) AS items
       FROM quality_checklists c
       WHERE ${whereClause}
       ORDER BY c.${sortColumn} ${order}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    return { data: dataResult.rows, total };
  }

  async findChecklistById(id, organizationId) {
    const result = await db.query(
      `SELECT c.*,
              COALESCE(
                (SELECT jsonb_agg(
                  jsonb_build_object(
                    'id', ci.id, 'sequence', ci.sequence, 'description', ci.description,
                    'expected_value', ci.expected_value, 'min_value', ci.min_value,
                    'max_value', ci.max_value, 'unit', ci.unit,
                    'is_critical', ci.is_critical, 'inspection_method', ci.inspection_method
                  ) ORDER BY ci.sequence
                ) FROM quality_checklist_items ci WHERE ci.checklist_id = c.id),
              '[]'::jsonb
       ) AS items
       FROM quality_checklists c
       WHERE c.id = $1 AND c.organization_id = $2 AND c.deleted_at IS NULL`,
      [id, organizationId]
    );
    return result.rows[0] || null;
  }

  async createChecklist(data, userId) {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      const result = await client.query(
        `INSERT INTO quality_checklists (organization_id, name, description, is_active, created_by, updated_by)
         VALUES ($1, $2, $3, $4, $5, $5) RETURNING *`,
        [data.organizationId, data.name, data.description, data.isActive, userId]
      );
      const checklist = result.rows[0];

      for (const item of data.items) {
        await client.query(
          `INSERT INTO quality_checklist_items (checklist_id, sequence, description, expected_value, min_value, max_value, unit, is_critical, inspection_method)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [checklist.id, item.sequence, item.description, item.expectedValue || null,
           item.minValue || null, item.maxValue || null, item.unit || null,
           item.isCritical || false, item.inspectionMethod || null]
        );
      }

      await client.query('COMMIT');
      return this.findChecklistById(checklist.id, data.organizationId);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async updateChecklist(id, organizationId, data, userId) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (data.name !== undefined) { fields.push(`name = $${paramIndex++}`); values.push(data.name); }
    if (data.description !== undefined) { fields.push(`description = $${paramIndex++}`); values.push(data.description); }
    if (data.isActive !== undefined) { fields.push(`is_active = $${paramIndex++}`); values.push(data.isActive); }

    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      if (fields.length > 0) {
        fields.push(`updated_at = NOW(), updated_by = $${paramIndex++}`);
        values.push(userId);
        values.push(id, organizationId);

        await client.query(
          `UPDATE quality_checklists SET ${fields.join(', ')} WHERE id = $${paramIndex} AND organization_id = $${paramIndex + 1} AND deleted_at IS NULL`,
          values
        );
      }

      if (data.items) {
        await client.query('DELETE FROM quality_checklist_items WHERE checklist_id = $1', [id]);
        for (const item of data.items) {
          await client.query(
            `INSERT INTO quality_checklist_items (checklist_id, sequence, description, expected_value, min_value, max_value, unit, is_critical, inspection_method)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [id, item.sequence, item.description, item.expectedValue || null,
             item.minValue || null, item.maxValue || null, item.unit || null,
             item.isCritical || false, item.inspectionMethod || null]
          );
        }
      }

      await client.query('COMMIT');
      return this.findChecklistById(id, organizationId);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async deleteChecklist(id, organizationId, userId) {
    const result = await db.query(
      'UPDATE quality_checklists SET deleted_at = NOW(), updated_at = NOW(), updated_by = $1 WHERE id = $2 AND organization_id = $3 AND deleted_at IS NULL RETURNING id',
      [userId, id, organizationId]
    );
    return result.rows[0] || null;
  }

  // ─── Inspections ────────────────────────────────────────────────────

  async generateInspectionNumber(organizationId) {
    const year = new Date().getFullYear();
    const result = await db.query(
      `SELECT COUNT(*)::int + 1 AS next FROM quality_inspections WHERE organization_id = $1 AND created_at >= date_trunc('year', NOW())`,
      [organizationId]
    );
    const seq = String(result.rows[0].next).padStart(5, '0');
    return `IQC-${year}-${seq}`;
  }

  async findAllInspections(organizationId, { limit, offset, sortBy, sortOrder, search, status, referenceType }) {
    const conditions = ['i.organization_id = $1', 'i.deleted_at IS NULL'];
    const params = [organizationId];
    let paramIndex = 2;

    if (search) {
      conditions.push(`(LOWER(i.inspection_number) LIKE LOWER($${paramIndex}) OR LOWER(i.notes) LIKE LOWER($${paramIndex}))`);
      params.push(`%${search}%`);
      paramIndex++;
    }
    if (status) {
      conditions.push(`i.status = $${paramIndex++}`);
      params.push(status);
    }
    if (referenceType) {
      conditions.push(`i.reference_type = $${paramIndex++}`);
      params.push(referenceType);
    }

    const whereClause = conditions.join(' AND ');
    const allowedSort = ['inspection_number', 'status', 'inspection_date', 'created_at'];
    const sortColumn = allowedSort.includes(sortBy) ? sortBy : 'created_at';
    const order = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    const countResult = await db.query(
      `SELECT COUNT(*) FROM quality_inspections i WHERE ${whereClause}`, params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const dataResult = await db.query(
      `SELECT i.*,
              CASE WHEN i.checklist_id IS NOT NULL THEN jsonb_build_object('id', c.id, 'name', c.name) ELSE NULL END AS checklist
       FROM quality_inspections i
       LEFT JOIN quality_checklists c ON c.id = i.checklist_id
       WHERE ${whereClause}
       ORDER BY i.${sortColumn} ${order}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    return { data: dataResult.rows, total };
  }

  async findInspectionById(id, organizationId) {
    const result = await db.query(
      `SELECT i.*,
              CASE WHEN i.checklist_id IS NOT NULL THEN jsonb_build_object('id', c.id, 'name', c.name) ELSE NULL END AS checklist,
              COALESCE(
                (SELECT jsonb_agg(
                  jsonb_build_object(
                    'id', r.id, 'checklist_item_id', r.checklist_item_id, 'item_description', r.item_description,
                    'actual_value', r.actual_value, 'actual_numeric', r.actual_numeric,
                    'is_pass', r.is_pass, 'notes', r.notes, 'inspected_by', r.inspected_by,
                    'inspected_at', r.inspected_at
                  ) ORDER BY r.inspected_at
                ) FROM quality_inspection_results r WHERE r.inspection_id = i.id),
              '[]'::jsonb
       ) AS results
       FROM quality_inspections i
       LEFT JOIN quality_checklists c ON c.id = i.checklist_id
       WHERE i.id = $1 AND i.organization_id = $2 AND i.deleted_at IS NULL`,
      [id, organizationId]
    );
    return result.rows[0] || null;
  }

  async createInspection(data, userId) {
    const number = await this.generateInspectionNumber(data.organizationId);
    const result = await db.query(
      `INSERT INTO quality_inspections (organization_id, inspection_number, checklist_id, reference_type, reference_id, notes, created_by, updated_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $7) RETURNING *`,
      [data.organizationId, number, data.checklistId || null, data.referenceType, data.referenceId, data.notes || null, userId]
    );
    return this.findInspectionById(result.rows[0].id, data.organizationId);
  }

  async updateInspectionStatus(id, organizationId, status, userId) {
    const result = await db.query(
      `UPDATE quality_inspections SET status = $1, updated_at = NOW(), updated_by = $2
       WHERE id = $3 AND organization_id = $4 AND deleted_at IS NULL RETURNING *`,
      [status, userId, id, organizationId]
    );
    return result.rows[0] || null;
  }

  async saveResults(inspectionId, data, userId) {
    await db.query(
      `UPDATE quality_inspections SET status = $1, result_summary = $2, notes = CASE WHEN $3 IS NOT NULL THEN $3 ELSE notes END,
       inspected_by = $4, inspection_date = NOW(), updated_at = NOW()
       WHERE id = $5`,
      [data.status, data.resultSummary, data.notes || null, userId, inspectionId]
    );

    for (const result of data.results) {
      await db.query(
        `INSERT INTO quality_inspection_results (inspection_id, checklist_item_id, item_description, actual_value, actual_numeric, is_pass, notes, inspected_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [inspectionId, result.checklistItemId || null, result.itemDescription,
         result.actualValue || null, result.actualNumeric || null, result.isPass,
         result.notes || null, userId]
      );
    }

    return this.findInspectionById(inspectionId, userId);
  }

  async deleteInspection(id, organizationId, userId) {
    const result = await db.query(
      'UPDATE quality_inspections SET deleted_at = NOW(), updated_at = NOW(), updated_by = $1 WHERE id = $2 AND organization_id = $3 AND deleted_at IS NULL RETURNING id',
      [userId, id, organizationId]
    );
    return result.rows[0] || null;
  }

  // ─── Inspection Criteria ────────────────────────────────────────────

  async findAllCriteria(organizationId, { limit, offset, sortBy, sortOrder, search, productId, isActive }) {
    const conditions = ['c.organization_id = $1'];
    const params = [organizationId];
    let paramIndex = 2;

    if (search) {
      conditions.push(`LOWER(c.name) LIKE LOWER($${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }
    if (productId) {
      conditions.push(`(c.product_id = $${paramIndex} OR c.product_id IS NULL)`);
      params.push(productId);
      paramIndex++;
    }
    if (isActive !== undefined) {
      conditions.push(`c.is_active = $${paramIndex++}`);
      params.push(isActive === 'true' || isActive === true);
    }

    const whereClause = conditions.join(' AND ');
    const allowedSort = ['name', 'created_at'];
    const sortColumn = allowedSort.includes(sortBy) ? sortBy : 'created_at';
    const order = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    const countResult = await db.query(
      `SELECT COUNT(*) FROM quality_inspection_criteria c WHERE ${whereClause}`, params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const dataResult = await db.query(
      `SELECT c.*
       FROM quality_inspection_criteria c
       WHERE ${whereClause}
       ORDER BY c.${sortColumn} ${order}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    return { data: dataResult.rows, total };
  }

  async findCriterionById(id, organizationId) {
    const result = await db.query(
      'SELECT * FROM quality_inspection_criteria WHERE id = $1 AND organization_id = $2',
      [id, organizationId]
    );
    return result.rows[0] || null;
  }

  async createCriterion(data, userId) {
    const result = await db.query(
      `INSERT INTO quality_inspection_criteria (organization_id, product_id, name, description, min_value, max_value, unit, is_critical, is_active, created_by, updated_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10) RETURNING *`,
      [data.organizationId, data.productId || null, data.name, data.description || null,
       data.minValue || null, data.maxValue || null, data.unit || null,
       data.isCritical || false, data.isActive !== false, userId]
    );
    return result.rows[0];
  }

  async updateCriterion(id, organizationId, data, userId) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (data.name !== undefined) { fields.push(`name = $${paramIndex++}`); values.push(data.name); }
    if (data.description !== undefined) { fields.push(`description = $${paramIndex++}`); values.push(data.description); }
    if (data.minValue !== undefined) { fields.push(`min_value = $${paramIndex++}`); values.push(data.minValue); }
    if (data.maxValue !== undefined) { fields.push(`max_value = $${paramIndex++}`); values.push(data.maxValue); }
    if (data.unit !== undefined) { fields.push(`unit = $${paramIndex++}`); values.push(data.unit); }
    if (data.isCritical !== undefined) { fields.push(`is_critical = $${paramIndex++}`); values.push(data.isCritical); }
    if (data.isActive !== undefined) { fields.push(`is_active = $${paramIndex++}`); values.push(data.isActive); }

    if (fields.length === 0) return null;

    fields.push(`updated_at = NOW(), updated_by = $${paramIndex++}`);
    values.push(userId);
    values.push(id, organizationId);

    const result = await db.query(
      `UPDATE quality_inspection_criteria SET ${fields.join(', ')} WHERE id = $${paramIndex} AND organization_id = $${paramIndex + 1} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  async deleteCriterion(id, organizationId) {
    const result = await db.query(
      'DELETE FROM quality_inspection_criteria WHERE id = $1 AND organization_id = $2 RETURNING id',
      [id, organizationId]
    );
    return result.rows[0] || null;
  }

  // ─── Reports ────────────────────────────────────────────────────────

  async findInspectionsByReference(referenceType, referenceId, organizationId) {
    const result = await db.query(
      `SELECT i.*, jsonb_build_object('id', c.id, 'name', c.name) AS checklist
       FROM quality_inspections i
       LEFT JOIN quality_checklists c ON c.id = i.checklist_id
       WHERE i.reference_type = $1 AND i.reference_id = $2 AND i.organization_id = $3 AND i.deleted_at IS NULL
       ORDER BY i.created_at DESC`,
      [referenceType, referenceId, organizationId]
    );
    return result.rows;
  }
}

module.exports = new QualityRepository();
