const customerService = require('./customer.service');
const orderService = require('../order/order.service');
const { asyncHandler } = require('../../middleware/errorHandler');
const { validate } = require('../../middleware/validate');
const { paginate, buildPaginatedResponse } = require('../../middleware/pagination');
const schemas = require('./customer.validation');

const createCustomerValidation = validate(schemas.createCustomer);
const updateCustomerValidation = validate(schemas.updateCustomer);
const createAddressValidation = validate(schemas.createAddress);
const updateAddressValidation = validate(schemas.updateAddress);
const createContactValidation = validate(schemas.createContact);
const updateContactValidation = validate(schemas.updateContact);
const createNoteValidation = validate(schemas.createNote);

const list = [
  paginate,
  asyncHandler(async (req, res) => {
    const result = await customerService.list(req.user.organizationId, {
      ...req.pagination, search: req.query.search, status: req.query.status,
    });
    res.json(buildPaginatedResponse(result.data, result.total, req.pagination));
  }),
];

const get = asyncHandler(async (req, res) => {
  const customer = await customerService.getById(req.params.id, req.user.organizationId);
  res.json({ success: true, data: customer, error: null });
});

const create = [
  createCustomerValidation,
  asyncHandler(async (req, res) => {
    const customer = await customerService.create(req.body, req.user.organizationId);
    res.status(201).json({ success: true, data: customer, error: null });
  }),
];

const update = [
  updateCustomerValidation,
  asyncHandler(async (req, res) => {
    const customer = await customerService.update(req.params.id, req.user.organizationId, req.body);
    res.json({ success: true, data: customer, error: null });
  }),
];

const remove = asyncHandler(async (req, res) => {
  await customerService.delete(req.params.id, req.user.organizationId);
  res.json({ success: true, data: null, error: null });
});

const listAddresses = asyncHandler(async (req, res) => {
  const addresses = await customerService.listAddresses(req.params.id, req.user.organizationId);
  res.json({ success: true, data: addresses, error: null });
});

const createAddress = [
  createAddressValidation,
  asyncHandler(async (req, res) => {
    const address = await customerService.createAddress(req.params.id, req.user.organizationId, req.body);
    res.status(201).json({ success: true, data: address, error: null });
  }),
];

const updateAddress = [
  updateAddressValidation,
  asyncHandler(async (req, res) => {
    const address = await customerService.updateAddress(req.params.id, req.params.addressId, req.user.organizationId, req.body);
    res.json({ success: true, data: address, error: null });
  }),
];

const deleteAddress = asyncHandler(async (req, res) => {
  await customerService.deleteAddress(req.params.id, req.params.addressId, req.user.organizationId);
  res.json({ success: true, data: null, error: null });
});

const listContacts = asyncHandler(async (req, res) => {
  const contacts = await customerService.listContacts(req.params.id, req.user.organizationId);
  res.json({ success: true, data: contacts, error: null });
});

const createContact = [
  createContactValidation,
  asyncHandler(async (req, res) => {
    const contact = await customerService.createContact(req.params.id, req.user.organizationId, req.body);
    res.status(201).json({ success: true, data: contact, error: null });
  }),
];

const updateContact = [
  updateContactValidation,
  asyncHandler(async (req, res) => {
    const contact = await customerService.updateContact(req.params.id, req.params.contactId, req.user.organizationId, req.body);
    res.json({ success: true, data: contact, error: null });
  }),
];

const deleteContact = asyncHandler(async (req, res) => {
  await customerService.deleteContact(req.params.id, req.params.contactId, req.user.organizationId);
  res.json({ success: true, data: null, error: null });
});

const listNotes = asyncHandler(async (req, res) => {
  const notes = await customerService.listNotes(req.params.id, req.user.organizationId);
  res.json({ success: true, data: notes, error: null });
});

const createNote = [
  createNoteValidation,
  asyncHandler(async (req, res) => {
    const note = await customerService.createNote(req.params.id, req.user.organizationId, req.body.content, req.user.id);
    res.status(201).json({ success: true, data: note, error: null });
  }),
];

const listOrders = [
  paginate,
  asyncHandler(async (req, res) => {
    const result = await orderService.listByCustomer(req.params.id, req.user.organizationId, req.pagination);
    res.json(buildPaginatedResponse(result.data, result.total, req.pagination));
  }),
];

module.exports = {
  list, get, create, update, remove,
  listAddresses, createAddress, updateAddress, deleteAddress,
  listContacts, createContact, updateContact, deleteContact,
  listNotes, createNote, listOrders,
};
