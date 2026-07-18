const Joi = require('joi');
const { commonSchemas } = require('../../middleware/validate');

const schemas = {
  createCustomer: Joi.object({
    code: Joi.string().min(1).max(50).required(),
    name: commonSchemas.name.required(),
    email: Joi.string().email().max(255).optional().allow(null, ''),
    phone: Joi.string().max(50).optional().allow(null, ''),
    companyName: Joi.string().max(255).optional().allow(null, ''),
    taxId: Joi.string().max(100).optional().allow(null, ''),
    website: Joi.string().uri().max(500).optional().allow(null, ''),
    notes: Joi.string().max(5000).optional().allow(null, ''),
    status: Joi.string().valid('active', 'inactive', 'blocked').optional().default('active'),
    attributes: Joi.object().optional().default({}),
  }),

  updateCustomer: Joi.object({
    code: Joi.string().min(1).max(50).optional(),
    name: commonSchemas.name.optional(),
    email: Joi.string().email().max(255).optional().allow(null, ''),
    phone: Joi.string().max(50).optional().allow(null, ''),
    companyName: Joi.string().max(255).optional().allow(null, ''),
    taxId: Joi.string().max(100).optional().allow(null, ''),
    website: Joi.string().uri().max(500).optional().allow(null, ''),
    notes: Joi.string().max(5000).optional().allow(null, ''),
    status: Joi.string().valid('active', 'inactive', 'blocked').optional(),
    attributes: Joi.object().optional(),
  }).min(1),

  createAddress: Joi.object({
    type: Joi.string().valid('shipping', 'billing', 'both').optional().default('shipping'),
    addressLine1: Joi.string().max(255).optional().allow(null, ''),
    addressLine2: Joi.string().max(255).optional().allow(null, ''),
    city: Joi.string().max(100).optional().allow(null, ''),
    state: Joi.string().max(100).optional().allow(null, ''),
    postalCode: Joi.string().max(20).optional().allow(null, ''),
    country: Joi.string().max(100).optional().default('US'),
    isDefault: Joi.boolean().optional().default(false),
  }),

  updateAddress: Joi.object({
    type: Joi.string().valid('shipping', 'billing', 'both').optional(),
    addressLine1: Joi.string().max(255).optional().allow(null, ''),
    addressLine2: Joi.string().max(255).optional().allow(null, ''),
    city: Joi.string().max(100).optional().allow(null, ''),
    state: Joi.string().max(100).optional().allow(null, ''),
    postalCode: Joi.string().max(20).optional().allow(null, ''),
    country: Joi.string().max(100).optional(),
    isDefault: Joi.boolean().optional(),
  }).min(1),

  createContact: Joi.object({
    firstName: Joi.string().max(255).optional().allow(null, ''),
    lastName: Joi.string().max(255).optional().allow(null, ''),
    email: Joi.string().email().max(255).optional().allow(null, ''),
    phone: Joi.string().max(50).optional().allow(null, ''),
    position: Joi.string().max(255).optional().allow(null, ''),
    isPrimary: Joi.boolean().optional().default(false),
  }),

  updateContact: Joi.object({
    firstName: Joi.string().max(255).optional().allow(null, ''),
    lastName: Joi.string().max(255).optional().allow(null, ''),
    email: Joi.string().email().max(255).optional().allow(null, ''),
    phone: Joi.string().max(50).optional().allow(null, ''),
    position: Joi.string().max(255).optional().allow(null, ''),
    isPrimary: Joi.boolean().optional(),
  }).min(1),

  createNote: Joi.object({
    content: Joi.string().min(1).max(5000).required(),
  }),
};

module.exports = schemas;
