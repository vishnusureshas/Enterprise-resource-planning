const bcrypt = require('bcrypt');
const { pool } = require('../src/config/db');

const SALT_ROUNDS = 12;

const permissions = [
  'organization:read', 'organization:update', 'organization:delete',
  'user:read', 'user:create', 'user:update', 'user:delete', 'user:manage_roles',
  'role:read', 'role:create', 'role:update', 'role:delete',
  'inventory:read', 'inventory:create', 'inventory:update', 'inventory:delete', 'inventory:transfer', 'inventory:adjust',
  'warehouse:read', 'warehouse:create', 'warehouse:update', 'warehouse:delete',
  'order:read', 'order:create', 'order:update', 'order:delete', 'order:approve', 'order:cancel',
  'procurement:read', 'procurement:create', 'procurement:update', 'procurement:delete', 'procurement:approve', 'procurement:receive',
  'customer:read', 'customer:create', 'customer:update', 'customer:delete',
  'vendor:read', 'vendor:create', 'vendor:update', 'vendor:delete',
  'finance:read', 'finance:journal:create', 'finance:journal:post', 'finance:account:read', 'finance:account:create', 'finance:account:update', 'finance:report:read',
  'crm:read', 'crm:lead:create', 'crm:lead:update', 'crm:opportunity:create', 'crm:opportunity:update',
  'hr:read', 'hr:employee:create', 'hr:employee:update', 'hr:payroll:run',
  'report:read', 'report:export',
  'settings:read', 'settings:update',
  'admin:read', 'admin:user:manage', 'admin:org:manage',
];

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check if already seeded
    const existing = await client.query('SELECT id FROM organizations LIMIT 1');
    if (existing.rows.length > 0) {
      console.log('⚠️  Database already has data. Skipping seed.');
      await client.query('ROLLBACK');
      return;
    }

    // 1. Create default organization
    const org = await client.query(
      `INSERT INTO organizations (name, slug, status) VALUES ($1, $2, $3) RETURNING id`,
      ['Default Organization', 'default', 'active']
    );
    const orgId = org.rows[0].id;
    console.log('✅ Created organization:', orgId);

    // 2. Create default admin user (password: admin123)
    const passwordHash = await bcrypt.hash('admin123', SALT_ROUNDS);
    const user = await client.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, organization_id, status)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      ['admin@erp.com', passwordHash, 'Super', 'Admin', orgId, 'active']
    );
    const userId = user.rows[0].id;
    console.log('✅ Created admin user:', userId);

    // 3. Ensure permissions exist
    for (const perm of permissions) {
      await client.query(
        `INSERT INTO permissions (name, description, category)
         VALUES ($1, $2, $3) ON CONFLICT (name) DO NOTHING`,
        [perm, perm.replace(/_/g, ' ').replace(/:/g, ' - '), perm.split(':')[0]]
      );
    }
    console.log('✅ Permissions synced');

    // 4. Get all permission IDs
    const allPerms = await client.query('SELECT id FROM permissions');
    const allPermIds = allPerms.rows.map(r => r.id);

    // 5. Create admin role with all permissions
    const adminRole = await client.query(
      `INSERT INTO roles (organization_id, name, description, is_system)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [orgId, 'Admin', 'Full system access', true]
    );
    const adminRoleId = adminRole.rows[0].id;

    for (const permId of allPermIds) {
      await client.query(
        `INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [adminRoleId, permId]
      );
    }
    console.log('✅ Created Admin role with all permissions');

    // 6. Create manager role with read/write permissions (no admin/delete)
    const managerPerms = await client.query(
      `SELECT id FROM permissions WHERE name NOT LIKE 'admin:%' AND name NOT LIKE '%:delete'`
    );
    const managerRole = await client.query(
      `INSERT INTO roles (organization_id, name, description, is_system)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [orgId, 'Manager', 'Read and write access (no delete)', true]
    );
    const managerRoleId = managerRole.rows[0].id;

    for (const perm of managerPerms.rows) {
      await client.query(
        `INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [managerRoleId, perm.id]
      );
    }
    console.log('✅ Created Manager role');

    // 7. Create viewer role with read-only permissions
    const viewerPerms = await client.query(
      `SELECT id FROM permissions WHERE name LIKE '%:read' OR name IN ('report:read', 'report:export')`
    );
    const viewerRole = await client.query(
      `INSERT INTO roles (organization_id, name, description, is_system)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [orgId, 'Viewer', 'Read-only access', true]
    );
    const viewerRoleId = viewerRole.rows[0].id;

    for (const perm of viewerPerms.rows) {
      await client.query(
        `INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [viewerRoleId, perm.id]
      );
    }
    console.log('✅ Created Viewer role');

    // 8. Assign admin role to admin user
    await client.query(
      `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [userId, adminRoleId]
    );
    console.log('✅ Assigned Admin role to admin user');

    await client.query('COMMIT');

    console.log('');
    console.log('🎉 Seed completed successfully!');
    console.log('   Email:    admin@erp.com');
    console.log('   Password: admin123');
    console.log('');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(() => process.exit(1));
