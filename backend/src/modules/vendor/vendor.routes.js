const express = require('express');
const router = express.Router();

const {
  list, get, create, update, remove,
  listContacts, createContact, updateContact, deleteContact,
  listContracts, createContract, updateContract, deleteContract,
  listPurchaseOrders,
} = require('./vendor.controller');

const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/authorize');
const { auditLog } = require('../../middleware/auditLog');
const { cacheAside } = require('../../middleware/cache');

router.use(authenticate);

router.get('/', authorize('vendor:read'), cacheAside({ key: (req) => `erp:${req.user.org}:vendors:page:${req.query.page || 1}`, ttl: 300 }), list);
router.get('/:id', authorize('vendor:read'), cacheAside({ key: (req) => `erp:${req.user.org}:vendor:${req.params.id}`, ttl: 600 }), get);
router.post('/', authorize('vendor:create'), auditLog('vendor.create', { auditableType: 'vendor' }), create);
router.patch('/:id', authorize('vendor:update'), auditLog('vendor.update', { auditableType: 'vendor', auditableId: (req) => req.params.id }), update);
router.delete('/:id', authorize('vendor:delete'), auditLog('vendor.delete', { auditableType: 'vendor', auditableId: (req) => req.params.id }), remove);

router.get('/:id/contacts', authorize('vendor:read'), cacheAside({ key: (req) => `erp:${req.user.org}:vendor:${req.params.id}:contacts`, ttl: 600 }), listContacts);
router.post('/:id/contacts', authorize('vendor:update'), auditLog('vendor.contact.create', { auditableType: 'vendor_contact', auditableId: (req) => req.params.id }), createContact);
router.patch('/:id/contacts/:contactId', authorize('vendor:update'), auditLog('vendor.contact.update', { auditableType: 'vendor_contact', auditableId: (req) => req.params.contactId }), updateContact);
router.delete('/:id/contacts/:contactId', authorize('vendor:update'), auditLog('vendor.contact.delete', { auditableType: 'vendor_contact', auditableId: (req) => req.params.contactId }), deleteContact);

router.get('/:id/contracts', authorize('vendor:read'), cacheAside({ key: (req) => `erp:${req.user.org}:vendor:${req.params.id}:contracts`, ttl: 600 }), listContracts);
router.post('/:id/contracts', authorize('vendor:update'), auditLog('vendor.contract.create', { auditableType: 'vendor_contract', auditableId: (req) => req.params.id }), createContract);
router.patch('/:id/contracts/:contractId', authorize('vendor:update'), auditLog('vendor.contract.update', { auditableType: 'vendor_contract', auditableId: (req) => req.params.contractId }), updateContract);
router.delete('/:id/contracts/:contractId', authorize('vendor:update'), auditLog('vendor.contract.delete', { auditableType: 'vendor_contract', auditableId: (req) => req.params.contractId }), deleteContract);

router.get('/:id/purchase-orders', authorize('vendor:read'), cacheAside({ key: (req) => `erp:${req.user.org}:vendor:${req.params.id}:purchase-orders:page:${req.query.page || 1}`, ttl: 120 }), listPurchaseOrders);

module.exports = router;
