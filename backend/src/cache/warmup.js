const { redis } = require('../config/redis');
const db = require('../config/db');
const logger = require('../config/logger');
const { keys } = require('./cacheKeys');

async function warmCategoryCache(organizationId) {
  try {
    const result = await db.query(
      `SELECT * FROM inventory_categories WHERE organization_id = $1 AND deleted_at IS NULL`,
      [organizationId]
    );

    const pipeline = redis.pipeline();
    for (const category of result.rows) {
      const cacheKey = keys.inventory.category(category.organization_id, category.slug);
      pipeline.setex(cacheKey, 600, JSON.stringify(category));
    }
    await pipeline.exec();
    logger.info({ orgId: organizationId, count: result.rows.length }, 'Warmed category cache');
  } catch (err) {
    logger.warn({ err: err.message, orgId: organizationId }, 'Failed to warm category cache');
  }
}

async function warmProductCache(organizationId) {
  try {
    const result = await db.query(
      `SELECT p.* FROM products p WHERE p.organization_id = $1 AND p.deleted_at IS NULL`,
      [organizationId]
    );

    const pipeline = redis.pipeline();
    for (const product of result.rows) {
      const cacheKey = keys.inventory.item(product.organization_id, product.id);
      pipeline.setex(cacheKey, 300, JSON.stringify(product));
    }
    await pipeline.exec();
    logger.info({ orgId: organizationId, count: result.rows.length }, 'Warmed product cache');
  } catch (err) {
    logger.warn({ err: err.message, orgId: organizationId }, 'Failed to warm product cache');
  }
}

async function warmWarehouseCache(organizationId) {
  try {
    const result = await db.query(
      `SELECT * FROM warehouses WHERE organization_id = $1 AND deleted_at IS NULL`,
      [organizationId]
    );

    const pipeline = redis.pipeline();
    for (const warehouse of result.rows) {
      const cacheKey = keys.warehouse.item(warehouse.organization_id, warehouse.id);
      pipeline.setex(cacheKey, 600, JSON.stringify(warehouse));
    }
    await pipeline.exec();
    logger.info({ orgId: organizationId, count: result.rows.length }, 'Warmed warehouse cache');
  } catch (err) {
    logger.warn({ err: err.message, orgId: organizationId }, 'Failed to warm warehouse cache');
  }
}

async function warmAll(organizationId) {
  logger.info({ orgId: organizationId }, 'Starting cache warmup');
  await Promise.allSettled([
    warmCategoryCache(organizationId),
    warmProductCache(organizationId),
    warmWarehouseCache(organizationId),
  ]);
  logger.info({ orgId: organizationId }, 'Cache warmup complete');
}

module.exports = { warmCategoryCache, warmProductCache, warmWarehouseCache, warmAll };
