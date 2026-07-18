const express = require('express');
const router = express.Router();

const {
  listCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  listVariants,
  createVariant,
  updateVariant,
  deleteVariant,
  listWarehouses,
  getWarehouse,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
  getStock,
  transferStock,
  adjustStock,
  listMovements,
} = require('./inventory.controller');

const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/authorize');
const { auditLog } = require('../../middleware/auditLog');

router.use(authenticate);

// Categories
router.get('/categories', authorize('inventory:read'), listCategories);
router.get('/categories/:id', authorize('inventory:read'), getCategory);
router.post('/categories', authorize('inventory:create'), auditLog('inventory.category.create', { auditableType: 'inventory_category' }), createCategory);
router.patch('/categories/:id', authorize('inventory:update'), auditLog('inventory.category.update', { auditableType: 'inventory_category', auditableId: (req) => req.params.id }), updateCategory);
router.delete('/categories/:id', authorize('inventory:delete'), auditLog('inventory.category.delete', { auditableType: 'inventory_category', auditableId: (req) => req.params.id }), deleteCategory);

// Products
router.get('/products', authorize('inventory:read'), listProducts);
router.get('/products/:id', authorize('inventory:read'), getProduct);
router.post('/products', authorize('inventory:create'), auditLog('inventory.product.create', { auditableType: 'product' }), createProduct);
router.patch('/products/:id', authorize('inventory:update'), auditLog('inventory.product.update', { auditableType: 'product', auditableId: (req) => req.params.id }), updateProduct);
router.delete('/products/:id', authorize('inventory:delete'), auditLog('inventory.product.delete', { auditableType: 'product', auditableId: (req) => req.params.id }), deleteProduct);

// Variants (nested under products)
router.get('/products/:productId/variants', authorize('inventory:read'), listVariants);
router.post('/products/:productId/variants', authorize('inventory:create'), auditLog('inventory.variant.create', { auditableType: 'product_variant' }), createVariant);
router.patch('/products/:productId/variants/:variantId', authorize('inventory:update'), auditLog('inventory.variant.update', { auditableType: 'product_variant', auditableId: (req) => req.params.variantId }), updateVariant);
router.delete('/products/:productId/variants/:variantId', authorize('inventory:delete'), auditLog('inventory.variant.delete', { auditableType: 'product_variant', auditableId: (req) => req.params.variantId }), deleteVariant);

// Warehouses
router.get('/warehouses', authorize('warehouse:read'), listWarehouses);
router.get('/warehouses/:id', authorize('warehouse:read'), getWarehouse);
router.post('/warehouses', authorize('warehouse:create'), auditLog('inventory.warehouse.create', { auditableType: 'warehouse' }), createWarehouse);
router.patch('/warehouses/:id', authorize('warehouse:update'), auditLog('inventory.warehouse.update', { auditableType: 'warehouse', auditableId: (req) => req.params.id }), updateWarehouse);
router.delete('/warehouses/:id', authorize('warehouse:delete'), auditLog('inventory.warehouse.delete', { auditableType: 'warehouse', auditableId: (req) => req.params.id }), deleteWarehouse);

// Stock
router.get('/stock', authorize('inventory:read'), getStock);
router.post('/stock/transfer', authorize('inventory:transfer'), auditLog('inventory.stock.transfer', { auditableType: 'stock_movement' }), transferStock);
router.post('/stock/adjust', authorize('inventory:adjust'), auditLog('inventory.stock.adjust', { auditableType: 'stock_movement' }), adjustStock);

// Stock Movements
router.get('/movements', authorize('inventory:read'), listMovements);

module.exports = router;
