const Joi = require('joi');

const schemas = {
  createCarrier: Joi.object({
    code: Joi.string().min(1).max(50).required(),
    name: Joi.string().min(1).max(255).required(),
    description: Joi.string().max(1000).optional().allow(null, ''),
    website: Joi.string().uri().max(500).optional().allow(null, ''),
    phone: Joi.string().max(50).optional().allow(null, ''),
    email: Joi.string().email().max(255).optional().allow(null, ''),
    trackingUrlTemplate: Joi.string().max(500).optional().allow(null, ''),
    status: Joi.string().valid('active', 'inactive').optional().default('active'),
    attributes: Joi.object().optional().default({}),
  }),

  updateCarrier: Joi.object({
    code: Joi.string().min(1).max(50).optional(),
    name: Joi.string().min(1).max(255).optional(),
    description: Joi.string().max(1000).optional().allow(null, ''),
    website: Joi.string().uri().max(500).optional().allow(null, ''),
    phone: Joi.string().max(50).optional().allow(null, ''),
    email: Joi.string().email().max(255).optional().allow(null, ''),
    trackingUrlTemplate: Joi.string().max(500).optional().allow(null, ''),
    status: Joi.string().valid('active', 'inactive').optional(),
    attributes: Joi.object().optional(),
  }).min(1),

  createShipment: Joi.object({
    salesOrderId: Joi.string().uuid().optional().allow(null),
    carrierId: Joi.string().uuid().optional().allow(null),
    carrierTrackingNumber: Joi.string().max(255).optional().allow(null, ''),
    originAddress: Joi.string().max(2000).optional().allow(null, ''),
    destinationAddress: Joi.string().max(2000).optional().allow(null, ''),
    estimatedDeliveryDate: Joi.date().optional().allow(null),
    totalWeight: Joi.number().min(0).precision(4).optional().allow(null),
    weightUnit: Joi.string().max(20).optional().default('kg'),
    totalValue: Joi.number().min(0).precision(2).optional().allow(null),
    shippingCost: Joi.number().min(0).precision(2).optional().allow(null),
    currency: Joi.string().max(3).optional().default('USD'),
    notes: Joi.string().max(5000).optional().allow(null, ''),
    items: Joi.array().items(Joi.object({
      salesOrderItemId: Joi.string().uuid().optional().allow(null),
      productId: Joi.string().uuid().optional().allow(null),
      quantity: Joi.number().min(0.0001).precision(4).required(),
      unitWeight: Joi.number().min(0).precision(4).optional().allow(null),
    })).optional(),
  }),

  updateShipment: Joi.object({
    carrierId: Joi.string().uuid().optional().allow(null),
    carrierTrackingNumber: Joi.string().max(255).optional().allow(null, ''),
    originAddress: Joi.string().max(2000).optional().allow(null, ''),
    destinationAddress: Joi.string().max(2000).optional().allow(null, ''),
    estimatedDeliveryDate: Joi.date().optional().allow(null),
    totalWeight: Joi.number().min(0).precision(4).optional().allow(null),
    weightUnit: Joi.string().max(20).optional(),
    totalValue: Joi.number().min(0).precision(2).optional().allow(null),
    shippingCost: Joi.number().min(0).precision(2).optional().allow(null),
    currency: Joi.string().max(3).optional(),
    notes: Joi.string().max(5000).optional().allow(null, ''),
  }).min(1),

  addTrackingEvent: Joi.object({
    status: Joi.string().max(100).required(),
    location: Joi.string().max(255).optional().allow(null, ''),
    description: Joi.string().max(2000).optional().allow(null, ''),
    occurredAt: Joi.date().optional().default(() => new Date()),
  }),

  calculateRates: Joi.object({
    originPostalCode: Joi.string().max(20).optional().allow(null, ''),
    destinationPostalCode: Joi.string().max(20).required(),
    destinationCountry: Joi.string().max(3).required(),
    weight: Joi.number().min(0).precision(4).required(),
    weightUnit: Joi.string().max(20).optional().default('kg'),
    value: Joi.number().min(0).precision(2).optional(),
  }),
};

module.exports = schemas;
