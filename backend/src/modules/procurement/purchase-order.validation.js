const Joi = require('joi');

const poItemSchema = Joi.object({
  productId: Joi.string().uuid({ version: 'uuidv4' }).required(),
  variantId: Joi.string().uuid({ version: 'uuidv4' }).optional().allow(null),
  quantity: Joi.number().positive().precision(4).required(),
  unitPrice: Joi.number().min(0).precision(2).required(),
  discountPercent: Joi.number().min(0).max(100).precision(2).optional().default(0),
  taxPercent: Joi.number().min(0).max(100).precision(2).optional().default(0),
});

const schemas = {
  createPurchaseOrder: Joi.object({
    vendorId: Joi.string().uuid({ version: 'uuidv4' }).required(),
    orderDate: Joi.date().optional().default(() => new Date()),
    expectedDate: Joi.date().optional().allow(null),
    currencyCode: Joi.string().length(3).optional().default('USD'),
    exchangeRate: Joi.number().positive().precision(6).optional().default(1),
    shippingTotal: Joi.number().min(0).precision(2).optional().default(0),
    notes: Joi.string().max(5000).optional().allow(null, ''),
    shippingAddress: Joi.string().max(2000).optional().allow(null, ''),
    billingAddress: Joi.string().max(2000).optional().allow(null, ''),
    items: Joi.array().items(poItemSchema).min(1).required(),
  }),

  updatePurchaseOrderStatus: Joi.object({
    status: Joi.string().valid(
      'draft', 'pending', 'approved', 'ordered', 'partial', 'received', 'cancelled'
    ).required(),
  }),

  recordPayment: Joi.object({
    amount: Joi.number().positive().precision(2).required(),
    paymentMethod: Joi.string().max(50).optional().allow(null, ''),
    referenceNumber: Joi.string().max(255).optional().allow(null, ''),
    notes: Joi.string().max(1000).optional().allow(null, ''),
  }),

  receiveGoods: Joi.object({
    receivedDate: Joi.date().optional().default(() => new Date()),
    notes: Joi.string().max(2000).optional().allow(null, ''),
    items: Joi.array().items(Joi.object({
      purchaseOrderItemId: Joi.string().uuid({ version: 'uuidv4' }).required(),
      productId: Joi.string().uuid({ version: 'uuidv4' }).required(),
      quantity: Joi.number().positive().precision(4).required(),
    })).min(1).required(),
  }),
};

module.exports = schemas;
