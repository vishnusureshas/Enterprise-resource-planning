const Joi = require('joi');

const schemas = {
  auditLogQuery: Joi.object({
    action: Joi.string().max(50).optional(),
    auditableType: Joi.string().max(100).optional(),
    userId: Joi.string().uuid({ version: 'uuidv4' }).optional(),
    from: Joi.date().iso().optional(),
    to: Joi.date().iso().min(Joi.ref('from')).optional(),
    search: Joi.string().max(255).optional(),
    limit: Joi.number().integer().min(1).max(100).optional().default(20),
    offset: Joi.number().integer().min(0).optional().default(0),
    sortBy: Joi.string().valid('created_at', 'action', 'entity_type').optional().default('created_at'),
    sortOrder: Joi.string().valid('ASC', 'DESC').optional().default('DESC'),
  }),
};

module.exports = schemas;
