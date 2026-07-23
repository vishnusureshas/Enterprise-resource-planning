const customerRepo = require('./customer.repo');
const { BadRequestError, NotFoundError } = require('../../shared/errors');
const logger = require('../../config/logger');
const { invalidateCache } = require('../../middleware/cache');
const { keys } = require('../../cache/cacheKeys');

class CustomerService {
  async list(organizationId, query) {
    const pagination = {
      limit: query.limit || 20,
      offset: query.offset || 0,
      sortBy: query.sortBy || 'name',
      sortOrder: query.sortOrder || 'ASC',
    };
    const { data, total } = await customerRepo.findAll(organizationId, {
      ...pagination, search: query.search, status: query.status,
    });
    return { data, total };
  }

  async getById(id, organizationId) {
    const customer = await customerRepo.findById(id, organizationId);
    if (!customer) throw new NotFoundError('Customer not found');
    const addresses = await customerRepo.findAddresses(id);
    const contacts = await customerRepo.findContacts(id);
    const notes = await customerRepo.findNotes(id);
    return { ...customer, addresses, contacts, notes };
  }

  async create(data, organizationId) {
    const existing = await customerRepo.findByCode(data.code, organizationId);
    if (existing) throw new BadRequestError('Customer code already exists');

    if (data.email) {
      const emailExists = await customerRepo.findByEmail(data.email, organizationId);
      if (emailExists) throw new BadRequestError('Customer email already exists');
    }

    const customer = await customerRepo.create(data, organizationId);
    await invalidateCache([keys.customer.item(organizationId, customer.id)]);
    logger.info('Customer created', { customerId: customer.id, code: customer.code, organizationId });
    return customer;
  }

  async update(id, organizationId, data) {
    const existing = await customerRepo.findById(id, organizationId);
    if (!existing) throw new NotFoundError('Customer not found');

    if (data.code && data.code !== existing.code) {
      const codeExists = await customerRepo.findByCode(data.code, organizationId);
      if (codeExists) throw new BadRequestError('Customer code already exists');
    }

    if (data.email && data.email !== existing.email) {
      const emailExists = await customerRepo.findByEmail(data.email, organizationId);
      if (emailExists) throw new BadRequestError('Customer email already exists');
    }

    const customer = await customerRepo.update(id, organizationId, data);
    await invalidateCache([keys.customer.item(organizationId, id)]);
    logger.info('Customer updated', { customerId: id, organizationId });
    return customer;
  }

  async delete(id, organizationId) {
    const existing = await customerRepo.findById(id, organizationId);
    if (!existing) throw new NotFoundError('Customer not found');
    await customerRepo.delete(id, organizationId);
    await invalidateCache([keys.customer.item(organizationId, id)]);
    logger.info('Customer deleted', { customerId: id, organizationId });
  }

  async listAddresses(customerId, organizationId) {
    const customer = await customerRepo.findById(customerId, organizationId);
    if (!customer) throw new NotFoundError('Customer not found');
    return customerRepo.findAddresses(customerId);
  }

  async createAddress(customerId, organizationId, data) {
    const customer = await customerRepo.findById(customerId, organizationId);
    if (!customer) throw new NotFoundError('Customer not found');
    return customerRepo.createAddress(customerId, data);
  }

  async updateAddress(customerId, addressId, organizationId, data) {
    const customer = await customerRepo.findById(customerId, organizationId);
    if (!customer) throw new NotFoundError('Customer not found');
    const existing = await customerRepo.findAddressById(addressId, customerId);
    if (!existing) throw new NotFoundError('Address not found');
    return customerRepo.updateAddress(addressId, customerId, data);
  }

  async deleteAddress(customerId, addressId, organizationId) {
    const customer = await customerRepo.findById(customerId, organizationId);
    if (!customer) throw new NotFoundError('Customer not found');
    await customerRepo.deleteAddress(addressId, customerId);
  }

  async listContacts(customerId, organizationId) {
    const customer = await customerRepo.findById(customerId, organizationId);
    if (!customer) throw new NotFoundError('Customer not found');
    return customerRepo.findContacts(customerId);
  }

  async createContact(customerId, organizationId, data) {
    const customer = await customerRepo.findById(customerId, organizationId);
    if (!customer) throw new NotFoundError('Customer not found');
    return customerRepo.createContact(customerId, data);
  }

  async updateContact(customerId, contactId, organizationId, data) {
    const customer = await customerRepo.findById(customerId, organizationId);
    if (!customer) throw new NotFoundError('Customer not found');
    const existing = await customerRepo.findContactById(contactId, customerId);
    if (!existing) throw new NotFoundError('Contact not found');
    return customerRepo.updateContact(contactId, customerId, data);
  }

  async deleteContact(customerId, contactId, organizationId) {
    const customer = await customerRepo.findById(customerId, organizationId);
    if (!customer) throw new NotFoundError('Customer not found');
    await customerRepo.deleteContact(contactId, customerId);
  }

  async listNotes(customerId, organizationId) {
    const customer = await customerRepo.findById(customerId, organizationId);
    if (!customer) throw new NotFoundError('Customer not found');
    return customerRepo.findNotes(customerId);
  }

  async createNote(customerId, organizationId, content, userId) {
    const customer = await customerRepo.findById(customerId, organizationId);
    if (!customer) throw new NotFoundError('Customer not found');
    return customerRepo.createNote(customerId, content, userId);
  }
}

module.exports = new CustomerService();
