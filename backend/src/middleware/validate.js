const Joi = require('joi');

const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const data = req[source];
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const details = error.details.map((d) => ({
        field: d.path.join('.'),
        message: d.message.replace(/"/g, ''),
      }));

      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details,
        },
      });
    }

    req[source] = value;
    next();
  };
};

const commonSchemas = {
  uuid: Joi.string().uuid({ version: 'uuidv4' }),
  email: Joi.string().email({ tlds: { allow: false } }).lowercase().trim(),
  password: Joi.string().min(8).max(128).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
  name: Joi.string().min(1).max(255).trim(),
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/),
  pagination: {
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sort: Joi.string().pattern(/^[a-zA-Z_]+:(asc|desc)$/).optional(),
    search: Joi.string().max(255).optional(),
  },
  dateRange: {
    from: Joi.date().iso().optional(),
    to: Joi.date().iso().min(Joi.ref('from')).optional(),
  },
};

module.exports = { validate, commonSchemas, Joi };