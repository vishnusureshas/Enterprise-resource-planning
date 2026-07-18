const UserStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
  SUSPENDED: 'suspended',
  DELETED: 'deleted',
};

const SessionStatus = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  REVOKED: 'revoked',
};

const PermissionAction = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  APPROVE: 'approve',
  EXPORT: 'export',
};

const Resource = {
  USER: 'user',
  ROLE: 'role',
  ORGANIZATION: 'organization',
  INVENTORY: 'inventory',
  ORDER: 'order',
  PROCUREMENT: 'procurement',
  FINANCE: 'finance',
  CRM: 'crm',
  HR: 'hr',
  REPORT: 'report',
  SETTINGS: 'settings',
  AUDIT: 'audit',
};

const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
};

const CACHE_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 600, // 10 minutes
  VERY_LONG: 3600, // 1 hour
};

module.exports = {
  UserStatus,
  SessionStatus,
  PermissionAction,
  Resource,
  HTTP_STATUS,
  CACHE_TTL,
};