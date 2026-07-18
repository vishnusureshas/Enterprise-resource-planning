const Joi = require('joi');
const { commonSchemas } = require('../../middleware/validate');

const schemas = {
  create: Joi.object({
    email: commonSchemas.email.required(),
    password: commonSchemas.password.required(),
    firstName: commonSchemas.name.required(),
    lastName: commonSchemas.name.required(),
    phone: commonSchemas.phone.optional(),
    roleIds: Joi.array().items(Joi.string().uuid()).min(1).optional(),
  }),

  update: Joi.object({
    firstName: commonSchemas.name.optional(),
    lastName: commonSchemas.name.optional(),
    phone: commonSchemas.phone.optional().allow(null),
    avatarUrl: Joi.string().uri().max(500).optional().allow(null),
    status: Joi.string().valid('active', 'inactive', 'suspended').optional(),
    roleIds: Joi.array().items(Joi.string().uuid()).min(1).optional(),
  }).min(1),

  list: Joi.object({
    page: commonSchemas.pagination.page,
    limit: commonSchemas.pagination.limit,
    sort: commonSchemas.pagination.sort,
    search: commonSchemas.pagination.search,
    status: Joi.string().valid('active', 'inactive', 'pending', 'suspended').optional(),
    role: Joi.string().uuid().optional(),
  }),
};

module.exports = schemas;
