const { query: db, transaction } = require('../../config/db');
const { NotFoundError, ConflictError } = require('../../shared/errors');
const logger = require('../../config/logger');

class AuthRepository {
  // Find user by email with organization
  async findByEmail(email) {
    const result = await db.query(
      `SELECT u.*, o.name as organization_name
       FROM users u
       JOIN organizations o ON o.id = u.organization_id
       WHERE u.email = $1 AND u.deleted_at IS NULL AND o.deleted_at IS NULL`,
      [email]
    );
    return result.rows[0];
  }

  // Find user by ID with roles and permissions
  async findByIdWithPermissions(userId) {
    const result = await db.query(
      `SELECT u.*, o.name as organization_name,
              COALESCE(
                json_agg(DISTINCT jsonb_build_object(
                  'id', r.id,
                  'name', r.name,
                  'description', r.description
                )) FILTER (WHERE r.id IS NOT NULL),
                '[]'
              ) as roles,
              COALESCE(
                json_agg(DISTINCT jsonb_build_object(
                  'id', p.id,
                  'name', p.name,
                  'category', p.category
                )) FILTER (WHERE p.id IS NOT NULL),
                '[]'
              ) as permissions
       FROM users u
       JOIN organizations o ON o.id = u.organization_id
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r ON r.id = ur.role_id
       LEFT JOIN role_permissions rp ON rp.role_id = r.id
       LEFT JOIN permissions p ON p.id = rp.permission_id
       WHERE u.id = $1 AND u.deleted_at IS NULL AND o.deleted_at IS NULL
       GROUP BY u.id, o.name`,
      [userId]
    );
    return result.rows[0];
  }

  // Create user with organization
  async createUserWithOrg(userData, organizationName) {
    return transaction(async (client) => {
      // Create organization
      const orgResult = await client.query(
        `INSERT INTO organizations (name, created_at, updated_at)
         VALUES ($1, NOW(), NOW()) RETURNING id`,
        [organizationName]
      );
      const organizationId = orgResult.rows[0].id;

      // Create user
      const userResult = await client.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, organization_id, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, 'active', NOW(), NOW())
         RETURNING id, email, first_name, last_name, organization_id, created_at`,
        [userData.email, userData.passwordHash, userData.firstName, userData.lastName, organizationId]
      );
      const user = userResult.rows[0];

      // Assign admin role
      const roleResult = await client.query(
        `INSERT INTO roles (name, organization_id, created_at, updated_at)
         VALUES ('admin', $1, NOW(), NOW()) RETURNING id`,
        [organizationId]
      );
      const roleId = roleResult.rows[0].id;

      await client.query(
        `INSERT INTO user_roles (user_id, role_id, assigned_at)
         VALUES ($1, $2, NOW())`,
        [user.id, roleId]
      );

      return { ...user, organizationId };
    });
  }

  // Update last login
  async updateLastLogin(userId) {
    await db.query(
      `UPDATE users SET last_login = NOW() WHERE id = $1`,
      [userId]
    );
  }

  // Create session
  async createSession(userId, sessionId, userAgent, ipAddress, expiresAt) {
    await db.query(
      `INSERT INTO user_sessions (user_id, session_id, user_agent, ip_address, expires_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, sessionId, userAgent, ipAddress, expiresAt]
    );
  }

  // Get session
  async getSession(sessionId) {
    const result = await db.query(
      `SELECT * FROM user_sessions WHERE session_id = $1 AND revoked = FALSE AND expires_at > NOW()`,
      [sessionId]
    );
    return result.rows[0];
  }

  // Revoke session
  async revokeSession(sessionId) {
    await db.query(
      `UPDATE user_sessions SET revoked = TRUE WHERE session_id = $1`,
      [sessionId]
    );
  }

  // Revoke all sessions for user
  async revokeAllSessions(userId) {
    await db.query(
      `UPDATE user_sessions SET revoked = TRUE WHERE user_id = $1 AND revoked = FALSE`,
      [userId]
    );
  }

  // Update password
  async updatePassword(userId, passwordHash) {
    await db.query(
      `UPDATE users SET password_hash = $1, updated_at = NOW(), password_reset_token = NULL, password_reset_expires = NULL
       WHERE id = $2`,
      [passwordHash, userId]
    );
  }

  // Set password reset token
  async setPasswordResetToken(email, token, expiresAt) {
    await db.query(
      `UPDATE users SET password_reset_token = $1, password_reset_expires = $2 WHERE email = $3`,
      [token, expiresAt, email]
    );
  }

  // Find by reset token
  async findByResetToken(token) {
    const result = await db.query(
      `SELECT * FROM users WHERE password_reset_token = $1 AND password_reset_expires > NOW() AND deleted_at IS NULL`,
      [token]
    );
    return result.rows[0];
  }

  // Update MFA
  async updateMFA(userId, enabled, secret = null) {
    if (secret) {
      await db.query(
        `UPDATE users SET mfa_enabled = $1, mfa_secret = $2, updated_at = NOW() WHERE id = $3`,
        [enabled, secret, userId]
      );
    } else {
      await db.query(
        `UPDATE users SET mfa_enabled = $1, mfa_secret = NULL, updated_at = NOW() WHERE id = $2`,
        [enabled, userId]
      );
    }
  }
}

module.exports = new AuthRepository();