const Joi = require('joi');

const createChecklistSchema = Joi.object({
  name: Joi.string().max(255).required(),
  description: Joi.string().allow(null, '').max(2000),
  isActive: Joi.boolean().default(true),
  items: Joi.array().items(Joi.object({
    sequence: Joi.number().integer().min(0).default(0),
    description: Joi.string().required().max(1000),
    expectedValue: Joi.string().allow(null, '').max(500),
    minValue: Joi.number().allow(null),
    maxValue: Joi.number().allow(null),
    unit: Joi.string().allow(null, '').max(50),
    isCritical: Joi.boolean().default(false),
    inspectionMethod: Joi.string().allow(null, '').max(100),
  })).min(1).required(),
});

const updateChecklistSchema = Joi.object({
  name: Joi.string().max(255),
  description: Joi.string().allow(null, '').max(2000),
  isActive: Joi.boolean(),
  items: Joi.array().items(Joi.object({
    id: Joi.string().uuid().allow(null),
    sequence: Joi.number().integer().min(0).default(0),
    description: Joi.string().required().max(1000),
    expectedValue: Joi.string().allow(null, '').max(500),
    minValue: Joi.number().allow(null),
    maxValue: Joi.number().allow(null),
    unit: Joi.string().allow(null, '').max(50),
    isCritical: Joi.boolean().default(false),
    inspectionMethod: Joi.string().allow(null, '').max(100),
  })).min(1),
}).min(1);

const createInspectionSchema = Joi.object({
  checklistId: Joi.string().uuid().allow(null),
  referenceType: Joi.string().valid('purchase_order_item', 'work_order_output', 'sales_order_item').required(),
  referenceId: Joi.string().uuid().required(),
  notes: Joi.string().allow(null, '').max(2000),
});

const recordResultSchema = Joi.object({
  results: Joi.array().items(Joi.object({
    checklistItemId: Joi.string().uuid().allow(null),
    itemDescription: Joi.string().required().max(1000),
    actualValue: Joi.string().allow(null, '').max(500),
    actualNumeric: Joi.number().allow(null),
    isPass: Joi.boolean().required(),
    notes: Joi.string().allow(null, '').max(500),
  })).min(1).required(),
  status: Joi.string().valid('passed', 'failed', 'blocked').required(),
  resultSummary: Joi.string().valid('pass', 'fail', 'conditional_pass').required(),
  notes: Joi.string().allow(null, '').max(2000),
});

const createCriterionSchema = Joi.object({
  productId: Joi.string().uuid().allow(null),
  name: Joi.string().max(255).required(),
  description: Joi.string().allow(null, '').max(2000),
  minValue: Joi.number().allow(null),
  maxValue: Joi.number().allow(null),
  unit: Joi.string().allow(null, '').max(50),
  isCritical: Joi.boolean().default(false),
  isActive: Joi.boolean().default(true),
});

const updateCriterionSchema = Joi.object({
  name: Joi.string().max(255),
  description: Joi.string().allow(null, '').max(2000),
  minValue: Joi.number().allow(null),
  maxValue: Joi.number().allow(null),
  unit: Joi.string().allow(null, '').max(50),
  isCritical: Joi.boolean(),
  isActive: Joi.boolean(),
}).min(1);

module.exports = {
  createChecklistSchema, updateChecklistSchema,
  createInspectionSchema, recordResultSchema,
  createCriterionSchema, updateCriterionSchema,
};
