const roleService = require('./role.service');
const { asyncHandler } = require('../../middleware/errorHandler');
const { validate } = require('../../middleware/validate');
const schemas = require('./role.validation');

const createValidation = validate(schemas.create);
const updateValidation = validate(schemas.update);
const assignUsersValidation = validate(schemas.assignUsers);

const list = asyncHandler(async (req, res) => {
  const roles = await roleService.list(req.user.organizationId);
  res.json({ success: true, data: roles, error: null });
});

const getById = asyncHandler(async (req, res) => {
  const role = await roleService.getById(req.params.id, req.user.organizationId);
  res.json({ success: true, data: role, error: null });
});

const create = [
  createValidation,
  asyncHandler(async (req, res) => {
    const role = await roleService.create(req.body, req.user.organizationId);
    res.status(201).json({ success: true, data: role, error: null });
  }),
];

const update = [
  updateValidation,
  asyncHandler(async (req, res) => {
    const role = await roleService.update(req.params.id, req.user.organizationId, req.body);
    res.json({ success: true, data: role, error: null });
  }),
];

const remove = asyncHandler(async (req, res) => {
  await roleService.delete(req.params.id, req.user.organizationId);
  res.json({ success: true, data: null, error: null });
});

const listPermissions = asyncHandler(async (req, res) => {
  const permissions = await roleService.listPermissions();
  res.json({ success: true, data: permissions, error: null });
});

module.exports = {
  list,
  getById,
  create,
  update,
  remove,
  listPermissions,
  createValidation,
  updateValidation,
  assignUsersValidation,
};
