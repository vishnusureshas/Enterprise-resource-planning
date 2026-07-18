const inventoryRepo = require('./inventory.repo');
const { BadRequestError, NotFoundError } = require('../../shared/errors');
const logger = require('../../config/logger');

class InventoryService {
  // ─── Categories ───────────────────────────────────────────────────

  async listCategories(organizationId, query) {
    const pagination = {
      limit: query.limit || 20,
      offset: query.offset || 0,
      sortBy: query.sortBy || 'name',
      sortOrder: query.sortOrder || 'ASC',
    };

    const { data, total } = await inventoryRepo.findAllCategories(organizationId, {
      ...pagination,
      search: query.search,
    });

    return { data, total, ...pagination };
  }

  async getCategory(id, organizationId) {
    const category = await inventoryRepo.findCategoryById(id, organizationId);
    if (!category) throw new NotFoundError('Category not found');
    return category;
  }

  async createCategory(data, organizationId) {
    const existing = await inventoryRepo.findCategoryBySlug(data.slug, organizationId);
    if (existing) throw new BadRequestError('Category slug already exists');

    if (data.parentId) {
      const parent = await inventoryRepo.findCategoryById(data.parentId, organizationId);
      if (!parent) throw new BadRequestError('Parent category not found');
    }

    const category = await inventoryRepo.createCategory(data, organizationId);
    logger.info('Category created', { categoryId: category.id, organizationId });
    return category;
  }

  async updateCategory(id, organizationId, data) {
    const existing = await inventoryRepo.findCategoryById(id, organizationId);
    if (!existing) throw new NotFoundError('Category not found');

    if (data.slug && data.slug !== existing.slug) {
      const slugExists = await inventoryRepo.findCategoryBySlug(data.slug, organizationId);
      if (slugExists) throw new BadRequestError('Category slug already exists');
    }

    if (data.parentId && data.parentId === id) {
      throw new BadRequestError('Category cannot be its own parent');
    }

    const category = await inventoryRepo.updateCategory(id, organizationId, data);
    logger.info('Category updated', { categoryId: id, organizationId });
    return category;
  }

  async deleteCategory(id, organizationId) {
    const existing = await inventoryRepo.findCategoryById(id, organizationId);
    if (!existing) throw new NotFoundError('Category not found');
    await inventoryRepo.deleteCategory(id, organizationId);
    logger.info('Category deleted', { categoryId: id, organizationId });
    return { success: true };
  }

  // ─── Products ─────────────────────────────────────────────────────

  async listProducts(organizationId, query) {
    const pagination = {
      limit: query.limit || 20,
      offset: query.offset || 0,
      sortBy: query.sortBy || 'created_at',
      sortOrder: query.sortOrder || 'DESC',
    };

    const { data, total } = await inventoryRepo.findAllProducts(organizationId, {
      ...pagination,
      search: query.search,
      categoryId: query.categoryId,
      isActive: query.isActive,
    });

    return { data, total, ...pagination };
  }

  async getProduct(id, organizationId) {
    const product = await inventoryRepo.findProductById(id, organizationId);
    if (!product) throw new NotFoundError('Product not found');

    const variants = await inventoryRepo.findVariantsByProductId(id, organizationId);

    return { ...product, variants };
  }

  async createProduct(data, organizationId) {
    const existing = await inventoryRepo.findProductBySku(data.sku, organizationId);
    if (existing) throw new BadRequestError('Product SKU already exists');

    if (data.categoryId) {
      const category = await inventoryRepo.findCategoryById(data.categoryId, organizationId);
      if (!category) throw new BadRequestError('Category not found');
    }

    const product = await inventoryRepo.createProduct(data, organizationId);
    logger.info('Product created', { productId: product.id, sku: product.sku, organizationId });
    return product;
  }

  async updateProduct(id, organizationId, data) {
    const existing = await inventoryRepo.findProductById(id, organizationId);
    if (!existing) throw new NotFoundError('Product not found');

    if (data.sku && data.sku !== existing.sku) {
      const skuExists = await inventoryRepo.findProductBySku(data.sku, organizationId);
      if (skuExists) throw new BadRequestError('Product SKU already exists');
    }

    if (data.categoryId) {
      const category = await inventoryRepo.findCategoryById(data.categoryId, organizationId);
      if (!category) throw new BadRequestError('Category not found');
    }

    const product = await inventoryRepo.updateProduct(id, organizationId, data);
    logger.info('Product updated', { productId: id, organizationId });
    return product;
  }

  async deleteProduct(id, organizationId) {
    const existing = await inventoryRepo.findProductById(id, organizationId);
    if (!existing) throw new NotFoundError('Product not found');
    await inventoryRepo.deleteProduct(id, organizationId);
    logger.info('Product deleted', { productId: id, organizationId });
    return { success: true };
  }

  // ─── Variants ─────────────────────────────────────────────────────

  async listVariants(productId, organizationId) {
    const product = await inventoryRepo.findProductById(productId, organizationId);
    if (!product) throw new NotFoundError('Product not found');
    return inventoryRepo.findVariantsByProductId(productId, organizationId);
  }

  async createVariant(productId, organizationId, data) {
    const product = await inventoryRepo.findProductById(productId, organizationId);
    if (!product) throw new NotFoundError('Product not found');

    const existing = await inventoryRepo.findVariantBySku(data.sku, productId);
    if (existing) throw new BadRequestError('Variant SKU already exists for this product');

    const variant = await inventoryRepo.createVariant(productId, data);
    logger.info('Variant created', { variantId: variant.id, productId, organizationId });
    return variant;
  }

  async updateVariant(productId, variantId, organizationId, data) {
    const product = await inventoryRepo.findProductById(productId, organizationId);
    if (!product) throw new NotFoundError('Product not found');

    const existing = await inventoryRepo.findVariantById(variantId);
    if (!existing) throw new NotFoundError('Variant not found');

    if (data.sku && data.sku !== existing.sku) {
      const skuExists = await inventoryRepo.findVariantBySku(data.sku, productId);
      if (skuExists) throw new BadRequestError('Variant SKU already exists for this product');
    }

    const variant = await inventoryRepo.updateVariant(variantId, data);
    logger.info('Variant updated', { variantId, productId, organizationId });
    return variant;
  }

  async deleteVariant(productId, variantId, organizationId) {
    const product = await inventoryRepo.findProductById(productId, organizationId);
    if (!product) throw new NotFoundError('Product not found');

    const existing = await inventoryRepo.findVariantById(variantId);
    if (!existing) throw new NotFoundError('Variant not found');

    await inventoryRepo.deleteVariant(variantId);
    logger.info('Variant deleted', { variantId, productId, organizationId });
    return { success: true };
  }

  // ─── Warehouses ───────────────────────────────────────────────────

  async listWarehouses(organizationId, query) {
    const pagination = {
      limit: query.limit || 20,
      offset: query.offset || 0,
      sortBy: query.sortBy || 'name',
      sortOrder: query.sortOrder || 'ASC',
    };

    const { data, total } = await inventoryRepo.findAllWarehouses(organizationId, {
      ...pagination,
      search: query.search,
    });

    return { data, total, ...pagination };
  }

  async getWarehouse(id, organizationId) {
    const warehouse = await inventoryRepo.findWarehouseById(id, organizationId);
    if (!warehouse) throw new NotFoundError('Warehouse not found');
    return warehouse;
  }

  async createWarehouse(data, organizationId) {
    const existing = await inventoryRepo.findWarehouseByCode(data.code, organizationId);
    if (existing) throw new BadRequestError('Warehouse code already exists');

    if (data.isDefault) {
      const defaultWh = await inventoryRepo.findDefaultWarehouse(organizationId);
      if (defaultWh) {
        await inventoryRepo.updateWarehouse(defaultWh.id, organizationId, { isDefault: false });
      }
    }

    const warehouse = await inventoryRepo.createWarehouse(data, organizationId);
    logger.info('Warehouse created', { warehouseId: warehouse.id, organizationId });
    return warehouse;
  }

  async updateWarehouse(id, organizationId, data) {
    const existing = await inventoryRepo.findWarehouseById(id, organizationId);
    if (!existing) throw new NotFoundError('Warehouse not found');

    if (data.code && data.code !== existing.code) {
      const codeExists = await inventoryRepo.findWarehouseByCode(data.code, organizationId);
      if (codeExists) throw new BadRequestError('Warehouse code already exists');
    }

    if (data.isDefault && !existing.isDefault) {
      const defaultWh = await inventoryRepo.findDefaultWarehouse(organizationId);
      if (defaultWh && defaultWh.id !== id) {
        await inventoryRepo.updateWarehouse(defaultWh.id, organizationId, { isDefault: false });
      }
    }

    const warehouse = await inventoryRepo.updateWarehouse(id, organizationId, data);
    logger.info('Warehouse updated', { warehouseId: id, organizationId });
    return warehouse;
  }

  async deleteWarehouse(id, organizationId) {
    const existing = await inventoryRepo.findWarehouseById(id, organizationId);
    if (!existing) throw new NotFoundError('Warehouse not found');

    if (existing.is_default) {
      throw new BadRequestError('Cannot delete default warehouse. Set another warehouse as default first.');
    }

    await inventoryRepo.deleteWarehouse(id, organizationId);
    logger.info('Warehouse deleted', { warehouseId: id, organizationId });
    return { success: true };
  }

  // ─── Stock ────────────────────────────────────────────────────────

  async getStock(organizationId, filters = {}) {
    return inventoryRepo.findStock(organizationId, filters);
  }

  async transferStock(data, userId, organizationId) {
    if (data.fromWarehouseId === data.toWarehouseId) {
      throw new BadRequestError('Source and destination warehouses must be different');
    }

    const fromWh = await inventoryRepo.findWarehouseById(data.fromWarehouseId, organizationId);
    if (!fromWh) throw new NotFoundError('Source warehouse not found');

    const toWh = await inventoryRepo.findWarehouseById(data.toWarehouseId, organizationId);
    if (!toWh) throw new NotFoundError('Destination warehouse not found');

    const product = await inventoryRepo.findProductById(data.productId, organizationId);
    if (!product) throw new NotFoundError('Product not found');

    const sourceStock = await inventoryRepo.findStockItem(data.fromWarehouseId, data.productId, data.variantId || null);
    const available = sourceStock ? sourceStock.quantity - sourceStock.reserved_quantity : 0;

    if (available < data.quantity) {
      throw new BadRequestError(`Insufficient stock. Available: ${available}, Requested: ${data.quantity}`);
    }

    const db = require('../../config/db');
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      // Deduct from source
      await client.query(
        `UPDATE warehouse_stock SET quantity = quantity - $1, updated_at = NOW()
         WHERE id = $2`,
        [data.quantity, sourceStock.id]
      );

      // Add to destination
      const destStock = await inventoryRepo.findStockItem(data.toWarehouseId, data.productId, data.variantId || null);
      if (destStock) {
        await client.query(
          `UPDATE warehouse_stock SET quantity = quantity + $1, updated_at = NOW()
           WHERE id = $2`,
          [data.quantity, destStock.id]
        );
      } else {
        await client.query(
          `INSERT INTO warehouse_stock (warehouse_id, product_id, variant_id, quantity, created_at, updated_at)
           VALUES ($1, $2, $3, $4, NOW(), NOW())`,
          [data.toWarehouseId, data.productId, data.variantId || null, data.quantity]
        );
      }

      // Record movements
      const movementData = {
        organizationId,
        warehouseId: data.fromWarehouseId,
        productId: data.productId,
        variantId: data.variantId || null,
        movementType: 'transfer_out',
        quantity: -data.quantity,
        referenceType: 'transfer',
        notes: `Transfer to warehouse ${toWh.name}`,
        createdBy: userId,
      };

      await client.query(
        `INSERT INTO stock_movements (organization_id, warehouse_id, product_id, variant_id,
                movement_type, quantity, reference_type, notes, created_by, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
        [movementData.organizationId, movementData.warehouseId, movementData.productId,
         movementData.variantId, movementData.movementType, movementData.quantity,
         movementData.referenceType, movementData.notes, movementData.createdBy]
      );

      await client.query(
        `INSERT INTO stock_movements (organization_id, warehouse_id, product_id, variant_id,
                movement_type, quantity, reference_type, notes, created_by, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
        [organizationId, data.toWarehouseId, data.productId, data.variantId || null,
         'transfer_in', data.quantity, 'transfer', `Transfer from warehouse ${fromWh.name}`, userId]
      );

      await client.query('COMMIT');
      logger.info('Stock transferred', { productId: data.productId, from: data.fromWarehouseId, to: data.toWarehouseId, quantity: data.quantity });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    return { success: true };
  }

  async adjustStock(data, userId, organizationId) {
    const product = await inventoryRepo.findProductById(data.productId, organizationId);
    if (!product) throw new NotFoundError('Product not found');

    const warehouse = await inventoryRepo.findWarehouseById(data.warehouseId, organizationId);
    if (!warehouse) throw new NotFoundError('Warehouse not found');

    const currentStock = await inventoryRepo.findStockItem(data.warehouseId, data.productId, data.variantId || null);
    const currentQty = currentStock ? currentStock.quantity : 0;
    const diff = data.newQuantity - currentQty;

    await inventoryRepo.setStockQuantity(data.warehouseId, data.productId, data.variantId || null, data.newQuantity);

    await inventoryRepo.createMovement({
      organizationId,
      warehouseId: data.warehouseId,
      productId: data.productId,
      variantId: data.variantId || null,
      movementType: 'adjustment',
      quantity: diff,
      notes: `Adjustment: ${data.reason}. Before: ${currentQty}, After: ${data.newQuantity}`,
      createdBy: userId,
    });

    logger.info('Stock adjusted', {
      productId: data.productId, warehouseId: data.warehouseId,
      from: currentQty, to: data.newQuantity, reason: data.reason,
    });

    return { success: true };
  }

  // ─── Movements ────────────────────────────────────────────────────

  async listMovements(organizationId, query) {
    const pagination = {
      limit: query.limit || 20,
      offset: query.offset || 0,
      sortBy: query.sortBy || 'created_at',
      sortOrder: query.sortOrder || 'DESC',
    };

    const { data, total } = await inventoryRepo.findMovements(organizationId, {
      ...pagination,
      productId: query.productId,
      warehouseId: query.warehouseId,
      movementType: query.movementType,
      fromDate: query.fromDate,
      toDate: query.toDate,
    });

    return { data, total, ...pagination };
  }
}

module.exports = new InventoryService();
