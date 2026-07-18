const Joi = require('joi');
const { commonSchemas } = require('../../middleware/validate');

const schemas = {
  create: Joi.object({
    name: commonSchemas.name.required(),
    description: Joi.string().max(500).optional().allow(''),
    permissionIds: Joi.array().items(Joi.string().uuid()).optional(),
  }),

  update: Joi.object({
    name: commonSchemas.name.optional(),
    description: Joi.string().max(500).optional().allow(''),
    permissionIds: Joi.array().items(Joi.string().uuid()).optional(),
  }).min(1),

  assignUsers: Joi.object({
    userIds: Joi.array().items(Joi.string().uuid()).min(1).required(),
  }),
};

module.exports = schemas;
