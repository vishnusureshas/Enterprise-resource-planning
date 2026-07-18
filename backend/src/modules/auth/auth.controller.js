const authService = require('./auth.service');
const { asyncHandler } = require('../../middleware/errorHandler');
const { validate } = require('../../middleware/validate');
const schemas = require('./auth.validation');

const registerValidation = validate(schemas.register);
const loginValidation = validate(schemas.login);
const refreshValidation = validate(schemas.refresh);
const forgotPasswordValidation = validate(schemas.forgotPassword);
const resetPasswordValidation = validate(schemas.resetPassword);
const changePasswordValidation = validate(schemas.changePassword);
const updateProfileValidation = validate(schemas.updateProfile);

const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  res.status(201).json({
    success: true,
    data: result,
    message: 'Registration successful',
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password, rememberMe } = req.body;
  const result = await authService.login(email, password, rememberMe);
  res.json({
    success: true,
    data: result,
    message: 'Login successful',
  });
});

const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  const result = await authService.refresh(req.user.id, refreshToken);
  res.json({
    success: true,
    data: result,
    message: 'Token refreshed',
  });
});

const logout = asyncHandler(async (req, res) => {
  const { revokeAll } = req.body;
  await authService.logout(req.user.id, req.user.sessionId, revokeAll);
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.forgotPassword(req.body.email);
  res.json({
    success: true,
    data: result,
  });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  const result = await authService.resetPassword(token, password);
  res.json({
    success: true,
    data: result,
  });
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const result = await authService.changePassword(req.user.id, currentPassword, newPassword);
  res.json({
    success: true,
    data: result,
  });
});

const setupMFA = asyncHandler(async (req, res) => {
  const result = await authService.setupMFA(req.user.id);
  res.json({
    success: true,
    data: result,
  });
});

const verifyMFA = asyncHandler(async (req, res) => {
  const { token } = req.body;
  const result = await authService.verifyMFA(req.user.id, token);
  res.json({
    success: true,
    data: result,
  });
});

const disableMFA = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const result = await authService.disableMFA(req.user.id, password);
  res.json({
    success: true,
    data: result,
  });
});

const getProfile = asyncHandler(async (req, res) => {
  const profile = await authService.getProfile(req.user.id);
  res.json({
    success: true,
    data: profile,
  });
});

const updateProfile = asyncHandler(async (req, res) => {
  const result = await authService.updateProfile(req.user.id, req.body);
  res.json({
    success: true,
    data: result,
    message: 'Profile updated successfully',
  });
});

module.exports = {
  register,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
  setupMFA,
  verifyMFA,
  disableMFA,
  getProfile,
  updateProfile,
  registerValidation,
  loginValidation,
  refreshValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  changePasswordValidation,
  updateProfileValidation,
};