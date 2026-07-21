const Joi = require('joi');

const createBomSchema = Joi.object({
  productId: Joi.string().uuid().required(),
  name: Joi.string().max(255).required(),
  version: Joi.number().integer().min(1).default(1),
  quantity: Joi.number().positive().default(1),
  isActive: Joi.boolean().default(true),
  notes: Joi.string().allow(null, '').max(1000),
  items: Joi.array().items(Joi.object({
    productId: Joi.string().uuid().required(),
    quantity: Joi.number().positive().required(),
    unitCost: Joi.number().min(0).allow(null),
    sequence: Joi.number().integer().min(0).default(0),
    notes: Joi.string().allow(null, '').max(500),
  })).min(1).required(),
});

const updateBomSchema = Joi.object({
  name: Joi.string().max(255),
  version: Joi.number().integer().min(1),
  quantity: Joi.number().positive(),
  isActive: Joi.boolean(),
  notes: Joi.string().allow(null, '').max(1000),
  items: Joi.array().items(Joi.object({
    id: Joi.string().uuid().allow(null),
    productId: Joi.string().uuid().required(),
    quantity: Joi.number().positive().required(),
    unitCost: Joi.number().min(0).allow(null),
    sequence: Joi.number().integer().min(0).default(0),
    notes: Joi.string().allow(null, '').max(500),
  })).min(1),
}).min(1);

const createWorkCenterSchema = Joi.object({
  name: Joi.string().max(255).required(),
  code: Joi.string().max(100).required(),
  description: Joi.string().allow(null, '').max(1000),
  capacityPerShift: Joi.number().integer().min(1).default(1),
  operatingHours: Joi.object().pattern(Joi.string(), Joi.object({
    start: Joi.string(),
    end: Joi.string(),
  })).default({}),
  isActive: Joi.boolean().default(true),
});

const updateWorkCenterSchema = Joi.object({
  name: Joi.string().max(255),
  code: Joi.string().max(100),
  description: Joi.string().allow(null, '').max(1000),
  capacityPerShift: Joi.number().integer().min(1),
  operatingHours: Joi.object().pattern(Joi.string(), Joi.object({
    start: Joi.string(),
    end: Joi.string(),
  })),
  isActive: Joi.boolean(),
}).min(1);

const createWorkOrderSchema = Joi.object({
  productId: Joi.string().uuid().required(),
  bomId: Joi.string().uuid().allow(null),
  workCenterId: Joi.string().uuid().allow(null),
  quantity: Joi.number().positive().required(),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
  startDate: Joi.date().iso().allow(null),
  dueDate: Joi.date().iso().allow(null),
  notes: Joi.string().allow(null, '').max(2000),
});

const updateWorkOrderStatusSchema = Joi.object({
  status: Joi.string().valid('draft', 'planned', 'in_progress', 'completed', 'cancelled').required(),
});

const consumeSchema = Joi.object({
  productId: Joi.string().uuid().required(),
  quantityActual: Joi.number().positive().required(),
  warehouseStockId: Joi.string().uuid().allow(null),
  notes: Joi.string().allow(null, '').max(500),
});

const outputSchema = Joi.object({
  productId: Joi.string().uuid().required(),
  quantity: Joi.number().positive().required(),
  warehouseStockId: Joi.string().uuid().allow(null),
  batchNumber: Joi.string().allow(null, '').max(100),
  isDefective: Joi.boolean().default(false),
  notes: Joi.string().allow(null, '').max(500),
});

module.exports = {
  createBomSchema, updateBomSchema,
  createWorkCenterSchema, updateWorkCenterSchema,
  createWorkOrderSchema, updateWorkOrderStatusSchema,
  consumeSchema, outputSchema,
};
