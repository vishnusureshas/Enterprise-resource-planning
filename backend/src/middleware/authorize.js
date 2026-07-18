const authorize = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    // Admin has all permissions
    if (req.user.roles?.includes('admin') || req.user.isSuperAdmin) {
      return next();
    }

    // Check if user has at least one of the required permissions
    const userPermissions = req.user.permissions || [];
    const hasPermission = permissions.some((p) => userPermissions.includes(p));

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
          details: { required: permissions, granted: userPermissions },
        },
      });
    }

    next();
  };
};

// Helper to check organization membership
const requireOrgMembership = (req, res, next) => {
  if (!req.user?.organizationId) {
    return res.status(403).json({
      success: false,
      error: { code: 'NO_ORGANIZATION', message: 'User not associated with an organization' },
    });
  }
  next();
};

module.exports = { authorize, requireOrgMembership };