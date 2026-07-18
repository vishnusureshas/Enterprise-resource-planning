const express = require('express');
const router = express.Router();

const {
  list, get, create, update, remove,
  listAddresses, createAddress, updateAddress, deleteAddress,
  listContacts, createContact, updateContact, deleteContact,
  listNotes, createNote,
} = require('./customer.controller');

const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/authorize');
const { auditLog } = require('../../middleware/auditLog');

router.use(authenticate);

router.get('/', authorize('customer:read'), list);
router.get('/:id', authorize('customer:read'), get);
router.post('/', authorize('customer:create'), auditLog('customer.create', { auditableType: 'customer' }), create);
router.patch('/:id', authorize('customer:update'), auditLog('customer.update', { auditableType: 'customer', auditableId: (req) => req.params.id }), update);
router.delete('/:id', authorize('customer:delete'), auditLog('customer.delete', { auditableType: 'customer', auditableId: (req) => req.params.id }), remove);

router.get('/:id/addresses', authorize('customer:read'), listAddresses);
router.post('/:id/addresses', authorize('customer:update'), auditLog('customer.address.create', { auditableType: 'customer_address', auditableId: (req) => req.params.id }), createAddress);
router.patch('/:id/addresses/:addressId', authorize('customer:update'), auditLog('customer.address.update', { auditableType: 'customer_address', auditableId: (req) => req.params.addressId }), updateAddress);
router.delete('/:id/addresses/:addressId', authorize('customer:update'), auditLog('customer.address.delete', { auditableType: 'customer_address', auditableId: (req) => req.params.addressId }), deleteAddress);

router.get('/:id/contacts', authorize('customer:read'), listContacts);
router.post('/:id/contacts', authorize('customer:update'), auditLog('customer.contact.create', { auditableType: 'customer_contact', auditableId: (req) => req.params.id }), createContact);
router.patch('/:id/contacts/:contactId', authorize('customer:update'), auditLog('customer.contact.update', { auditableType: 'customer_contact', auditableId: (req) => req.params.contactId }), updateContact);
router.delete('/:id/contacts/:contactId', authorize('customer:update'), auditLog('customer.contact.delete', { auditableType: 'customer_contact', auditableId: (req) => req.params.contactId }), deleteContact);

router.get('/:id/notes', authorize('customer:read'), listNotes);
router.post('/:id/notes', authorize('customer:update'), auditLog('customer.note.create', { auditableType: 'customer_note', auditableId: (req) => req.params.id }), createNote);

module.exports = router;
