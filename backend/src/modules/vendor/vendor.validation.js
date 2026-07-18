const Joi = require('joi');

const schemas = {
  createVendor: Joi.object({
    code: Joi.string().min(1).max(50).required(),
    name: Joi.string().min(1).max(500).required(),
    email: Joi.string().email().max(255).optional().allow(null, ''),
    phone: Joi.string().max(50).optional().allow(null, ''),
    companyName: Joi.string().max(255).optional().allow(null, ''),
    taxId: Joi.string().max(100).optional().allow(null, ''),
    website: Joi.string().uri().max(500).optional().allow(null, ''),
    paymentTerms: Joi.string().max(100).optional().allow(null, ''),
    creditLimit: Joi.number().min(0).precision(2).optional().allow(null),
    notes: Joi.string().max(5000).optional().allow(null, ''),
    status: Joi.string().valid('active', 'inactive', 'blocked').optional().default('active'),
    attributes: Joi.object().optional().default({}),
  }),

  updateVendor: Joi.object({
    code: Joi.string().min(1).max(50).optional(),
    name: Joi.string().min(1).max(500).optional(),
    email: Joi.string().email().max(255).optional().allow(null, ''),
    phone: Joi.string().max(50).optional().allow(null, ''),
    companyName: Joi.string().max(255).optional().allow(null, ''),
    taxId: Joi.string().max(100).optional().allow(null, ''),
    website: Joi.string().uri().max(500).optional().allow(null, ''),
    paymentTerms: Joi.string().max(100).optional().allow(null, ''),
    creditLimit: Joi.number().min(0).precision(2).optional().allow(null),
    notes: Joi.string().max(5000).optional().allow(null, ''),
    status: Joi.string().valid('active', 'inactive', 'blocked').optional(),
    attributes: Joi.object().optional(),
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

  createContract: Joi.object({
    title: Joi.string().max(255).required(),
    contractNumber: Joi.string().max(100).optional().allow(null, ''),
    startDate: Joi.date().optional().allow(null),
    endDate: Joi.date().min(Joi.ref('startDate')).optional().allow(null),
    value: Joi.number().min(0).precision(2).optional().allow(null),
    terms: Joi.string().max(10000).optional().allow(null, ''),
    status: Joi.string().valid('active', 'inactive', 'expired', 'terminated').optional().default('active'),
    fileUrl: Joi.string().uri().max(500).optional().allow(null, ''),
  }),

  updateContract: Joi.object({
    title: Joi.string().max(255).optional(),
    contractNumber: Joi.string().max(100).optional().allow(null, ''),
    startDate: Joi.date().optional().allow(null),
    endDate: Joi.date().min(Joi.ref('startDate')).optional().allow(null),
    value: Joi.number().min(0).precision(2).optional().allow(null),
    terms: Joi.string().max(10000).optional().allow(null, ''),
    status: Joi.string().valid('active', 'inactive', 'expired', 'terminated').optional(),
    fileUrl: Joi.string().uri().max(500).optional().allow(null, ''),
  }).min(1),
};

module.exports = schemas;
