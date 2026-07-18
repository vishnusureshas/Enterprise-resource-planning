const orgService = require('./org.service');
const { asyncHandler } = require('../../middleware/errorHandler');
const { validate } = require('../../middleware/validate');
const schemas = require('./org.validation');

const updateValidation = validate(schemas.update);
const updateSettingsValidation = validate(schemas.updateSettings);

const getCurrent = asyncHandler(async (req, res) => {
  const org = await orgService.getById(req.user.organizationId);
  res.json({ success: true, data: org, error: null });
});

const update = [
  updateValidation,
  asyncHandler(async (req, res) => {
    const org = await orgService.update(req.user.organizationId, req.body);
    res.json({ success: true, data: org, error: null });
  }),
];

const getSettings = asyncHandler(async (req, res) => {
  const settings = await orgService.getSettings(req.user.organizationId);
  res.json({ success: true, data: settings, error: null });
});

const updateSettings = [
  updateSettingsValidation,
  asyncHandler(async (req, res) => {
    const settings = await orgService.updateSettings(req.user.organizationId, req.body);
    res.json({ success: true, data: settings, error: null });
  }),
];

const getStats = asyncHandler(async (req, res) => {
  const stats = await orgService.getStats(req.user.organizationId);
  res.json({ success: true, data: stats, error: null });
});

module.exports = {
  getCurrent,
  update,
  getSettings,
  updateSettings,
  getStats,
  updateValidation,
  updateSettingsValidation,
};
