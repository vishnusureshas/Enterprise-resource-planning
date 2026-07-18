const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const { redis } = require('../../config/redis');
const db = require('../../config/db');
const logger = require('../../config/logger');
const env = require('../../config/env');
const {
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
} = require('../../shared/errors');

// Constants
const SALT_ROUNDS = 12;
const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL_DAYS = 7;
const REFRESH_STORE_PREFIX = 'refresh';
const BLACKLIST_PREFIX = 'blacklist';
const MFA_SETUP_PREFIX = 'mfa_setup';

class AuthService {
  constructor() {
    this.saltRounds = SALT_ROUNDS;
  }

  // Generate access token
  generateAccessToken(user, sessionId) {
    const payload = {
      userId: user.id,
      orgId: user.organization_id,
      email: user.email,
      roles: user.roles || [],
      permissions: user.permissions || [],
      sessionId,
    };
    return jwt.sign(payload, env.jwt.secret, { expiresIn: ACCESS_TOKEN_TTL });
  }

  // Generate refresh token
  generateRefreshToken() {
    return uuidv4();
  }

  // Store refresh token in Redis
  async storeRefreshToken(userId, sessionId, refreshToken) {
    const key = `${REFRESH_STORE_PREFIX}:${userId}:${sessionId}`;
    const hashedToken = await bcrypt.hash(refreshToken, this.saltRounds);
    const ttl = REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60;
    await redis.setex(key, ttl, hashedToken);
  }

  // Verify refresh token
  async verifyRefreshToken(userId, sessionId, refreshToken) {
    const key = `${REFRESH_STORE_PREFIX}:${userId}:${sessionId}`;
    const storedHash = await redis.get(key);
    if (!storedHash) return false;
    return bcrypt.compare(refreshToken, storedHash);
  }

  // Revoke refresh token
  async revokeRefreshToken(userId, sessionId) {
    const key = `${REFRESH_STORE_PREFIX}:${userId}:${sessionId}`;
    await redis.del(key);
  }

  // Revoke all refresh tokens for user
  async revokeAllRefreshTokens(userId) {
    const pattern = `${REFRESH_STORE_PREFIX}:${userId}:*`;
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }

  // Blacklist access token
  async blacklistToken(token, ttl) {
    const key = `${BLACKLIST_PREFIX}:${token}`;
    await redis.setex(key, ttl, '1');
  }

  // Register new user with organization
  async register(data) {
    const { email, password, firstName, lastName, organizationName } = data;

    // Check if email already exists
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rowCount > 0) {
      throw new BadRequestError('Email already registered');
    }

    return db.transaction(async (client) => {
      // Create organization
      const slug = organizationName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      const orgResult = await client.query(
        `INSERT INTO organizations (name, slug, created_at, updated_at)
         VALUES ($1, $2, NOW(), NOW()) RETURNING id`,
        [organizationName, slug]
      );
      const organizationId = orgResult.rows[0].id;

      // Hash password
      const passwordHash = await bcrypt.hash(password, this.saltRounds);

      // Create user
      const userResult = await client.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, organization_id, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, 'active', NOW(), NOW()) RETURNING id, email, first_name, last_name, organization_id, created_at`,
        [email, passwordHash, firstName, lastName, organizationId]
      );
      const user = userResult.rows[0];

      // Create admin role for this organization
      const roleResult = await client.query(
        `INSERT INTO roles (name, organization_id, created_at, updated_at)
         VALUES ('admin', $1, NOW(), NOW()) RETURNING id`,
        [organizationId]
      );
      const roleId = roleResult.rows[0].id;

      // Assign role to user
      await client.query(
        `INSERT INTO user_roles (user_id, role_id, assigned_at) VALUES ($1, $2, NOW())`,
        [user.id, roleId]
      );

      // Grant all permissions to admin role (basic set)
      const permissions = [
        'user:create', 'user:read', 'user:update', 'user:delete',
        'role:create', 'role:read', 'role:update', 'role:delete',
        'organization:read', 'organization:update',
        'inventory:create', 'inventory:read', 'inventory:update', 'inventory:delete',
        'order:create', 'order:read', 'order:update', 'order:delete', 'order:approve',
        'procurement:create', 'procurement:read', 'procurement:update', 'procurement:delete', 'procurement:approve',
        'finance:create', 'finance:read', 'finance:update', 'finance:delete', 'finance:approve',
        'report:read', 'report:export',
        'audit:read',
        'settings:read', 'settings:update',
      ];

      for (const permName of permissions) {
        await client.query(
          `INSERT INTO permissions (name, created_at) VALUES ($1, NOW())
           ON CONFLICT (name) DO NOTHING`,
          [permName]
        );
      }

      // Link permissions to role
      for (const permName of permissions) {
        const permResult = await client.query('SELECT id FROM permissions WHERE name = $1', [permName]);
        if (permResult.rowCount > 0) {
          await client.query(
            `INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)
             ON CONFLICT DO NOTHING`,
            [roleId, permResult.rows[0].id]
          );
        }
      }

      logger.info('User registered', { userId: user.id, organizationId });

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          organizationId: user.organization_id,
          roles: ['admin'],
          permissions: permissions,
        },
      };
    });
  }

  // Login user
  async login(email, password, rememberMe = false) {
    const result = await db.query(
      `SELECT u.*, o.name as organization_name
       FROM users u
       JOIN organizations o ON o.id = u.organization_id
       WHERE u.email = $1`,
      [email]
    );

    if (result.rowCount === 0) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const user = result.rows[0];

    if (user.status !== 'active') {
      throw new UnauthorizedError('Account is not active');
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Get user roles and permissions
    const rolesResult = await db.query(
      `SELECT r.name FROM roles r
       JOIN user_roles ur ON ur.role_id = r.id
       WHERE ur.user_id = $1`,
      [user.id]
    );

    const permissionsResult = await db.query(
      `SELECT DISTINCT p.name FROM permissions p
       JOIN role_permissions rp ON p.id = rp.permission_id
       JOIN roles r ON r.id = rp.role_id
       JOIN user_roles ur ON ur.role_id = r.id
       WHERE ur.user_id = $1`,
      [user.id]
    );

    const sessionId = uuidv4();
    const accessToken = this.generateAccessToken({
      id: user.id,
      organization_id: user.organization_id,
      email: user.email,
      roles: rolesResult.rows.map(r => r.name),
      permissions: permissionsResult.rows.map(p => p.name),
    }, sessionId);

    const refreshToken = this.generateRefreshToken();
    const expiryDays = rememberMe ? 30 : 7;
    await this.storeRefreshToken(user.id, sessionId, refreshToken);

    // Create session in DB
    const expiresAt = new Date(Date.now() + (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000);
    await db.query(
      `INSERT INTO user_sessions (user_id, session_id, ip_address, user_agent, expires_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [user.id, sessionId, null, null, expiresAt]
    );

    // Update last login
    await db.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    logger.info('User logged in', { userId: user.id, organizationId: user.organization_id });

    return {
      accessToken,
      refreshToken,
      expiresIn: ACCESS_TOKEN_TTL,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        organizationId: user.organization_id,
        organizationName: user.organization_name,
        roles: rolesResult.rows.map(r => r.name),
        permissions: permissionsResult.rows.map(p => p.name),
      },
    };
  }

  // Refresh access token
  async refresh(userId, refreshToken) {
    // Get user sessions from DB
    const sessions = await db.query(
      `SELECT session_id FROM user_sessions WHERE user_id = $1 AND revoked = FALSE AND expires_at > NOW()`,
      [userId]
    );

    if (sessions.rowCount === 0) {
      throw new UnauthorizedError('No active sessions');
    }

    // Try each session's refresh token
    for (const session of sessions.rows) {
      const valid = await this.verifyRefreshToken(userId, session.session_id, refreshToken);
      if (valid) {
        // Valid - rotate token
        const user = await this.getUserWithPermissions(userId);
        if (!user || user.status !== 'active') {
          throw new UnauthorizedError('User not found or inactive');
        }

        const newSessionId = uuidv4();
        const accessToken = this.generateAccessToken(user, newSessionId);
        const newRefreshToken = this.generateRefreshToken();

        // Revoke old, store new
        await this.revokeRefreshToken(userId, session.session_id);
        await this.storeRefreshToken(userId, newSessionId, newRefreshToken);

        // Update DB session
        await db.query(
          `UPDATE user_sessions SET session_id = $1, expires_at = $2 WHERE session_id = $3`,
          [newSessionId, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), session.session_id]
        );

        await db.query(
          `UPDATE user_sessions SET revoked = TRUE WHERE session_id = $1`,
          [session.session_id]
        );

        return {
          accessToken,
          refreshToken: newRefreshToken,
          expiresIn: ACCESS_TOKEN_TTL,
        };
      }
    }

    throw new UnauthorizedError('Invalid refresh token');
  }

  // Get user with permissions
  async getUserWithPermissions(userId) {
    const result = await db.query(
      `SELECT u.*, o.name as organization_name
       FROM users u
       JOIN organizations o ON o.id = u.organization_id
       WHERE u.id = $1`,
      [userId]
    );

    if (result.rowCount === 0) return null;

    const user = result.rows[0];

    const rolesResult = await db.query(
      `SELECT r.name FROM roles r
       JOIN user_roles ur ON ur.role_id = r.id
       WHERE ur.user_id = $1`,
      [userId]
    );

    const permissionsResult = await db.query(
      `SELECT DISTINCT p.name FROM permissions p
       JOIN role_permissions rp ON p.id = rp.permission_id
       JOIN roles r ON r.id = rp.role_id
       JOIN user_roles ur ON ur.role_id = r.id
       WHERE ur.user_id = $1`,
      [userId]
    );

    return {
      ...user,
      roles: rolesResult.rows.map(r => r.name),
      permissions: permissionsResult.rows.map(p => p.name),
    };
  }

  // Logout
  async logout(userId, sessionId, revokeAll = false) {
    if (revokeAll) {
      await this.revokeAllRefreshTokens(userId);
      await db.query(`UPDATE user_sessions SET revoked = TRUE WHERE user_id = $1`, [userId]);
    } else if (sessionId) {
      await this.revokeRefreshToken(userId, sessionId);
      await db.query(`UPDATE user_sessions SET revoked = TRUE WHERE session_id = $1`, [sessionId]);
    }

    logger.info('User logged out', { userId, revokeAll });
    return { success: true };
  }

  // Forgot password
  async forgotPassword(email) {
    const result = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (result.rowCount === 0) {
      // Don't reveal if email exists
      return { success: true };
    }

    const userId = result.rows[0].id;
    const resetToken = uuidv4();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.query(
      `UPDATE users SET password_reset_token = $1, password_reset_expires = $2 WHERE id = $3`,
      [resetToken, expiresAt, userId]
    );

    const resetUrl = `http://localhost:3000/auth/reset-password?token=${resetToken}`;

    logger.info('Password reset requested', { userId, email, resetUrl });

    if (process.env.NODE_ENV === 'development') {
      return { success: true, resetUrl };
    }

    return { success: true };
  }

  // Reset password
  async resetPassword(token, password) {
    const usersResult = await db.query(
      `SELECT id, password_reset_token, password_reset_expires
       FROM users
       WHERE password_reset_token IS NOT NULL AND password_reset_expires > NOW()`
    );

    let userId = null;
    for (const row of usersResult.rows) {
      if (token === row.password_reset_token) {
        userId = row.id;
        break;
      }
    }

    if (!userId) {
      throw new BadRequestError('Invalid or expired reset token');
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    await db.query(
      `UPDATE users SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL, updated_at = NOW() WHERE id = $2`,
      [passwordHash, userId]
    );

    // Revoke all sessions after password reset
    await this.revokeAllRefreshTokens(userId);
    await db.query(`UPDATE user_sessions SET revoked = TRUE WHERE user_id = $1`, [userId]);

    logger.info('Password reset completed', { userId });

    return { success: true };
  }

  // Change password
  async changePassword(userId, currentPassword, newPassword) {
    const result = await db.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
    if (result.rowCount === 0) {
      throw new NotFoundError('User not found');
    }

    const valid = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!valid) {
      throw new BadRequestError('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await db.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [passwordHash, userId]);

    // Revoke all sessions except current (optional)
    await this.revokeAllRefreshTokens(userId);
    await db.query(`UPDATE user_sessions SET revoked = TRUE WHERE user_id = $1`, [userId]);

    logger.info('Password changed', { userId });

    return { success: true };
  }

  // MFA Setup
  async setupMFA(userId) {
    const user = await this.getUserWithPermissions(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.mfa_enabled) {
      throw new BadRequestError('MFA is already enabled');
    }

    const secret = speakeasy.generateSecret({
      name: `ERP (${user.email})`,
      length: 32,
    });

    // Store secret temporarily (10 min)
    await redis.setex(`mfa_setup:${userId}`, 600, secret.base32);

    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    const backupCodes = Array.from({ length: 10 }, () => uuidv4().slice(0, 8).toUpperCase());

    return {
      secret: secret.base32,
      qrCode,
      backupCodes,
    };
  }

  // MFA Verify
  async verifyMFA(userId, token) {
    const secret = await redis.get(`mfa_setup:${userId}`);
    if (!secret) {
      throw new BadRequestError('MFA setup expired or not initiated');
    }

    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 1,
    });

    if (!verified) {
      throw new BadRequestError('Invalid MFA token');
    }

    // Enable MFA
    await db.query('UPDATE users SET mfa_enabled = TRUE, mfa_secret = $1, updated_at = NOW() WHERE id = $2', [secret, userId]);
    await redis.del(`mfa_setup:${userId}`);

    logger.info('MFA enabled', { userId });

    return { success: true };
  }

  // Disable MFA
  async disableMFA(userId, password) {
    const result = await db.query('SELECT password_hash, mfa_enabled FROM users WHERE id = $1', [userId]);
    if (result.rowCount === 0) {
      throw new NotFoundError('User not found');
    }

    if (!result.rows[0].mfa_enabled) {
      throw new BadRequestError('MFA is not enabled');
    }

    const valid = await bcrypt.compare(password, result.rows[0].password_hash);
    if (!valid) {
      throw new BadRequestError('Invalid password');
    }

    await db.query('UPDATE users SET mfa_enabled = FALSE, mfa_secret = NULL, updated_at = NOW() WHERE id = $1', [userId]);
    await redis.del(`mfa_setup:${userId}`);

    logger.info('MFA disabled', { userId });

    return { success: true };
  }

  // Get profile
  async getProfile(userId) {
    const user = await this.getUserWithPermissions(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      avatarUrl: user.avatar_url,
      mfaEnabled: user.mfa_enabled,
      roles: user.roles,
      permissions: user.permissions,
      organization: {
        id: user.organization_id,
        name: user.organization_name,
      },
      createdAt: user.created_at,
      lastLogin: user.last_login,
    };
  }

  // Update profile
  async updateProfile(userId, data) {
    const { firstName, lastName, phone, avatarUrl } = data;

    const result = await db.query(
      `UPDATE users SET
         first_name = COALESCE($1, first_name),
         last_name = COALESCE($2, last_name),
         phone = COALESCE($3, phone),
         avatar_url = COALESCE($4, avatar_url),
         updated_at = NOW()
       WHERE id = $5
       RETURNING id, email, first_name, last_name, phone, avatar_url`,
      [firstName, lastName, phone, avatarUrl, userId]
    );

    if (result.rowCount === 0) {
      throw new NotFoundError('User not found');
    }

    return result.rows[0];
  }
}

module.exports = new AuthService();