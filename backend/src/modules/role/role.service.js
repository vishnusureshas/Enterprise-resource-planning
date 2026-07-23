const roleRepo = require('./role.repo');
const { BadRequestError, NotFoundError } = require('../../shared/errors');
const logger = require('../../config/logger');

class RoleService {
  async list(organizationId) {
    const roles = await roleRepo.findAll(organizationId);
    return roles.map(r => ({
      id: r.id,
      name: r.name,
      description: r.description,
      permissions: r.permissions || [],
      userCount: r.user_count,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  async getById(roleId, organizationId) {
    const role = await roleRepo.findById(roleId, organizationId);
    if (!role) throw new NotFoundError('Role not found');

    return {
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: role.permissions,
      createdAt: role.created_at,
      updatedAt: role.updated_at,
    };
  }

  async create(data, organizationId) {
    const existing = await roleRepo.findByName(data.name, organizationId);
    if (existing) throw new BadRequestError('Role name already exists in this organization');

    const role = await roleRepo.create(data, organizationId);

    if (data.permissionIds && data.permissionIds.length > 0) {
      await roleRepo.setPermissions(role.id, data.permissionIds);
    }

    const permissions = await roleRepo.getPermissions(role.id);

    logger.info('Role created', { roleId: role.id, organizationId });

    return {
      id: role.id,
      name: role.name,
      description: role.description,
      permissions,
      createdAt: role.created_at,
      updatedAt: role.updated_at || role.created_at,
    };
  }

  async update(roleId, organizationId, data) {
    const existing = await roleRepo.findById(roleId, organizationId);
    if (!existing) throw new NotFoundError('Role not found');

    if (data.name) {
      const duplicate = await roleRepo.findByName(data.name, organizationId);
      if (duplicate && duplicate.id !== roleId) {
        throw new BadRequestError('Role name already exists in this organization');
      }
    }

    const updateData = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;

    if (Object.keys(updateData).length > 0) {
      await roleRepo.update(roleId, organizationId, updateData);
    }

    if (data.permissionIds !== undefined) {
      await roleRepo.setPermissions(roleId, data.permissionIds);
    }

    const permissions = await roleRepo.getPermissions(roleId);

    logger.info('Role updated', { roleId, organizationId });

    return this.getById(roleId, organizationId);
  }

  async delete(roleId, organizationId) {
    const existing = await roleRepo.findById(roleId, organizationId);
    if (!existing) throw new NotFoundError('Role not found');

    // Prevent deleting admin role
    if (existing.name === 'admin') {
      throw new BadRequestError('Cannot delete the admin role');
    }

    await roleRepo.delete(roleId, organizationId);
    logger.info('Role deleted', { roleId, organizationId });

    return { success: true };
  }

  async listPermissions() {
    return roleRepo.getAllPermissions();
  }
}

module.exports = new RoleService();
