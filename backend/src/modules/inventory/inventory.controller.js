const inventoryService = require('./inventory.service');
const { asyncHandler } = require('../../middleware/errorHandler');
const { validate } = require('../../middleware/validate');
const { paginate, buildPaginatedResponse } = require('../../middleware/pagination');
const schemas = require('./inventory.validation');

const createCategoryValidation = validate(schemas.createCategory);
const updateCategoryValidation = validate(schemas.updateCategory);
const createProductValidation = validate(schemas.createProduct);
const updateProductValidation = validate(schemas.updateProduct);
const createVariantValidation = validate(schemas.createVariant);
const updateVariantValidation = validate(schemas.updateVariant);
const createWarehouseValidation = validate(schemas.createWarehouse);
const updateWarehouseValidation = validate(schemas.updateWarehouse);
const transferStockValidation = validate(schemas.transferStock);
const adjustStockValidation = validate(schemas.adjustStock);

// ─── Categories ─────────────────────────────────────────────────────

const listCategories = [
  paginate,
  asyncHandler(async (req, res) => {
    const result = await inventoryService.listCategories(req.user.organizationId, {
      ...req.pagination,
      search: req.query.search,
    });
    res.json(buildPaginatedResponse(result.data, result.total, req.pagination));
  }),
];

const getCategory = asyncHandler(async (req, res) => {
  const category = await inventoryService.getCategory(req.params.id, req.user.organizationId);
  res.json({ success: true, data: category, error: null });
});

const createCategory = [
  createCategoryValidation,
  asyncHandler(async (req, res) => {
    const category = await inventoryService.createCategory(req.body, req.user.organizationId);
    res.status(201).json({ success: true, data: category, error: null });
  }),
];

const updateCategory = [
  updateCategoryValidation,
  asyncHandler(async (req, res) => {
    const category = await inventoryService.updateCategory(req.params.id, req.user.organizationId, req.body);
    res.json({ success: true, data: category, error: null });
  }),
];

const deleteCategory = asyncHandler(async (req, res) => {
  await inventoryService.deleteCategory(req.params.id, req.user.organizationId);
  res.json({ success: true, data: null, error: null });
});

// ─── Products ───────────────────────────────────────────────────────

const listProducts = [
  paginate,
  asyncHandler(async (req, res) => {
    const result = await inventoryService.listProducts(req.user.organizationId, {
      ...req.pagination,
      search: req.query.search,
      categoryId: req.query.categoryId,
      isActive: req.query.isActive,
    });
    res.json(buildPaginatedResponse(result.data, result.total, req.pagination));
  }),
];

const getProduct = asyncHandler(async (req, res) => {
  const product = await inventoryService.getProduct(req.params.id, req.user.organizationId);
  res.json({ success: true, data: product, error: null });
});

const createProduct = [
  createProductValidation,
  asyncHandler(async (req, res) => {
    const product = await inventoryService.createProduct(req.body, req.user.organizationId);
    res.status(201).json({ success: true, data: product, error: null });
  }),
];

const updateProduct = [
  updateProductValidation,
  asyncHandler(async (req, res) => {
    const product = await inventoryService.updateProduct(req.params.id, req.user.organizationId, req.body);
    res.json({ success: true, data: product, error: null });
  }),
];

const deleteProduct = asyncHandler(async (req, res) => {
  await inventoryService.deleteProduct(req.params.id, req.user.organizationId);
  res.json({ success: true, data: null, error: null });
});

// ─── Variants ───────────────────────────────────────────────────────

const listVariants = asyncHandler(async (req, res) => {
  const variants = await inventoryService.listVariants(req.params.productId, req.user.organizationId);
  res.json({ success: true, data: variants, error: null });
});

const createVariant = [
  createVariantValidation,
  asyncHandler(async (req, res) => {
    const variant = await inventoryService.createVariant(req.params.productId, req.user.organizationId, req.body);
    res.status(201).json({ success: true, data: variant, error: null });
  }),
];

const updateVariant = [
  updateVariantValidation,
  asyncHandler(async (req, res) => {
    const variant = await inventoryService.updateVariant(req.params.productId, req.params.variantId, req.user.organizationId, req.body);
    res.json({ success: true, data: variant, error: null });
  }),
];

const deleteVariant = asyncHandler(async (req, res) => {
  await inventoryService.deleteVariant(req.params.productId, req.params.variantId, req.user.organizationId);
  res.json({ success: true, data: null, error: null });
});

// ─── Warehouses ─────────────────────────────────────────────────────

const listWarehouses = [
  paginate,
  asyncHandler(async (req, res) => {
    const result = await inventoryService.listWarehouses(req.user.organizationId, {
      ...req.pagination,
      search: req.query.search,
    });
    res.json(buildPaginatedResponse(result.data, result.total, req.pagination));
  }),
];

const getWarehouse = asyncHandler(async (req, res) => {
  const warehouse = await inventoryService.getWarehouse(req.params.id, req.user.organizationId);
  res.json({ success: true, data: warehouse, error: null });
});

const createWarehouse = [
  createWarehouseValidation,
  asyncHandler(async (req, res) => {
    const warehouse = await inventoryService.createWarehouse(req.body, req.user.organizationId);
    res.status(201).json({ success: true, data: warehouse, error: null });
  }),
];

const updateWarehouse = [
  updateWarehouseValidation,
  asyncHandler(async (req, res) => {
    const warehouse = await inventoryService.updateWarehouse(req.params.id, req.user.organizationId, req.body);
    res.json({ success: true, data: warehouse, error: null });
  }),
];

const deleteWarehouse = asyncHandler(async (req, res) => {
  await inventoryService.deleteWarehouse(req.params.id, req.user.organizationId);
  res.json({ success: true, data: null, error: null });
});

// ─── Stock ──────────────────────────────────────────────────────────

const getStock = asyncHandler(async (req, res) => {
  const stock = await inventoryService.getStock(req.user.organizationId, {
    warehouseId: req.query.warehouseId,
    productId: req.query.productId,
    lowStock: req.query.lowStock === 'true',
  });
  res.json({ success: true, data: stock, error: null });
});

const transferStock = [
  transferStockValidation,
  asyncHandler(async (req, res) => {
    const result = await inventoryService.transferStock(req.body, req.user.id, req.user.organizationId);
    res.json({ success: true, data: result, error: null });
  }),
];

const adjustStock = [
  adjustStockValidation,
  asyncHandler(async (req, res) => {
    const result = await inventoryService.adjustStock(req.body, req.user.id, req.user.organizationId);
    res.json({ success: true, data: result, error: null });
  }),
];

// ─── Stock Movements ────────────────────────────────────────────────

const listMovements = [
  paginate,
  asyncHandler(async (req, res) => {
    const result = await inventoryService.listMovements(req.user.organizationId, {
      ...req.pagination,
      productId: req.query.productId,
      warehouseId: req.query.warehouseId,
      movementType: req.query.movementType,
      fromDate: req.query.fromDate,
      toDate: req.query.toDate,
    });
    res.json(buildPaginatedResponse(result.data, result.total, req.pagination));
  }),
];

module.exports = {
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
};
