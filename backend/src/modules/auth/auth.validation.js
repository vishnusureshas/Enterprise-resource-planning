const Joi = require('joi');
const { commonSchemas } = require('../../middleware/validate');

// Validation schemas
const schemas = {
  register: Joi.object({
    email: commonSchemas.email.required(),
    password: commonSchemas.password.required(),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
      'any.only': 'Passwords do not match',
    }),
    firstName: commonSchemas.name.required(),
    lastName: commonSchemas.name.required(),
    organizationName: Joi.string().min(1).max(255).required(),
  }),

  login: Joi.object({
    email: commonSchemas.email.required(),
    password: Joi.string().required(),
    rememberMe: Joi.boolean().default(false),
  }),

  refresh: Joi.object({
    refreshToken: Joi.string().required(),
  }),

  forgotPassword: Joi.object({
    email: commonSchemas.email.required(),
  }),

  resetPassword: Joi.object({
    token: Joi.string().uuid().required(),
    password: commonSchemas.password.required(),
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: commonSchemas.password.required(),
  }),

  updateProfile: Joi.object({
    firstName: commonSchemas.name,
    lastName: commonSchemas.name,
    phone: commonSchemas.phone,
    avatarUrl: Joi.string().uri().max(500),
  }),

  mfaSetup: Joi.object({
    enabled: Joi.boolean().required(),
  }),

  mfaVerify: Joi.object({
    token: Joi.string().length(6).pattern(/^\d+$/).required(),
  }),

  logout: Joi.object({
    revokeAll: Joi.boolean().optional(),
  }),
};

module.exports = schemas;