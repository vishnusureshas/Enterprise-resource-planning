const repo = require('./manufacturing.repo');
const { BadRequestError, NotFoundError, ConflictError } = require('../../shared/errors');
const logger = require('../../config/logger');
const { invalidateCache } = require('../../middleware/cache');
const { keys } = require('../../cache/cacheKeys');

class ManufacturingService {
  // ─── Work Centers ───────────────────────────────────────────────────

  async listWorkCenters(organizationId, params) {
    return repo.findAllWorkCenters(organizationId, params);
  }

  async getWorkCenter(id, organizationId) {
    const center = await repo.findWorkCenterById(id, organizationId);
    if (!center) throw new NotFoundError('Work center not found');
    return center;
  }

  async createWorkCenter(data, userId) {
    const existing = await repo.findWorkCenterByCode(data.code, data.organizationId);
    if (existing) throw new ConflictError('Work center code already exists');
    return repo.createWorkCenter(data, userId);
  }

  async updateWorkCenter(id, organizationId, data, userId) {
    const center = await repo.findWorkCenterById(id, organizationId);
    if (!center) throw new NotFoundError('Work center not found');
    if (data.code && data.code !== center.code) {
      const existing = await repo.findWorkCenterByCode(data.code, organizationId);
      if (existing) throw new ConflictError('Work center code already exists');
    }
    const updated = await repo.updateWorkCenter(id, organizationId, data, userId);
    if (!updated) throw new NotFoundError('Work center not found');
    return updated;
  }

  async deleteWorkCenter(id, organizationId, userId) {
    const result = await repo.deleteWorkCenter(id, organizationId, userId);
    if (!result) throw new NotFoundError('Work center not found');
  }

  // ─── BOM ────────────────────────────────────────────────────────────

  async listBoms(organizationId, params) {
    return repo.findAllBoms(organizationId, params);
  }

  async getBom(id, organizationId) {
    const bom = await repo.findBomById(id, organizationId);
    if (!bom) throw new NotFoundError('BOM not found');
    return bom;
  }

  async createBom(data, userId) {
    return repo.createBom(data, userId);
  }

  async updateBom(id, organizationId, data, userId) {
    const bom = await repo.findBomById(id, organizationId);
    if (!bom) throw new NotFoundError('BOM not found');
    return repo.updateBom(id, organizationId, data, userId);
  }

  async deleteBom(id, organizationId, userId) {
    const result = await repo.deleteBom(id, organizationId, userId);
    if (!result) throw new NotFoundError('BOM not found');
  }

  async explodeBom(id, organizationId) {
    const bom = await repo.findBomById(id, organizationId);
    if (!bom) throw new NotFoundError('BOM not found');
    const tree = await repo.explodeBom(id, organizationId);
    const totalCost = tree.reduce((sum, item) => sum + (parseFloat(item.unit_cost || 0) * parseFloat(item.total_quantity)), 0);
    return { bom, tree, totalCost };
  }

  // ─── Work Orders ────────────────────────────────────────────────────

  async listWorkOrders(organizationId, params) {
    return repo.findAllWorkOrders(organizationId, params);
  }

  async getWorkOrder(id, organizationId) {
    const wo = await repo.findWorkOrderById(id, organizationId);
    if (!wo) throw new NotFoundError('Work order not found');
    return wo;
  }

  async createWorkOrder(data, userId) {
    return repo.createWorkOrder(data, userId);
  }

  async updateWorkOrderStatus(id, organizationId, status, userId) {
    const wo = await repo.findWorkOrderById(id, organizationId);
    if (!wo) throw new NotFoundError('Work order not found');
    const validTransitions = {
      draft: ['planned', 'cancelled'],
      planned: ['in_progress', 'cancelled'],
      in_progress: ['completed', 'cancelled'],
      completed: [],
      cancelled: [],
    };
    if (!validTransitions[wo.status]?.includes(status)) {
      throw new BadRequestError(`Cannot transition from '${wo.status}' to '${status}'`);
    }
    return repo.updateWorkOrderStatus(id, organizationId, status, userId);
  }

  async startProduction(id, organizationId, userId) {
    const wo = await repo.findWorkOrderById(id, organizationId);
    if (!wo) throw new NotFoundError('Work order not found');
    if (!['draft', 'planned'].includes(wo.status)) {
      throw new BadRequestError(`Cannot start work order with status '${wo.status}'`);
    }
    return repo.startWorkOrder(id, organizationId, userId);
  }

  async completeProduction(id, organizationId, userId) {
    const wo = await repo.findWorkOrderById(id, organizationId);
    if (!wo) throw new NotFoundError('Work order not found');
    if (wo.status !== 'in_progress') {
      throw new BadRequestError(`Cannot complete work order with status '${wo.status}'`);
    }
    return repo.completeWorkOrder(id, organizationId, userId);
  }

  async recordConsumption(id, organizationId, data, userId) {
    const wo = await repo.findWorkOrderById(id, organizationId);
    if (!wo) throw new NotFoundError('Work order not found');
    if (wo.status !== 'in_progress') {
      throw new BadRequestError('Can only record consumption for in-progress work orders');
    }
    const consumption = await repo.createConsumption(id, {
      ...data,
      quantityPlanned: data.quantityActual,
    }, userId);
    if (data.warehouseStockId) {
      await repo.deductStock(data.warehouseStockId, data.quantityActual);
    }
    await invalidateCache([
      keys.inventory.lowStock(organizationId),
      keys.dashboard.kpi(organizationId, 'manufacturing'),
    ]);
    return consumption;
  }

  async recordOutput(id, organizationId, data, userId) {
    const wo = await repo.findWorkOrderById(id, organizationId);
    if (!wo) throw new NotFoundError('Work order not found');
    if (wo.status !== 'in_progress') {
      throw new BadRequestError('Can only record output for in-progress work orders');
    }
    const output = await repo.createOutput(id, data, userId);
    const producedDelta = data.isDefective ? 0 : data.quantity;
    const scrappedDelta = data.isDefective ? data.quantity : 0;
    await repo.updateWorkOrderQuantities(id, producedDelta, scrappedDelta);
    if (data.warehouseStockId && !data.isDefective) {
      await repo.addStock(data.warehouseStockId, data.quantity);
    }
    await invalidateCache([
      keys.inventory.lowStock(organizationId),
      keys.dashboard.kpi(organizationId, 'manufacturing'),
    ]);
    return output;
  }
}

module.exports = new ManufacturingService();
