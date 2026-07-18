const vendorRepo = require('./vendor.repo');
const { BadRequestError, NotFoundError } = require('../../shared/errors');
const logger = require('../../config/logger');

class VendorService {
  async list(organizationId, query) {
    const pagination = {
      limit: query.limit || 20,
      offset: query.offset || 0,
      sortBy: query.sortBy || 'name',
      sortOrder: query.sortOrder || 'ASC',
    };
    const { data, total } = await vendorRepo.findAll(organizationId, {
      ...pagination, search: query.search, status: query.status,
    });
    return { data, total };
  }

  async getById(id, organizationId) {
    const vendor = await vendorRepo.findById(id, organizationId);
    if (!vendor) throw new NotFoundError('Vendor not found');
    const contacts = await vendorRepo.findContacts(id);
    const contracts = await vendorRepo.findContracts(id);
    return { ...vendor, contacts, contracts };
  }

  async create(data, organizationId) {
    const existing = await vendorRepo.findByCode(data.code, organizationId);
    if (existing) throw new BadRequestError('Vendor code already exists');

    if (data.email) {
      const emailExists = await vendorRepo.findByEmail(data.email, organizationId);
      if (emailExists) throw new BadRequestError('Vendor email already exists');
    }

    const vendor = await vendorRepo.create(data, organizationId);
    logger.info('Vendor created', { vendorId: vendor.id, code: vendor.code, organizationId });
    return vendor;
  }

  async update(id, organizationId, data) {
    const existing = await vendorRepo.findById(id, organizationId);
    if (!existing) throw new NotFoundError('Vendor not found');

    if (data.code && data.code !== existing.code) {
      const codeExists = await vendorRepo.findByCode(data.code, organizationId);
      if (codeExists) throw new BadRequestError('Vendor code already exists');
    }

    if (data.email && data.email !== existing.email) {
      const emailExists = await vendorRepo.findByEmail(data.email, organizationId);
      if (emailExists) throw new BadRequestError('Vendor email already exists');
    }

    const vendor = await vendorRepo.update(id, organizationId, data);
    logger.info('Vendor updated', { vendorId: id, organizationId });
    return vendor;
  }

  async delete(id, organizationId) {
    const existing = await vendorRepo.findById(id, organizationId);
    if (!existing) throw new NotFoundError('Vendor not found');
    await vendorRepo.delete(id, organizationId);
    logger.info('Vendor deleted', { vendorId: id, organizationId });
  }

  async listContacts(vendorId, organizationId) {
    const vendor = await vendorRepo.findById(vendorId, organizationId);
    if (!vendor) throw new NotFoundError('Vendor not found');
    return vendorRepo.findContacts(vendorId);
  }

  async createContact(vendorId, organizationId, data) {
    const vendor = await vendorRepo.findById(vendorId, organizationId);
    if (!vendor) throw new NotFoundError('Vendor not found');
    return vendorRepo.createContact(vendorId, data);
  }

  async updateContact(vendorId, contactId, organizationId, data) {
    const vendor = await vendorRepo.findById(vendorId, organizationId);
    if (!vendor) throw new NotFoundError('Vendor not found');
    const existing = await vendorRepo.findContactById(contactId, vendorId);
    if (!existing) throw new NotFoundError('Contact not found');
    return vendorRepo.updateContact(contactId, vendorId, data);
  }

  async deleteContact(vendorId, contactId, organizationId) {
    const vendor = await vendorRepo.findById(vendorId, organizationId);
    if (!vendor) throw new NotFoundError('Vendor not found');
    await vendorRepo.deleteContact(contactId, vendorId);
  }

  async listContracts(vendorId, organizationId) {
    const vendor = await vendorRepo.findById(vendorId, organizationId);
    if (!vendor) throw new NotFoundError('Vendor not found');
    return vendorRepo.findContracts(vendorId);
  }

  async createContract(vendorId, organizationId, data, userId) {
    const vendor = await vendorRepo.findById(vendorId, organizationId);
    if (!vendor) throw new NotFoundError('Vendor not found');
    return vendorRepo.createContract(vendorId, data, userId);
  }

  async updateContract(vendorId, contractId, organizationId, data) {
    const vendor = await vendorRepo.findById(vendorId, organizationId);
    if (!vendor) throw new NotFoundError('Vendor not found');
    const existing = await vendorRepo.findContractById(contactId, vendorId);
    if (!existing) throw new NotFoundError('Contract not found');
    return vendorRepo.updateContract(contactId, vendorId, data);
  }

  async deleteContract(vendorId, contractId, organizationId) {
    const vendor = await vendorRepo.findById(vendorId, organizationId);
    if (!vendor) throw new NotFoundError('Vendor not found');
    await vendorRepo.deleteContract(contactId, vendorId);
  }

  async listPurchaseOrders(vendorId, organizationId, query) {
    const vendor = await vendorRepo.findById(vendorId, organizationId);
    if (!vendor) throw new NotFoundError('Vendor not found');
    return vendorRepo.findPurchaseOrdersByVendor(vendorId, organizationId, {
      limit: query.limit || 20, offset: query.offset || 0,
    });
  }
}

module.exports = new VendorService();
