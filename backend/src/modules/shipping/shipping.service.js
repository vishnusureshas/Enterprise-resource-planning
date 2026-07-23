const shippingRepo = require('./shipping.repo');
const { redis } = require('../../config/redis');
const { NotFoundError, BadRequestError } = require('../../shared/errors');
const { invalidateCache } = require('../../middleware/cache');
const { keys } = require('../../cache/cacheKeys');
const logger = require('../../config/logger');

class ShippingService {
  // ─── Carriers ─────────────────────────────────────────────────────
  async listCarriers(organizationId, params) {
    return shippingRepo.findAllCarriers(organizationId, params);
  }

  async getCarrier(id, organizationId) {
    const carrier = await shippingRepo.findCarrierById(id, organizationId);
    if (!carrier) throw new NotFoundError('Carrier not found');
    return carrier;
  }

  async createCarrier(data, organizationId, userId) {
    const existing = await shippingRepo.findByCarrierCode(data.code, organizationId);
    if (existing) throw new BadRequestError('Carrier code already exists');
    const carrier = await shippingRepo.createCarrier(data, organizationId, userId);
    await invalidateCache([keys.shipping.carriers(organizationId)]);
    return carrier;
  }

  async updateCarrier(id, organizationId, data) {
    await this.getCarrier(id, organizationId);
    if (data.code) {
      const existing = await shippingRepo.findByCarrierCode(data.code, organizationId);
      if (existing && existing.id !== id) throw new BadRequestError('Carrier code already exists');
    }
    const carrier = await shippingRepo.updateCarrier(id, organizationId, data);
    await invalidateCache([keys.shipping.carrier(organizationId, id), keys.shipping.carriers(organizationId)]);
    return carrier;
  }

  async deleteCarrier(id, organizationId) {
    await this.getCarrier(id, organizationId);
    await shippingRepo.deleteCarrier(id, organizationId);
    await invalidateCache([keys.shipping.carrier(organizationId, id), keys.shipping.carriers(organizationId)]);
  }

  // ─── Shipments ────────────────────────────────────────────────────
  async listShipments(organizationId, params) {
    return shippingRepo.findAllShipments(organizationId, params);
  }

  async getShipment(id, organizationId) {
    const shipment = await shippingRepo.findShipmentById(id, organizationId);
    if (!shipment) throw new NotFoundError('Shipment not found');
    const items = await shippingRepo.findShipmentItems(id);
    const tracking = await shippingRepo.findTrackingEvents(id);
    return { ...shipment, items, tracking };
  }

  async getShipmentByTrackingNumber(trackingNumber, organizationId) {
    const shipment = await shippingRepo.findShipmentByTrackingNumber(trackingNumber, organizationId);
    if (!shipment) throw new NotFoundError('Shipment not found');
    const tracking = await shippingRepo.findTrackingEvents(shipment.id);
    return { ...shipment, tracking };
  }

  async createShipment(data, organizationId, userId) {
    const shipment = await shippingRepo.createShipment(data, organizationId, userId);
    if (data.items && data.items.length > 0) {
      await shippingRepo.createShipmentItems(shipment.id, data.items);
    }
    await invalidateCache([keys.shipping.shipments(organizationId)]);
    return this.getShipment(shipment.id, organizationId);
  }

  async updateShipment(id, organizationId, data) {
    await this.getShipment(id, organizationId);
    const shipment = await shippingRepo.updateShipment(id, organizationId, data);
    await invalidateCache([keys.shipping.shipment(organizationId, id), keys.shipping.shipments(organizationId)]);
    return shipment;
  }

  async dispatchShipment(id, organizationId) {
    const shipment = await shippingRepo.findShipmentById(id, organizationId);
    if (!shipment) throw new NotFoundError('Shipment not found');
    if (shipment.status !== 'pending' && shipment.status !== 'draft') {
      throw new BadRequestError(`Cannot dispatch shipment with status "${shipment.status}"`);
    }
    const updated = await shippingRepo.updateShipmentStatus(id, organizationId, 'dispatched', {
      shippedDate: new Date(),
    });
    await shippingRepo.createTrackingEvent(id, {
      status: 'dispatched',
      description: 'Shipment has been dispatched',
      occurredAt: new Date(),
    });
    await invalidateCache([keys.shipping.shipment(organizationId, id), keys.shipping.shipments(organizationId)]);
    return updated;
  }

  async deliverShipment(id, organizationId) {
    const shipment = await shippingRepo.findShipmentById(id, organizationId);
    if (!shipment) throw new NotFoundError('Shipment not found');
    if (shipment.status !== 'dispatched' && shipment.status !== 'in_transit') {
      throw new BadRequestError(`Cannot deliver shipment with status "${shipment.status}"`);
    }
    const updated = await shippingRepo.updateShipmentStatus(id, organizationId, 'delivered', {
      actualDeliveryDate: new Date(),
    });
    await shippingRepo.createTrackingEvent(id, {
      status: 'delivered',
      description: 'Shipment has been delivered',
      occurredAt: new Date(),
    });
    await invalidateCache([keys.shipping.shipment(organizationId, id), keys.shipping.shipments(organizationId)]);
    return updated;
  }

  async addTrackingEvent(id, organizationId, data) {
    const shipment = await shippingRepo.findShipmentById(id, organizationId);
    if (!shipment) throw new NotFoundError('Shipment not found');
    const event = await shippingRepo.createTrackingEvent(id, data);
    await invalidateCache([keys.shipping.shipment(organizationId, id), keys.shipping.shipments(organizationId)]);
    return event;
  }

  async deleteShipment(id, organizationId) {
    await this.getShipment(id, organizationId);
    await shippingRepo.deleteShipment(id, organizationId);
    await invalidateCache([keys.shipping.shipment(organizationId, id), keys.shipping.shipments(organizationId)]);
  }

  // ─── Rates (stub - integrates with carrier APIs later) ────────────
  async calculateRates(data) {
    const rates = [
      { carrier: 'Standard', service: 'Ground', rate: 5.99 + data.weight * 0.5, currency: 'USD', estimatedDays: '3-5' },
      { carrier: 'Standard', service: 'Express', rate: 12.99 + data.weight * 1.2, currency: 'USD', estimatedDays: '1-2' },
    ];
    return rates;
  }
}

module.exports = new ShippingService();
