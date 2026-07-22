const express = require('express');
const router = express.Router();

const {
  listChecklists, getChecklist, createChecklist, updateChecklist, deleteChecklist,
  listInspections, getInspection, createInspection, recordResults, deleteInspection,
  listCriteria, getCriterion, createCriterion, updateCriterion, deleteCriterion,
  listReferenceItems,
  getInspectionReport,
} = require('./quality.controller');

const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/authorize');
const { auditLog } = require('../../middleware/auditLog');
const { validate } = require('../../middleware/validate');
const {
  createChecklistSchema, updateChecklistSchema,
  createInspectionSchema, recordResultSchema,
  createCriterionSchema, updateCriterionSchema,
} = require('./quality.validation');

router.use(authenticate);

// Checklists
router.get('/checklists', authorize('quality:read'), listChecklists);
router.get('/checklists/:id', authorize('quality:read'), getChecklist);
router.post('/checklists', authorize('quality:create'), validate(createChecklistSchema), auditLog('quality.checklist.create', { auditableType: 'quality_checklist' }), createChecklist);
router.patch('/checklists/:id', authorize('quality:update'), validate(updateChecklistSchema), auditLog('quality.checklist.update', { auditableType: 'quality_checklist', auditableId: (req) => req.params.id }), updateChecklist);
router.delete('/checklists/:id', authorize('quality:delete'), auditLog('quality.checklist.delete', { auditableType: 'quality_checklist', auditableId: (req) => req.params.id }), deleteChecklist);

// Inspections
router.get('/inspections', authorize('quality:read'), listInspections);
router.get('/inspections/:id', authorize('quality:read'), getInspection);
router.post('/inspections', authorize('quality:create'), validate(createInspectionSchema), auditLog('quality.inspection.create', { auditableType: 'quality_inspection' }), createInspection);
router.post('/inspections/:id/results', authorize('quality:update'), validate(recordResultSchema), auditLog('quality.inspection.record', { auditableType: 'quality_inspection', auditableId: (req) => req.params.id }), recordResults);
router.delete('/inspections/:id', authorize('quality:delete'), auditLog('quality.inspection.delete', { auditableType: 'quality_inspection', auditableId: (req) => req.params.id }), deleteInspection);

// Criteria
router.get('/criteria', authorize('quality:read'), listCriteria);
router.get('/criteria/:id', authorize('quality:read'), getCriterion);
router.post('/criteria', authorize('quality:create'), validate(createCriterionSchema), auditLog('quality.criteria.create', { auditableType: 'quality_criterion' }), createCriterion);
router.patch('/criteria/:id', authorize('quality:update'), validate(updateCriterionSchema), auditLog('quality.criteria.update', { auditableType: 'quality_criterion', auditableId: (req) => req.params.id }), updateCriterion);
router.delete('/criteria/:id', authorize('quality:delete'), auditLog('quality.criteria.delete', { auditableType: 'quality_criterion', auditableId: (req) => req.params.id }), deleteCriterion);

// Reference Items (for dropdown selection)
router.get('/references/:referenceType', authorize('quality:read'), listReferenceItems);

// Reports
router.get('/reports/:referenceType/:referenceId', authorize('quality:read'), getInspectionReport);

module.exports = router;
