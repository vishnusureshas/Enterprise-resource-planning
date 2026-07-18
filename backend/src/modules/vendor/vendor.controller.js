const vendorService = require('./vendor.service');
const { asyncHandler } = require('../../middleware/errorHandler');
const { validate } = require('../../middleware/validate');
const { paginate, buildPaginatedResponse } = require('../../middleware/pagination');
const schemas = require('./vendor.validation');

const createVendorValidation = validate(schemas.createVendor);
const updateVendorValidation = validate(schemas.updateVendor);
const createContactValidation = validate(schemas.createContact);
const updateContactValidation = validate(schemas.updateContact);
const createContractValidation = validate(schemas.createContract);
const updateContractValidation = validate(schemas.updateContract);

const list = [
  paginate,
  asyncHandler(async (req, res) => {
    const result = await vendorService.list(req.user.organizationId, {
      ...req.pagination, search: req.query.search, status: req.query.status,
    });
    res.json(buildPaginatedResponse(result.data, result.total, req.pagination));
  }),
];

const get = asyncHandler(async (req, res) => {
  const vendor = await vendorService.getById(req.params.id, req.user.organizationId);
  res.json({ success: true, data: vendor, error: null });
});

const create = [
  createVendorValidation,
  asyncHandler(async (req, res) => {
    const vendor = await vendorService.create(req.body, req.user.organizationId);
    res.status(201).json({ success: true, data: vendor, error: null });
  }),
];

const update = [
  updateVendorValidation,
  asyncHandler(async (req, res) => {
    const vendor = await vendorService.update(req.params.id, req.user.organizationId, req.body);
    res.json({ success: true, data: vendor, error: null });
  }),
];

const remove = asyncHandler(async (req, res) => {
  await vendorService.delete(req.params.id, req.user.organizationId);
  res.json({ success: true, data: null, error: null });
});

const listContacts = asyncHandler(async (req, res) => {
  const contacts = await vendorService.listContacts(req.params.id, req.user.organizationId);
  res.json({ success: true, data: contacts, error: null });
});

const createContact = [
  createContactValidation,
  asyncHandler(async (req, res) => {
    const contact = await vendorService.createContact(req.params.id, req.user.organizationId, req.body);
    res.status(201).json({ success: true, data: contact, error: null });
  }),
];

const updateContact = [
  updateContactValidation,
  asyncHandler(async (req, res) => {
    const contact = await vendorService.updateContact(req.params.id, req.params.contactId, req.user.organizationId, req.body);
    res.json({ success: true, data: contact, error: null });
  }),
];

const deleteContact = asyncHandler(async (req, res) => {
  await vendorService.deleteContact(req.params.id, req.params.contactId, req.user.organizationId);
  res.json({ success: true, data: null, error: null });
});

const listContracts = asyncHandler(async (req, res) => {
  const contracts = await vendorService.listContracts(req.params.id, req.user.organizationId);
  res.json({ success: true, data: contracts, error: null });
});

const createContract = [
  createContractValidation,
  asyncHandler(async (req, res) => {
    const contract = await vendorService.createContract(req.params.id, req.user.organizationId, req.body, req.user.id);
    res.status(201).json({ success: true, data: contract, error: null });
  }),
];

const updateContract = [
  updateContractValidation,
  asyncHandler(async (req, res) => {
    const contract = await vendorService.updateContract(req.params.id, req.params.contractId, req.user.organizationId, req.body);
    res.json({ success: true, data: contract, error: null });
  }),
];

const deleteContract = asyncHandler(async (req, res) => {
  await vendorService.deleteContract(req.params.id, req.params.contractId, req.user.organizationId);
  res.json({ success: true, data: null, error: null });
});

const listPurchaseOrders = asyncHandler(async (req, res) => {
  const result = await vendorService.listPurchaseOrders(req.params.id, req.user.organizationId, req.query);
  res.json({ success: true, data: result.data, meta: { total: result.total }, error: null });
});

module.exports = {
  list, get, create, update, remove,
  listContacts, createContact, updateContact, deleteContact,
  listContracts, createContract, updateContract, deleteContract,
  listPurchaseOrders,
};
