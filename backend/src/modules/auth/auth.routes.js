const express = require('express');
const router = express.Router();

const {
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
} = require('./auth.controller');

const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/authorize');
const { auditLog } = require('../../middleware/auditLog');

// Public routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/refresh', refreshValidation, refresh);
router.post('/forgot-password', forgotPasswordValidation, forgotPassword);
router.post('/reset-password', resetPasswordValidation, resetPassword);

// Protected routes
router.post('/logout', authenticate, auditLog('auth.logout', { auditableType: 'session' }), logout);
router.post('/change-password', authenticate, auditLog('auth.change_password', { auditableType: 'user', auditableId: (req) => req.user?.id }), changePasswordValidation, changePassword);
router.post('/mfa/setup', authenticate, auditLog('auth.mfa_setup', { auditableType: 'user' }), setupMFA);
router.post('/mfa/verify', authenticate, verifyMFA);
router.post('/mfa/disable', authenticate, auditLog('auth.mfa_disable', { auditableType: 'user' }), disableMFA);
router.get('/me', authenticate, getProfile);
router.patch('/me', authenticate, auditLog('auth.update_profile', { auditableType: 'user' }), updateProfile);

module.exports = router;