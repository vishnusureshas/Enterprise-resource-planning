const db = require('../../config/db');
const { NotFoundError } = require('../../shared/errors');

class InventoryRepository {
  // ─── Categories ───────────────────────────────────────────────────

  async findAllCategories(organizationId, { limit, offset, sortBy, sortOrder, search }) {
    const conditions = ['c.organization_id = $1', 'c.deleted_at IS NULL'];
    const params = [organizationId];
    let paramIndex = 2;

    if (search) {
      conditions.push(`(LOWER(c.name) LIKE LOWER($${paramIndex}) OR LOWER(c.slug) LIKE LOWER($${paramIndex}))`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');
    const allowedSort = ['name', 'slug', 'sort_order', 'created_at'];
    const sortColumn = allowedSort.includes(sortBy) ? sortBy : 'name';
    const order = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    const countResult = await db.query(
      `SELECT COUNT(*) FROM inventory_categories c WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const dataResult = await db.query(
      `SELECT c.id, c.parent_id, c.name, c.slug, c.description, c.is_active,
              c.sort_order, c.created_at, c.updated_at,
              jsonb_build_object('id', p.id, 'name', p.name) AS parent
       FROM inventory_categories c
       LEFT JOIN inventory_categories p ON p.id = c.parent_id AND p.deleted_at IS NULL
       WHERE ${whereClause}
       ORDER BY c.sort_order ASC, c.${sortColumn} ${order}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    return { data: dataResult.rows, total };
  }

  async findCategoryById(id, organizationId) {
    const result = await db.query(
      `SELECT c.*,
              jsonb_build_object('id', p.id, 'name', p.name) AS parent
       FROM inventory_categories c
       LEFT JOIN inventory_categories p ON p.id = c.parent_id AND p.deleted_at IS NULL
       WHERE c.id = $1 AND c.organization_id = $2 AND c.deleted_at IS NULL`,
      [id, organizationId]
    );
    return result.rows[0];
  }

  async findCategoryBySlug(slug, organizationId) {
    const result = await db.query(
      'SELECT id FROM inventory_categories WHERE slug = $1 AND organization_id = $2 AND deleted_at IS NULL',
      [slug, organizationId]
    );
    return result.rows[0];
  }

  async createCategory(data, organizationId) {
    const result = await db.query(
      `INSERT INTO inventory_categories (organization_id, parent_id, name, slug, description, is_active, sort_order, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING id, parent_id, name, slug, description, is_active, sort_order, created_at, updated_at`,
      [organizationId, data.parentId || null, data.name, data.slug, data.description || null, data.isActive !== false, data.sortOrder || 0]
    );
    return result.rows[0];
  }

  async updateCategory(id, organizationId, data) {
    const setClauses = [];
    const params = [];
    let paramIndex = 1;

    const fieldMap = {
      parentId: 'parent_id',
      name: 'name',
      slug: 'slug',
      description: 'description',
      isActive: 'is_active',
      sortOrder: 'sort_order',
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
      `UPDATE inventory_categories SET ${setClauses.join(', ')}
       WHERE id = $${paramIndex} AND organization_id = $${paramIndex + 1} AND deleted_at IS NULL
       RETURNING id, parent_id, name, slug, description, is_active, sort_order, created_at, updated_at`,
      [...params]
    );
    return result.rows[0];
  }

  async deleteCategory(id, organizationId) {
    const result = await db.query(
      `UPDATE inventory_categories SET deleted_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL
       RETURNING id`,
      [id, organizationId]
    );
    if (result.rowCount === 0) throw new NotFoundError('Category not found');
    return result.rows[0];
  }

  // ─── Products ─────────────────────────────────────────────────────

  async findAllProducts(organizationId, { limit, offset, sortBy, sortOrder, search, categoryId, isActive }) {
    const conditions = ['p.organization_id = $1', 'p.deleted_at IS NULL'];
    const params = [organizationId];
    let paramIndex = 2;

    if (search) {
      conditions.push(`(
        LOWER(p.name) LIKE LOWER($${paramIndex}) OR
        LOWER(p.sku) LIKE LOWER($${paramIndex}) OR
        LOWER(p.description) LIKE LOWER($${paramIndex})
      )`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (categoryId) {
      conditions.push(`p.category_id = $${paramIndex}`);
      params.push(categoryId);
      paramIndex++;
    }

    if (isActive !== undefined) {
      conditions.push(`p.is_active = $${paramIndex}`);
      params.push(isActive === 'true' || isActive === true);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');
    const allowedSort = ['name', 'sku', 'unit_price', 'created_at', 'updated_at'];
    const sortColumn = allowedSort.includes(sortBy) ? sortBy : 'created_at';
    const order = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    const countResult = await db.query(
      `SELECT COUNT(*) FROM products p WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const dataResult = await db.query(
      `SELECT p.id, p.category_id, p.sku, p.name, p.description,
              p.unit_of_measure, p.unit_price, p.cost_price,
              p.reorder_point, p.reorder_quantity,
              p.weight, p.weight_unit,
              p.is_active, p.is_serialized, p.is_batched, p.track_inventory,
              p.attributes, p.image_url,
              p.created_at, p.updated_at,
              jsonb_build_object('id', c.id, 'name', c.name) AS category
       FROM products p
       LEFT JOIN inventory_categories c ON c.id = p.category_id AND c.deleted_at IS NULL
       WHERE ${whereClause}
       ORDER BY p.${sortColumn} ${order}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    return { data: dataResult.rows, total };
  }

  async findProductById(id, organizationId) {
    const result = await db.query(
      `SELECT p.*,
              jsonb_build_object('id', c.id, 'name', c.name, 'slug', c.slug) AS category
       FROM products p
       LEFT JOIN inventory_categories c ON c.id = p.category_id AND c.deleted_at IS NULL
       WHERE p.id = $1 AND p.organization_id = $2 AND p.deleted_at IS NULL`,
      [id, organizationId]
    );
    return result.rows[0];
  }

  async findProductBySku(sku, organizationId) {
    const result = await db.query(
      'SELECT id FROM products WHERE sku = $1 AND organization_id = $2 AND deleted_at IS NULL',
      [sku, organizationId]
    );
    return result.rows[0];
  }

  async createProduct(data, organizationId) {
    const result = await db.query(
      `INSERT INTO products (organization_id, category_id, sku, name, description,
              unit_of_measure, unit_price, cost_price,
              reorder_point, reorder_quantity, weight, weight_unit,
              is_active, is_serialized, is_batched, track_inventory,
              attributes, image_url, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW(), NOW())
       RETURNING *`,
      [organizationId, data.categoryId || null, data.sku, data.name, data.description || null,
       data.unitOfMeasure || 'pcs', data.unitPrice || 0, data.costPrice || 0,
       data.reorderPoint || 0, data.reorderQuantity || 0, data.weight || null, data.weightUnit || 'kg',
       data.isActive !== false, data.isSerialized || false, data.isBatched || false, data.trackInventory !== false,
       JSON.stringify(data.attributes || {}), data.imageUrl || null]
    );
    return result.rows[0];
  }

  async updateProduct(id, organizationId, data) {
    const setClauses = [];
    const params = [];
    let paramIndex = 1;

    const fieldMap = {
      categoryId: 'category_id',
      sku: 'sku',
      name: 'name',
      description: 'description',
      unitOfMeasure: 'unit_of_measure',
      unitPrice: 'unit_price',
      costPrice: 'cost_price',
      reorderPoint: 'reorder_point',
      reorderQuantity: 'reorder_quantity',
      weight: 'weight',
      weightUnit: 'weight_unit',
      isActive: 'is_active',
      isSerialized: 'is_serialized',
      isBatched: 'is_batched',
      trackInventory: 'track_inventory',
      attributes: 'attributes',
      imageUrl: 'image_url',
    };

    for (const [key, value] of Object.entries(data)) {
      const dbField = fieldMap[key];
      if (dbField && value !== undefined) {
        if (key === 'attributes') {
          setClauses.push(`${dbField} = $${paramIndex}::jsonb`);
          params.push(JSON.stringify(value));
        } else {
          setClauses.push(`${dbField} = $${paramIndex}`);
          params.push(value);
        }
        paramIndex++;
      }
    }

    if (setClauses.length === 0) return null;

    setClauses.push('updated_at = NOW()');
    params.push(id, organizationId);

    const result = await db.query(
      `UPDATE products SET ${setClauses.join(', ')}
       WHERE id = $${paramIndex} AND organization_id = $${paramIndex + 1} AND deleted_at IS NULL
       RETURNING *`,
      [...params]
    );
    return result.rows[0];
  }

  async deleteProduct(id, organizationId) {
    const result = await db.query(
      `UPDATE products SET deleted_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL
       RETURNING id`,
      [id, organizationId]
    );
    if (result.rowCount === 0) throw new NotFoundError('Product not found');
    return result.rows[0];
  }

  // ─── Variants ─────────────────────────────────────────────────────

  async findVariantsByProductId(productId, organizationId) {
    const result = await db.query(
      `SELECT v.* FROM product_variants v
       JOIN products p ON p.id = v.product_id
       WHERE v.product_id = $1 AND p.organization_id = $2 AND p.deleted_at IS NULL
       ORDER BY v.created_at ASC`,
      [productId, organizationId]
    );
    return result.rows;
  }

  async findVariantById(id) {
    const result = await db.query('SELECT * FROM product_variants WHERE id = $1', [id]);
    return result.rows[0];
  }

  async findVariantBySku(sku, productId) {
    const result = await db.query(
      'SELECT id FROM product_variants WHERE sku = $1 AND product_id = $2',
      [sku, productId]
    );
    return result.rows[0];
  }

  async createVariant(productId, data) {
    const result = await db.query(
      `INSERT INTO product_variants (product_id, sku, name, options, unit_price, cost_price, weight, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
       RETURNING *`,
      [productId, data.sku, data.name, JSON.stringify(data.options),
       data.unitPrice || null, data.costPrice || null, data.weight || null,
       data.isActive !== false]
    );
    return result.rows[0];
  }

  async updateVariant(id, data) {
    const setClauses = [];
    const params = [];
    let paramIndex = 1;

    const fieldMap = {
      sku: 'sku',
      name: 'name',
      options: 'options',
      unitPrice: 'unit_price',
      costPrice: 'cost_price',
      weight: 'weight',
      isActive: 'is_active',
    };

    for (const [key, value] of Object.entries(data)) {
      const dbField = fieldMap[key];
      if (dbField && value !== undefined) {
        if (key === 'options') {
          setClauses.push(`${dbField} = $${paramIndex}::jsonb`);
          params.push(JSON.stringify(value));
        } else {
          setClauses.push(`${dbField} = $${paramIndex}`);
          params.push(value);
        }
        paramIndex++;
      }
    }

    if (setClauses.length === 0) return null;
    setClauses.push('updated_at = NOW()');
    params.push(id);

    const result = await db.query(
      `UPDATE product_variants SET ${setClauses.join(', ')} WHERE id = $${paramIndex}
       RETURNING *`,
      [...params]
    );
    return result.rows[0];
  }

  async deleteVariant(id) {
    const result = await db.query('DELETE FROM product_variants WHERE id = $1 RETURNING id', [id]);
    if (result.rowCount === 0) throw new NotFoundError('Variant not found');
    return result.rows[0];
  }

  // ─── Warehouses ───────────────────────────────────────────────────

  async findAllWarehouses(organizationId, { limit, offset, sortBy, sortOrder, search }) {
    const conditions = ['w.organization_id = $1', 'w.deleted_at IS NULL'];
    const params = [organizationId];
    let paramIndex = 2;

    if (search) {
      conditions.push(`(LOWER(w.name) LIKE LOWER($${paramIndex}) OR LOWER(w.code) LIKE LOWER($${paramIndex}))`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');
    const allowedSort = ['name', 'code', 'city', 'is_active', 'created_at'];
    const sortColumn = allowedSort.includes(sortBy) ? sortBy : 'name';
    const order = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    const countResult = await db.query(
      `SELECT COUNT(*) FROM warehouses w WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const dataResult = await db.query(
      `SELECT w.* FROM warehouses w
       WHERE ${whereClause}
       ORDER BY w.is_default DESC, w.${sortColumn} ${order}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    return { data: dataResult.rows, total };
  }

  async findWarehouseById(id, organizationId) {
    const result = await db.query(
      'SELECT * FROM warehouses WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL',
      [id, organizationId]
    );
    return result.rows[0];
  }

  async findWarehouseByCode(code, organizationId) {
    const result = await db.query(
      'SELECT id FROM warehouses WHERE code = $1 AND organization_id = $2 AND deleted_at IS NULL',
      [code, organizationId]
    );
    return result.rows[0];
  }

  async createWarehouse(data, organizationId) {
    const result = await db.query(
      `INSERT INTO warehouses (organization_id, code, name, description,
              address_line1, address_line2, city, state, postal_code, country,
              is_active, is_default, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
       RETURNING *`,
      [organizationId, data.code, data.name, data.description || null,
       data.addressLine1 || null, data.addressLine2 || null,
       data.city || null, data.state || null, data.postalCode || null, data.country || 'US',
       data.isActive !== false, data.isDefault || false]
    );
    return result.rows[0];
  }

  async updateWarehouse(id, organizationId, data) {
    const setClauses = [];
    const params = [];
    let paramIndex = 1;

    const fieldMap = {
      code: 'code',
      name: 'name',
      description: 'description',
      addressLine1: 'address_line1',
      addressLine2: 'address_line2',
      city: 'city',
      state: 'state',
      postalCode: 'postal_code',
      country: 'country',
      isActive: 'is_active',
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
    params.push(id, organizationId);

    const result = await db.query(
      `UPDATE warehouses SET ${setClauses.join(', ')}
       WHERE id = $${paramIndex} AND organization_id = $${paramIndex + 1} AND deleted_at IS NULL
       RETURNING *`,
      [...params]
    );
    return result.rows[0];
  }

  async deleteWarehouse(id, organizationId) {
    const result = await db.query(
      `UPDATE warehouses SET deleted_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL
       RETURNING id`,
      [id, organizationId]
    );
    if (result.rowCount === 0) throw new NotFoundError('Warehouse not found');
    return result.rows[0];
  }

  async findDefaultWarehouse(organizationId) {
    const result = await db.query(
      'SELECT * FROM warehouses WHERE organization_id = $1 AND is_default = TRUE AND deleted_at IS NULL LIMIT 1',
      [organizationId]
    );
    return result.rows[0];
  }

  // ─── Stock ────────────────────────────────────────────────────────

  async findStock(organizationId, filters = {}) {
    const conditions = ['ws.product_id IN (SELECT id FROM products WHERE organization_id = $1 AND deleted_at IS NULL)'];
    const params = [organizationId];
    let paramIndex = 2;

    if (filters.warehouseId) {
      conditions.push(`ws.warehouse_id = $${paramIndex}`);
      params.push(filters.warehouseId);
      paramIndex++;
    }

    if (filters.productId) {
      conditions.push(`ws.product_id = $${paramIndex}`);
      params.push(filters.productId);
      paramIndex++;
    }

    if (filters.lowStock) {
      conditions.push('ws.quantity <= ws.min_quantity AND ws.min_quantity > 0');
    }

    const whereClause = conditions.join(' AND ');

    const result = await db.query(
      `SELECT ws.id, ws.warehouse_id, ws.product_id, ws.variant_id, ws.bin_location_id,
              ws.quantity, ws.reserved_quantity, ws.min_quantity, ws.max_quantity, ws.unit_cost,
              ws.updated_at,
              jsonb_build_object('id', w.id, 'code', w.code, 'name', w.name) AS warehouse,
              jsonb_build_object('id', p.id, 'sku', p.sku, 'name', p.name) AS product
       FROM warehouse_stock ws
       JOIN warehouses w ON w.id = ws.warehouse_id AND w.deleted_at IS NULL
       JOIN products p ON p.id = ws.product_id AND p.deleted_at IS NULL
       WHERE ${whereClause}
       ORDER BY p.name ASC`,
      params
    );

    return result.rows;
  }

  async findStockItem(warehouseId, productId, variantId) {
    const result = await db.query(
      `SELECT * FROM warehouse_stock
       WHERE warehouse_id = $1 AND product_id = $2 AND (variant_id = $3 OR (variant_id IS NULL AND $3 IS NULL))`,
      [warehouseId, productId, variantId]
    );
    return result.rows[0];
  }

  async upsertStock(warehouseId, productId, variantId, quantity, unitCost) {
    const existing = await this.findStockItem(warehouseId, productId, variantId);
    if (existing) {
      const result = await db.query(
        `UPDATE warehouse_stock SET quantity = quantity + $1, unit_cost = COALESCE($2, unit_cost), updated_at = NOW()
         WHERE id = $3 RETURNING *`,
        [quantity, unitCost, existing.id]
      );
      return result.rows[0];
    }
    const result = await db.query(
      `INSERT INTO warehouse_stock (warehouse_id, product_id, variant_id, quantity, unit_cost, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING *`,
      [warehouseId, productId, variantId, Math.max(0, quantity), unitCost || null]
    );
    return result.rows[0];
  }

  async setStockQuantity(warehouseId, productId, variantId, quantity) {
    const existing = await this.findStockItem(warehouseId, productId, variantId);
    if (existing) {
      const result = await db.query(
        `UPDATE warehouse_stock SET quantity = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
        [quantity, existing.id]
      );
      return result.rows[0];
    }
    const result = await db.query(
      `INSERT INTO warehouse_stock (warehouse_id, product_id, variant_id, quantity, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING *`,
      [warehouseId, productId, variantId, quantity]
    );
    return result.rows[0];
  }

  // ─── Stock Movements ──────────────────────────────────────────────

  async createMovement(data) {
    const result = await db.query(
      `INSERT INTO stock_movements (organization_id, warehouse_id, product_id, variant_id,
              bin_location_id, movement_type, quantity, reference_type, reference_id, unit_cost, notes, created_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
       RETURNING *`,
      [data.organizationId, data.warehouseId, data.productId, data.variantId || null,
       data.binLocationId || null, data.movementType, data.quantity, data.referenceType || null,
       data.referenceId || null, data.unitCost || null, data.notes || null, data.createdBy || null]
    );
    return result.rows[0];
  }

  async findMovements(organizationId, { limit, offset, sortBy, sortOrder, productId, warehouseId, movementType, fromDate, toDate }) {
    const conditions = ['m.organization_id = $1'];
    const params = [organizationId];
    let paramIndex = 2;

    if (productId) {
      conditions.push(`m.product_id = $${paramIndex}`);
      params.push(productId);
      paramIndex++;
    }

    if (warehouseId) {
      conditions.push(`m.warehouse_id = $${paramIndex}`);
      params.push(warehouseId);
      paramIndex++;
    }

    if (movementType) {
      conditions.push(`m.movement_type = $${paramIndex}`);
      params.push(movementType);
      paramIndex++;
    }

    if (fromDate) {
      conditions.push(`m.created_at >= $${paramIndex}`);
      params.push(fromDate);
      paramIndex++;
    }

    if (toDate) {
      conditions.push(`m.created_at <= $${paramIndex}`);
      params.push(toDate);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');
    const allowedSort = ['created_at', 'movement_type', 'quantity'];
    const sortColumn = allowedSort.includes(sortBy) ? sortBy : 'created_at';
    const order = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    const countResult = await db.query(
      `SELECT COUNT(*) FROM stock_movements m WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const dataResult = await db.query(
      `SELECT m.*,
              jsonb_build_object('id', w.id, 'name', w.name) AS warehouse,
              jsonb_build_object('id', p.id, 'sku', p.sku, 'name', p.name) AS product,
              jsonb_build_object('id', u.id, 'name', CONCAT(u.first_name, ' ', u.last_name)) AS created_by_user
       FROM stock_movements m
       JOIN warehouses w ON w.id = m.warehouse_id
       JOIN products p ON p.id = m.product_id
       LEFT JOIN users u ON u.id = m.created_by
       WHERE ${whereClause}
       ORDER BY m.${sortColumn} ${order}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    return { data: dataResult.rows, total };
  }
}

module.exports = new InventoryRepository();
