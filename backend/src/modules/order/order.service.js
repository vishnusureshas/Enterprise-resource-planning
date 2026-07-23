const orderRepo = require('./order.repo');
const customerRepo = require('../customer/customer.repo');
const inventoryRepo = require('../inventory/inventory.repo');
const { BadRequestError, NotFoundError } = require('../../shared/errors');
const logger = require('../../config/logger');
const { invalidateCache } = require('../../middleware/cache');
const { keys } = require('../../cache/cacheKeys');

class OrderService {
  generateOrderNumber(organizationId) {
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const random = Math.floor(Math.random() * 9000) + 1000;
    return `ORD-${dateStr}-${random}`;
  }

  async list(organizationId, query) {
    const pagination = {
      limit: query.limit || 20,
      offset: query.offset || 0,
      sortBy: query.sortBy || 'created_at',
      sortOrder: query.sortOrder || 'DESC',
    };
    const { data, total } = await orderRepo.findAll(organizationId, {
      ...pagination, search: query.search, status: query.status,
      customerId: query.customerId, fromDate: query.fromDate, toDate: query.toDate,
    });
    return { data, total };
  }

  async getById(id, organizationId) {
    const order = await orderRepo.findById(id, organizationId);
    if (!order) throw new NotFoundError('Order not found');
    const items = await orderRepo.findItemsByOrderId(id);
    const payments = await orderRepo.findPaymentsByOrderId(id);
    const taxes = await orderRepo.findTaxesByOrderId(id);
    return { ...order, items, payments, taxes };
  }

  async create(data, organizationId, userId) {
    const customer = await customerRepo.findById(data.customerId, organizationId);
    if (!customer) throw new NotFoundError('Customer not found');

    let subtotal = 0;
    let discountTotal = 0;
    let taxTotal = 0;

    const items = [];
    for (const item of data.items) {
      const product = await inventoryRepo.findProductById(item.productId, organizationId);
      if (!product) throw new NotFoundError(`Product not found: ${item.productId}`);

      if (!product.is_active) {
        throw new BadRequestError(`Product is inactive: ${product.name}`);
      }

      const discountAmount = (item.unitPrice * item.quantity) * (item.discountPercent / 100);
      const lineSubtotal = (item.unitPrice * item.quantity) - discountAmount;
      const taxAmount = lineSubtotal * (item.taxPercent / 100);
      const lineTotal = lineSubtotal + taxAmount;

      subtotal += item.unitPrice * item.quantity;
      discountTotal += discountAmount;
      taxTotal += taxAmount;

      items.push({
        productId: item.productId,
        variantId: item.variantId || null,
        productCode: product.sku,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountPercent: item.discountPercent || 0,
        discountAmount,
        taxPercent: item.taxPercent || 0,
        taxAmount,
        lineTotal,
      });
    }

    const grandTotal = subtotal - discountTotal + taxTotal + (data.shippingTotal || 0);
    const orderNumber = this.generateOrderNumber(organizationId);

    const orderData = {
      orderNumber,
      customerId: data.customerId,
      orderDate: data.orderDate || new Date(),
      currencyCode: data.currencyCode || 'USD',
      exchangeRate: data.exchangeRate || 1,
      subtotal,
      discountTotal,
      taxTotal,
      shippingTotal: data.shippingTotal || 0,
      grandTotal,
      notes: data.notes || null,
      shippingAddressId: data.shippingAddressId || null,
      billingAddressId: data.billingAddressId || null,
    };

    const order = await orderRepo.create(orderData, items, organizationId, userId);
    await invalidateCache([
      keys.dashboard.kpi(organizationId, 'orders'),
      keys.dashboard.kpi(organizationId, 'revenue'),
    ]);
    logger.info('Order created', { orderId: order.id, orderNumber, organizationId });
    return { ...order, items };
  }

  async updateStatus(id, organizationId, status) {
    const existing = await orderRepo.findById(id, organizationId);
    if (!existing) throw new NotFoundError('Order not found');

    const validTransitions = {
      draft: ['confirmed', 'cancelled'],
      confirmed: ['processing', 'cancelled'],
      processing: ['shipped', 'cancelled'],
      shipped: ['delivered', 'returned'],
      delivered: ['returned'],
      cancelled: [],
      returned: [],
    };

    const allowed = validTransitions[existing.status];
    if (!allowed || !allowed.includes(status)) {
      throw new BadRequestError(`Cannot transition from ${existing.status} to ${status}`);
    }

    const order = await orderRepo.updateStatus(id, organizationId, status);
    await invalidateCache([
      keys.customer.item(organizationId, order.customer_id),
      keys.dashboard.kpi(organizationId, 'orders'),
    ]);
    logger.info('Order status updated', { orderId: id, from: existing.status, to: status, organizationId });
    return order;
  }

  async cancel(id, organizationId, reason) {
    return this.updateStatus(id, organizationId, 'cancelled');
  }

  async recordPayment(id, organizationId, data, userId) {
    const order = await orderRepo.findById(id, organizationId);
    if (!order) throw new NotFoundError('Order not found');

    if (order.status === 'cancelled' || order.status === 'returned') {
      throw new BadRequestError('Cannot record payment for cancelled/returned order');
    }

    const payment = await orderRepo.recordPayment(id, data, userId);

    const payments = await orderRepo.findPaymentsByOrderId(id);
    const paidAmount = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

    await orderRepo.updateField(id, organizationId, 'paid_amount', paidAmount);
    await orderRepo.updateField(id, organizationId, 'balance_due', parseFloat(order.grand_total) - paidAmount);

    await invalidateCache([
      keys.dashboard.kpi(organizationId, 'revenue'),
    ]);

    logger.info('Payment recorded', { orderId: id, amount: data.amount, organizationId });
    return payment;
  }

  async listByCustomer(customerId, organizationId, query) {
    const customer = await customerRepo.findById(customerId, organizationId);
    if (!customer) throw new NotFoundError('Customer not found');
    return orderRepo.findOrdersByCustomerId(customerId, organizationId, {
      limit: query.limit || 20, offset: query.offset || 0,
    });
  }

  async getTimeline(id, organizationId) {
    const order = await orderRepo.findById(id, organizationId);
    if (!order) throw new NotFoundError('Order not found');
    return orderRepo.findTimeline(id, organizationId);
  }
}

module.exports = new OrderService();
