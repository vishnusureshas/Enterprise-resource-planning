const express = require('express');
const router = express.Router();

const {
  listChecklists, getChecklist, createChecklist, updateChecklist, deleteChecklist,
  listInspections, getInspection, createInspection, recordResults, updateInspectionStatus, deleteInspection,
  listCriteria, getCriterion, createCriterion, updateCriterion, deleteCriterion,
  listReferenceItems,
  getInspectionReport,
} = require('./quality.controller');

const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/authorize');
const { auditLog } = require('../../middleware/auditLog');
const { cacheAside } = require('../../middleware/cache');
const { validate } = require('../../middleware/validate');
const {
  createChecklistSchema, updateChecklistSchema,
  createInspectionSchema, recordResultSchema, updateInspectionStatusSchema,
  createCriterionSchema, updateCriterionSchema,
} = require('./quality.validation');

router.use(authenticate);

// Checklists
router.get('/checklists', authorize('quality:read'), cacheAside({ key: (req) => `erp:${req.user.org}:quality:checklists:page:${req.query.page || 1}`, ttl: 300 }), listChecklists);
router.get('/checklists/:id', authorize('quality:read'), cacheAside({ key: (req) => `erp:${req.user.org}:quality:checklist:${req.params.id}`, ttl: 300 }), getChecklist);
router.post('/checklists', authorize('quality:create'), validate(createChecklistSchema), auditLog('quality.checklist.create', { auditableType: 'quality_checklist' }), createChecklist);
router.patch('/checklists/:id', authorize('quality:update'), validate(updateChecklistSchema), auditLog('quality.checklist.update', { auditableType: 'quality_checklist', auditableId: (req) => req.params.id }), updateChecklist);
router.delete('/checklists/:id', authorize('quality:delete'), auditLog('quality.checklist.delete', { auditableType: 'quality_checklist', auditableId: (req) => req.params.id }), deleteChecklist);

// Inspections
router.get('/inspections', authorize('quality:read'), cacheAside({ key: (req) => `erp:${req.user.org}:quality:inspections:page:${req.query.page || 1}`, ttl: 120 }), listInspections);
router.get('/inspections/:id', authorize('quality:read'), cacheAside({ key: (req) => `erp:${req.user.org}:quality:inspection:${req.params.id}`, ttl: 120 }), getInspection);
router.post('/inspections', authorize('quality:create'), validate(createInspectionSchema), auditLog('quality.inspection.create', { auditableType: 'quality_inspection' }), createInspection);
router.post('/inspections/:id/results', authorize('quality:update'), validate(recordResultSchema), auditLog('quality.inspection.record', { auditableType: 'quality_inspection', auditableId: (req) => req.params.id }), recordResults);
router.patch('/inspections/:id/status', authorize('quality:update'), validate(updateInspectionStatusSchema), auditLog('quality.inspection.status', { auditableType: 'quality_inspection', auditableId: (req) => req.params.id }), updateInspectionStatus);
router.delete('/inspections/:id', authorize('quality:delete'), auditLog('quality.inspection.delete', { auditableType: 'quality_inspection', auditableId: (req) => req.params.id }), deleteInspection);

// Criteria
router.get('/criteria', authorize('quality:read'), cacheAside({ key: (req) => `erp:${req.user.org}:quality:criteria`, ttl: 600 }), listCriteria);
router.get('/criteria/:id', authorize('quality:read'), cacheAside({ key: (req) => `erp:${req.user.org}:quality:criterion:${req.params.id}`, ttl: 600 }), getCriterion);
router.post('/criteria', authorize('quality:create'), validate(createCriterionSchema), auditLog('quality.criteria.create', { auditableType: 'quality_criterion' }), createCriterion);
router.patch('/criteria/:id', authorize('quality:update'), validate(updateCriterionSchema), auditLog('quality.criteria.update', { auditableType: 'quality_criterion', auditableId: (req) => req.params.id }), updateCriterion);
router.delete('/criteria/:id', authorize('quality:delete'), auditLog('quality.criteria.delete', { auditableType: 'quality_criterion', auditableId: (req) => req.params.id }), deleteCriterion);

// Reference Items (for dropdown selection)
router.get('/references/:referenceType', authorize('quality:read'), cacheAside({ key: (req) => `erp:${req.user.org}:quality:references:${req.params.referenceType}`, ttl: 120 }), listReferenceItems);

// Reports
router.get('/reports/:referenceType/:referenceId', authorize('quality:read'), cacheAside({ key: (req) => `erp:${req.user.org}:quality:report:${req.params.referenceType}:${req.params.referenceId}`, ttl: 120 }), getInspectionReport);

module.exports = router;
