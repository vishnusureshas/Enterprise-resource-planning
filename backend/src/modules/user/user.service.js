const bcrypt = require('bcrypt');
const userRepo = require('./user.repo');
const { BadRequestError, NotFoundError } = require('../../shared/errors');
const logger = require('../../config/logger');

const SALT_ROUNDS = 12;

class UserService {
  async list(organizationId, query) {
    const pagination = {
      limit: query.limit || 20,
      offset: query.offset || 0,
      sortBy: query.sortBy || 'created_at',
      sortOrder: query.sortOrder || 'DESC',
    };

    const { data, total } = await userRepo.findAll(organizationId, {
      ...pagination,
      search: query.search,
      status: query.status,
      role: query.role,
    });

    const users = data.map(u => ({
      id: u.id,
      email: u.email,
      firstName: u.first_name,
      lastName: u.last_name,
      phone: u.phone,
      avatarUrl: u.avatar_url,
      status: u.status,
      mfaEnabled: u.mfa_enabled,
      roles: Array.isArray(u.roles) ? u.roles.map(r => r.name || r) : [],
      createdAt: u.created_at,
      updatedAt: u.updated_at,
      lastLogin: u.last_login,
    }));

    return { data: users, total, ...pagination };
  }

  async getById(userId, organizationId) {
    const user = await userRepo.findById(userId, organizationId);
    if (!user) throw new NotFoundError('User not found');

    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      avatarUrl: user.avatar_url,
      status: user.status,
      mfaEnabled: user.mfa_enabled,
      roles: Array.isArray(user.roles) ? user.roles.map(r => r.name || r) : [],
      permissions: user.permissions,
      organizationId: user.organization_id,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      lastLogin: user.last_login,
    };
  }

  async create(data, organizationId) {
    const existing = await userRepo.findByEmail(data.email);
    if (existing) throw new BadRequestError('Email already in use');

    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
    const user = await userRepo.create({
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
    }, organizationId);

    if (data.roleIds && data.roleIds.length > 0) {
      await userRepo.setRoles(user.id, data.roleIds);
    }

    const roles = await userRepo.getRoles(user.id);
    const permissions = await userRepo.getPermissions(user.id);

    logger.info('User created', { userId: user.id, organizationId });

    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      status: user.status,
      mfaEnabled: user.mfa_enabled,
      roles: roles.map(r => r.name || r),
      permissions,
      createdAt: user.created_at,
    };
  }

  async update(userId, organizationId, data) {
    const existing = await userRepo.findById(userId, organizationId);
    if (!existing) throw new NotFoundError('User not found');

    const updateData = {};
    if (data.firstName !== undefined) updateData.first_name = data.firstName;
    if (data.lastName !== undefined) updateData.last_name = data.lastName;
    if (data.phone !== undefined) updateData.phone = data.phone || null;
    if (data.avatarUrl !== undefined) updateData.avatar_url = data.avatarUrl || null;
    if (data.status !== undefined) updateData.status = data.status;

    if (Object.keys(updateData).length > 0) {
      await userRepo.update(userId, organizationId, updateData);
    }

    if (data.roleIds !== undefined) {
      await userRepo.setRoles(userId, data.roleIds);
    }

    const roles = await userRepo.getRoles(userId);
    const permissions = await userRepo.getPermissions(userId);

    logger.info('User updated', { userId, organizationId });

    return this.getById(userId, organizationId);
  }

  async delete(userId, organizationId) {
    const existing = await userRepo.findById(userId, organizationId);
    if (!existing) throw new NotFoundError('User not found');

    await userRepo.softDelete(userId, organizationId);
    logger.info('User deleted', { userId, organizationId });

    return { success: true };
  }
}

module.exports = new UserService();
