const Joi = require('joi');
const { commonSchemas } = require('../../middleware/validate');

const schemas = {
  createCategory: Joi.object({
    parentId: commonSchemas.uuid.optional().allow(null),
    name: commonSchemas.name.required(),
    slug: Joi.string().min(1).max(255).pattern(/^[a-z0-9-]+$/).required(),
    description: Joi.string().max(2000).optional().allow(null, ''),
    isActive: Joi.boolean().optional(),
    sortOrder: Joi.number().integer().min(0).optional(),
  }),

  updateCategory: Joi.object({
    parentId: commonSchemas.uuid.optional().allow(null),
    name: commonSchemas.name.optional(),
    slug: Joi.string().min(1).max(255).pattern(/^[a-z0-9-]+$/).optional(),
    description: Joi.string().max(2000).optional().allow(null, ''),
    isActive: Joi.boolean().optional(),
    sortOrder: Joi.number().integer().min(0).optional(),
  }).min(1),

  createProduct: Joi.object({
    categoryId: commonSchemas.uuid.optional().allow(null),
    sku: Joi.string().min(1).max(100).required(),
    name: commonSchemas.name.required(),
    description: Joi.string().max(5000).optional().allow(null, ''),
    unitOfMeasure: Joi.string().max(50).optional().default('pcs'),
    unitPrice: Joi.number().min(0).precision(2).optional().default(0),
    costPrice: Joi.number().min(0).precision(2).optional().default(0),
    reorderPoint: Joi.number().min(0).precision(4).optional().default(0),
    reorderQuantity: Joi.number().min(0).precision(4).optional().default(0),
    weight: Joi.number().min(0).precision(4).optional().allow(null),
    weightUnit: Joi.string().max(10).optional().default('kg'),
    isActive: Joi.boolean().optional().default(true),
    isSerialized: Joi.boolean().optional().default(false),
    isBatched: Joi.boolean().optional().default(false),
    trackInventory: Joi.boolean().optional().default(true),
    attributes: Joi.object().optional().default({}),
    imageUrl: Joi.string().uri().max(500).optional().allow(null, ''),
  }),

  updateProduct: Joi.object({
    categoryId: commonSchemas.uuid.optional().allow(null),
    sku: Joi.string().min(1).max(100).optional(),
    name: commonSchemas.name.optional(),
    description: Joi.string().max(5000).optional().allow(null, ''),
    unitOfMeasure: Joi.string().max(50).optional(),
    unitPrice: Joi.number().min(0).precision(2).optional(),
    costPrice: Joi.number().min(0).precision(2).optional(),
    reorderPoint: Joi.number().min(0).precision(4).optional(),
    reorderQuantity: Joi.number().min(0).precision(4).optional(),
    weight: Joi.number().min(0).precision(4).optional().allow(null),
    weightUnit: Joi.string().max(10).optional(),
    isActive: Joi.boolean().optional(),
    isSerialized: Joi.boolean().optional(),
    isBatched: Joi.boolean().optional(),
    trackInventory: Joi.boolean().optional(),
    attributes: Joi.object().optional(),
    imageUrl: Joi.string().uri().max(500).optional().allow(null, ''),
  }).min(1),

  createVariant: Joi.object({
    sku: Joi.string().min(1).max(100).required(),
    name: commonSchemas.name.required(),
    options: Joi.object().required(),
    unitPrice: Joi.number().min(0).precision(2).optional().allow(null),
    costPrice: Joi.number().min(0).precision(2).optional().allow(null),
    weight: Joi.number().min(0).precision(4).optional().allow(null),
    isActive: Joi.boolean().optional().default(true),
  }),

  updateVariant: Joi.object({
    sku: Joi.string().min(1).max(100).optional(),
    name: commonSchemas.name.optional(),
    options: Joi.object().optional(),
    unitPrice: Joi.number().min(0).precision(2).optional().allow(null),
    costPrice: Joi.number().min(0).precision(2).optional().allow(null),
    weight: Joi.number().min(0).precision(4).optional().allow(null),
    isActive: Joi.boolean().optional(),
  }).min(1),

  createWarehouse: Joi.object({
    code: Joi.string().min(1).max(50).required(),
    name: commonSchemas.name.required(),
    description: Joi.string().max(2000).optional().allow(null, ''),
    addressLine1: Joi.string().max(255).optional().allow(null, ''),
    addressLine2: Joi.string().max(255).optional().allow(null, ''),
    city: Joi.string().max(100).optional().allow(null, ''),
    state: Joi.string().max(100).optional().allow(null, ''),
    postalCode: Joi.string().max(20).optional().allow(null, ''),
    country: Joi.string().max(100).optional().default('US'),
    isActive: Joi.boolean().optional().default(true),
    isDefault: Joi.boolean().optional().default(false),
  }),

  updateWarehouse: Joi.object({
    code: Joi.string().min(1).max(50).optional(),
    name: commonSchemas.name.optional(),
    description: Joi.string().max(2000).optional().allow(null, ''),
    addressLine1: Joi.string().max(255).optional().allow(null, ''),
    addressLine2: Joi.string().max(255).optional().allow(null, ''),
    city: Joi.string().max(100).optional().allow(null, ''),
    state: Joi.string().max(100).optional().allow(null, ''),
    postalCode: Joi.string().max(20).optional().allow(null, ''),
    country: Joi.string().max(100).optional(),
    isActive: Joi.boolean().optional(),
    isDefault: Joi.boolean().optional(),
  }).min(1),

  transferStock: Joi.object({
    fromWarehouseId: commonSchemas.uuid.required(),
    toWarehouseId: commonSchemas.uuid.required(),
    productId: commonSchemas.uuid.required(),
    variantId: commonSchemas.uuid.optional().allow(null),
    quantity: Joi.number().positive().precision(4).required(),
    notes: Joi.string().max(1000).optional().allow(null, ''),
  }),

  adjustStock: Joi.object({
    warehouseId: commonSchemas.uuid.required(),
    productId: commonSchemas.uuid.required(),
    variantId: commonSchemas.uuid.optional().allow(null),
    newQuantity: Joi.number().min(0).precision(4).required(),
    reason: Joi.string().max(500).required(),
  }),

  stockFilter: Joi.object({
    warehouseId: commonSchemas.uuid.optional(),
    productId: commonSchemas.uuid.optional(),
    lowStock: Joi.boolean().optional(),
  }),
};

module.exports = schemas;
