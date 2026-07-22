const repo = require('./quality.repo');
const { NotFoundError, BadRequestError } = require('../../shared/errors');

class QualityService {
  // ─── Checklists ─────────────────────────────────────────────────────

  async listChecklists(organizationId, params) {
    return repo.findAllChecklists(organizationId, params);
  }

  async getChecklist(id, organizationId) {
    const checklist = await repo.findChecklistById(id, organizationId);
    if (!checklist) throw new NotFoundError('Checklist not found');
    return checklist;
  }

  async createChecklist(data, userId) {
    return repo.createChecklist(data, userId);
  }

  async updateChecklist(id, organizationId, data, userId) {
    const checklist = await repo.findChecklistById(id, organizationId);
    if (!checklist) throw new NotFoundError('Checklist not found');
    return repo.updateChecklist(id, organizationId, data, userId);
  }

  async deleteChecklist(id, organizationId, userId) {
    const result = await repo.deleteChecklist(id, organizationId, userId);
    if (!result) throw new NotFoundError('Checklist not found');
  }

  // ─── Inspections ────────────────────────────────────────────────────

  async listInspections(organizationId, params) {
    return repo.findAllInspections(organizationId, params);
  }

  async getInspection(id, organizationId) {
    const inspection = await repo.findInspectionById(id, organizationId);
    if (!inspection) throw new NotFoundError('Inspection not found');
    return inspection;
  }

  async createInspection(data, userId) {
    return repo.createInspection(data, userId);
  }

  async recordResults(id, organizationId, data, userId) {
    const inspection = await repo.findInspectionById(id, organizationId);
    if (!inspection) throw new NotFoundError('Inspection not found');
    if (inspection.status !== 'in_progress' && inspection.status !== 'pending') {
      throw new BadRequestError(`Cannot record results for inspection with status '${inspection.status}'`);
    }
    return repo.saveResults(id, organizationId, data, userId);
  }

  async updateInspectionStatus(id, organizationId, status, userId) {
    const inspection = await repo.findInspectionById(id, organizationId);
    if (!inspection) throw new NotFoundError('Inspection not found');
    if (inspection.status !== 'pending') {
      throw new BadRequestError(`Cannot start inspection with status '${inspection.status}'`);
    }
    return repo.updateInspectionStatus(id, organizationId, status, userId);
  }

  async deleteInspection(id, organizationId, userId) {
    const result = await repo.deleteInspection(id, organizationId, userId);
    if (!result) throw new NotFoundError('Inspection not found');
  }

  // ─── Criteria ───────────────────────────────────────────────────────

  async listCriteria(organizationId, params) {
    return repo.findAllCriteria(organizationId, params);
  }

  async getCriterion(id, organizationId) {
    const criterion = await repo.findCriterionById(id, organizationId);
    if (!criterion) throw new NotFoundError('Inspection criterion not found');
    return criterion;
  }

  async createCriterion(data, userId) {
    return repo.createCriterion(data, userId);
  }

  async updateCriterion(id, organizationId, data, userId) {
    const criterion = await repo.findCriterionById(id, organizationId);
    if (!criterion) throw new NotFoundError('Inspection criterion not found');
    return repo.updateCriterion(id, organizationId, data, userId);
  }

  async deleteCriterion(id, organizationId) {
    const result = await repo.deleteCriterion(id, organizationId);
    if (!result) throw new NotFoundError('Inspection criterion not found');
  }

  // ─── Reference Items (for dropdown) ───────────────────────────────

  async listReferenceItems(referenceType, organizationId) {
    return repo.findReferenceItems(referenceType, organizationId);
  }

  // ─── Reports ────────────────────────────────────────────────────────

  async getInspectionReport(referenceType, referenceId, organizationId) {
    return repo.findInspectionsByReference(referenceType, referenceId, organizationId);
  }
}

module.exports = new QualityService();
