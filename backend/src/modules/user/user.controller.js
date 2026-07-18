const userService = require('./user.service');
const { asyncHandler } = require('../../middleware/errorHandler');
const { validate } = require('../../middleware/validate');
const { paginate, buildPaginatedResponse } = require('../../middleware/pagination');
const schemas = require('./user.validation');

const createValidation = validate(schemas.create);
const updateValidation = validate(schemas.update);

const list = [
  paginate,
  asyncHandler(async (req, res) => {
    const result = await userService.list(req.user.organizationId, {
      ...req.pagination,
      search: req.query.search,
      status: req.query.status,
      role: req.query.role,
    });
    res.json(buildPaginatedResponse(result.data, result.total, req.pagination));
  }),
];

const getById = asyncHandler(async (req, res) => {
  const user = await userService.getById(req.params.id, req.user.organizationId);
  res.json({ success: true, data: user, error: null });
});

const create = [
  createValidation,
  asyncHandler(async (req, res) => {
    const user = await userService.create(req.body, req.user.organizationId);
    res.status(201).json({ success: true, data: user, error: null });
  }),
];

const update = [
  updateValidation,
  asyncHandler(async (req, res) => {
    const user = await userService.update(req.params.id, req.user.organizationId, req.body);
    res.json({ success: true, data: user, error: null });
  }),
];

const remove = asyncHandler(async (req, res) => {
  await userService.delete(req.params.id, req.user.organizationId);
  res.json({ success: true, data: null, error: null });
});

module.exports = {
  list,
  getById,
  create,
  update,
  remove,
  createValidation,
  updateValidation,
};
