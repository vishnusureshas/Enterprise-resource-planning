const poRepo = require('./purchase-order.repo');
const vendorRepo = require('../vendor/vendor.repo');
const inventoryRepo = require('../inventory/inventory.repo');
const { BadRequestError, NotFoundError } = require('../../shared/errors');
const logger = require('../../config/logger');

class PurchaseOrderService {
  generatePoNumber(organizationId) {
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const random = Math.floor(Math.random() * 9000) + 1000;
    return `PO-${dateStr}-${random}`;
  }

  async list(organizationId, query) {
    const pagination = {
      limit: query.limit || 20,
      offset: query.offset || 0,
      sortBy: query.sortBy || 'created_at',
      sortOrder: query.sortOrder || 'DESC',
    };
    const { data, total } = await poRepo.findAll(organizationId, {
      ...pagination, search: query.search, status: query.status,
      vendorId: query.vendorId, fromDate: query.fromDate, toDate: query.toDate,
    });
    return { data, total };
  }

  async getById(id, organizationId) {
    const po = await poRepo.findById(id, organizationId);
    if (!po) throw new NotFoundError('Purchase order not found');
    const items = await poRepo.findItemsByOrderId(id);
    const taxes = await poRepo.findTaxesByOrderId(id);
    const receipts = await poRepo.findReceiptsByOrderId(id);
    return { ...po, items, taxes, receipts };
  }

  async create(data, organizationId, userId) {
    const vendor = await vendorRepo.findById(data.vendorId, organizationId);
    if (!vendor) throw new NotFoundError('Vendor not found');

    if (vendor.status !== 'active') {
      throw new BadRequestError('Vendor is not active');
    }

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
    const poNumber = this.generatePoNumber(organizationId);

    const orderData = {
      poNumber,
      vendorId: data.vendorId,
      orderDate: data.orderDate || new Date(),
      expectedDate: data.expectedDate || null,
      currencyCode: data.currencyCode || 'USD',
      exchangeRate: data.exchangeRate || 1,
      subtotal,
      discountTotal,
      taxTotal,
      shippingTotal: data.shippingTotal || 0,
      grandTotal,
      notes: data.notes || null,
      shippingAddress: data.shippingAddress || null,
      billingAddress: data.billingAddress || null,
    };

    const po = await poRepo.create(orderData, items, organizationId, userId);
    logger.info('Purchase order created', { poId: po.id, poNumber, organizationId });
    return { ...po, items };
  }

  async updateStatus(id, organizationId, status) {
    const existing = await poRepo.findById(id, organizationId);
    if (!existing) throw new NotFoundError('Purchase order not found');

    const validTransitions = {
      draft: ['pending', 'cancelled'],
      pending: ['approved', 'cancelled'],
      approved: ['ordered', 'cancelled'],
      ordered: ['partial', 'received', 'cancelled'],
      partial: ['received', 'cancelled'],
      received: [],
      cancelled: [],
    };

    const allowed = validTransitions[existing.status];
    if (!allowed || !allowed.includes(status)) {
      throw new BadRequestError(`Cannot transition from ${existing.status} to ${status}`);
    }

    const po = await poRepo.updateStatus(id, organizationId, status);
    logger.info('Purchase order status updated', { poId: id, from: existing.status, to: status, organizationId });
    return po;
  }

  async receiveGoods(id, organizationId, data, userId) {
    const po = await poRepo.findById(id, organizationId);
    if (!po) throw new NotFoundError('Purchase order not found');

    if (po.status === 'cancelled') {
      throw new BadRequestError('Cannot receive goods for a cancelled purchase order');
    }

    const poItems = await poRepo.findItemsByOrderId(id);
    const receiptNumber = `GR-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${Math.floor(Math.random() * 9000) + 1000}`;

    const receiptItems = [];
    for (const ri of data.items) {
      const poItem = poItems.find(i => i.id === ri.purchaseOrderItemId);
      if (!poItem) throw new NotFoundError(`Purchase order item not found: ${ri.purchaseOrderItemId}`);

      const remaining = poItem.quantity - parseFloat(poItem.received_quantity);
      if (ri.quantity > remaining) {
        throw new BadRequestError(`Receiving quantity ${ri.quantity} exceeds remaining ${remaining} for item ${poItem.product_name}`);
      }

      receiptItems.push({
        purchaseOrderItemId: ri.purchaseOrderItemId,
        productId: ri.productId,
        quantity: ri.quantity,
      });
    }

    const receipt = await poRepo.receiveGoods(id, receiptItems, { receiptNumber, receivedDate: data.receivedDate, notes: data.notes }, userId);

    const updatedItems = await poRepo.findItemsByOrderId(id);
    const allReceived = updatedItems.every(i => parseFloat(i.quantity) === parseFloat(i.received_quantity));
    const anyReceived = updatedItems.some(i => parseFloat(i.received_quantity) > 0);

    let newStatus = po.status;
    if (allReceived) {
      newStatus = 'received';
    } else if (anyReceived) {
      newStatus = 'partial';
    }

    if (newStatus !== po.status) {
      await poRepo.updateStatus(id, organizationId, newStatus);
    }

    logger.info('Goods received', { poId: id, receiptId: receipt.id, organizationId });
    return receipt;
  }

  async getReceiptDetails(receiptId, organizationId) {
    const result = await poRepo.findReceiptsByOrderId(organizationId);
    const receipt = result.find(r => r.id === receiptId);
    if (!receipt) throw new NotFoundError('Receipt not found');
    const items = await poRepo.findReceiptItemsByReceiptId(receiptId);
    return { ...receipt, items };
  }

  async getTimeline(id, organizationId) {
    const po = await poRepo.findById(id, organizationId);
    if (!po) throw new NotFoundError('Purchase order not found');
    return poRepo.findTimeline(id, organizationId);
  }
}

module.exports = new PurchaseOrderService();
