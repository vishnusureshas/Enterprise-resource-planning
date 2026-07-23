const shippingRepo = require('./shipping.repo');
const { redis } = require('../../config/redis');
const { NotFoundError, BadRequestError } = require('../../shared/errors');

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
    return shippingRepo.createCarrier(data, organizationId, userId);
  }

  async updateCarrier(id, organizationId, data) {
    await this.getCarrier(id, organizationId);
    if (data.code) {
      const existing = await shippingRepo.findByCarrierCode(data.code, organizationId);
      if (existing && existing.id !== id) throw new BadRequestError('Carrier code already exists');
    }
    return shippingRepo.updateCarrier(id, organizationId, data);
  }

  async deleteCarrier(id, organizationId) {
    await this.getCarrier(id, organizationId);
    return shippingRepo.deleteCarrier(id, organizationId);
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
    return this.getShipment(shipment.id, organizationId);
  }

  async updateShipment(id, organizationId, data) {
    await this.getShipment(id, organizationId);
    return shippingRepo.updateShipment(id, organizationId, data);
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
    return updated;
  }

  async addTrackingEvent(id, organizationId, data) {
    const shipment = await shippingRepo.findShipmentById(id, organizationId);
    if (!shipment) throw new NotFoundError('Shipment not found');
    return shippingRepo.createTrackingEvent(id, data);
  }

  async deleteShipment(id, organizationId) {
    await this.getShipment(id, organizationId);
    return shippingRepo.deleteShipment(id, organizationId);
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
