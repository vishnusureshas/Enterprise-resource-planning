const Joi = require('joi');
const { commonSchemas } = require('../../middleware/validate');

const orderItemSchema = Joi.object({
  productId: commonSchemas.uuid.required(),
  variantId: commonSchemas.uuid.optional().allow(null),
  quantity: Joi.number().positive().precision(4).required(),
  unitPrice: Joi.number().min(0).precision(2).required(),
  discountPercent: Joi.number().min(0).max(100).precision(2).optional().default(0),
  taxPercent: Joi.number().min(0).max(100).precision(2).optional().default(0),
});

const schemas = {
  createOrder: Joi.object({
    customerId: commonSchemas.uuid.required(),
    orderDate: Joi.date().optional().default(() => new Date()),
    currencyCode: Joi.string().length(3).optional().default('USD'),
    exchangeRate: Joi.number().positive().precision(6).optional().default(1),
    shippingTotal: Joi.number().min(0).precision(2).optional().default(0),
    notes: Joi.string().max(5000).optional().allow(null, ''),
    shippingAddressId: commonSchemas.uuid.optional().allow(null),
    billingAddressId: commonSchemas.uuid.optional().allow(null),
    items: Joi.array().items(orderItemSchema).min(1).required(),
  }),

  updateOrderStatus: Joi.object({
    status: Joi.string().valid(
      'draft', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'
    ).required(),
  }),

  recordPayment: Joi.object({
    amount: Joi.number().positive().precision(2).required(),
    paymentMethod: Joi.string().max(50).optional().allow(null, ''),
    referenceNumber: Joi.string().max(255).optional().allow(null, ''),
    notes: Joi.string().max(1000).optional().allow(null, ''),
  }),

  updateOrder: Joi.object({
    customerId: commonSchemas.uuid.optional(),
    orderDate: Joi.date().optional(),
    currencyCode: Joi.string().length(3).optional(),
    exchangeRate: Joi.number().positive().precision(6).optional(),
    shippingTotal: Joi.number().min(0).precision(2).optional(),
    notes: Joi.string().max(5000).optional().allow(null, ''),
    shippingAddressId: commonSchemas.uuid.optional().allow(null),
    billingAddressId: commonSchemas.uuid.optional().allow(null),
  }).min(1),

  cancelOrder: Joi.object({
    reason: Joi.string().max(1000).optional().allow(null, ''),
  }),

  bulkCreateOrders: Joi.object({
    orders: Joi.array().items(
      Joi.object({
        customerId: commonSchemas.uuid.required(),
        orderDate: Joi.date().optional().default(() => new Date()),
        currencyCode: Joi.string().length(3).optional().default('USD'),
        notes: Joi.string().max(5000).optional().allow(null, ''),
        items: Joi.array().items(orderItemSchema).min(1).required(),
      })
    ).min(1).max(100).required(),
  }),
};

module.exports = schemas;
