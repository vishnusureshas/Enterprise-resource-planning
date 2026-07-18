const Joi = require('joi');

const emailConfigSchema = Joi.object({
  host: Joi.string().max(255).optional(),
  port: Joi.number().integer().min(1).max(65535).optional(),
  secure: Joi.boolean().optional(),
  user: Joi.string().max(255).optional(),
  pass: Joi.string().max(255).optional(),
  fromName: Joi.string().max(255).optional(),
  fromEmail: Joi.string().email().optional(),
});

const securitySchema = Joi.object({
  passwordMinLength: Joi.number().integer().min(6).max(128).optional(),
  passwordRequireSpecial: Joi.boolean().optional(),
  passwordRequireNumber: Joi.boolean().optional(),
  passwordRequireUpper: Joi.boolean().optional(),
  sessionTimeoutMinutes: Joi.number().integer().min(5).max(1440).optional(),
  mfaRequired: Joi.boolean().optional(),
  maxLoginAttempts: Joi.number().integer().min(1).max(20).optional(),
  ipWhitelist: Joi.array().items(Joi.string()).optional(),
});

const notificationSchema = Joi.object({
  emailNotifications: Joi.boolean().optional(),
  inAppNotifications: Joi.boolean().optional(),
  weeklyDigest: Joi.boolean().optional(),
  orderConfirmation: Joi.boolean().optional(),
  passwordChangeAlert: Joi.boolean().optional(),
  loginAlert: Joi.boolean().optional(),
});

const localizationSchema = Joi.object({
  defaultLanguage: Joi.string().valid('en', 'es', 'fr', 'de', 'pt', 'zh', 'ja', 'ar').optional(),
  dateFormat: Joi.string().valid('YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY').optional(),
  timezone: Joi.string().max(50).optional(),
  currency: Joi.string().length(3).uppercase().optional(),
  weekStartsOn: Joi.number().integer().min(0).max(6).optional(),
  numberFormat: Joi.object({
    decimalSeparator: Joi.string().valid('.', ',').optional(),
    thousandsSeparator: Joi.string().valid(',', '.', ' ', '').optional(),
    decimalPlaces: Joi.number().integer().min(0).max(10).optional(),
  }).optional(),
});

const schemas = {
  update: Joi.object({
    name: Joi.string().min(1).max(255).trim().optional(),
    slug: Joi.string().min(1).max(255).pattern(/^[a-z0-9-]+$/).optional(),
    logoUrl: Joi.string().uri().max(500).optional().allow(null),
    website: Joi.string().uri().max(500).optional().allow(null),
    phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional().allow(null),
    address: Joi.string().max(500).optional().allow(null),
  }).min(1),

  updateSettings: Joi.object({
    email: emailConfigSchema.optional(),
    security: securitySchema.optional(),
    notifications: notificationSchema.optional(),
    localization: localizationSchema.optional(),
  }).min(1),
};

module.exports = schemas;
