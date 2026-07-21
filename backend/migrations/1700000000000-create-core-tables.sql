-- Migration: Create core tables for authentication and multi-tenancy
-- Version: 1.0.0
-- Description: Creates organizations, users, roles, permissions, and related tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations (multi-tenancy root)
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_status ON organizations(status) WHERE deleted_at IS NULL;

-- Roles
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, name)
);

CREATE INDEX idx_roles_organization ON roles(organization_id);

-- Permissions
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    category VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Role-Permissions junction
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- Users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    avatar_url VARCHAR(500),
    status VARCHAR(50) DEFAULT 'active',
    last_login TIMESTAMPTZ,
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMPTZ,
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_secret VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    UNIQUE(organization_id, email)
);

CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status) WHERE deleted_at IS NULL;

-- User-Roles junction
CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES users(id),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, role_id)
);

CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role_id);

-- User Sessions (for refresh token tracking)
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID NOT NULL,
    user_agent TEXT,
    ip_address INET,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_session ON user_sessions(session_id);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at) WHERE revoked = FALSE;

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,
    changes JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_org ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- System default permissions
INSERT INTO permissions (name, description, category) VALUES
-- Organization
('organization:read', 'View organization details', 'organization'),
('organization:update', 'Update organization settings', 'organization'),
('organization:delete', 'Delete organization', 'organization'),

-- Users
('user:read', 'View users', 'users'),
('user:create', 'Create users', 'users'),
('user:update', 'Update users', 'users'),
('user:delete', 'Delete users', 'users'),
('user:manage_roles', 'Manage user roles', 'users'),

-- Roles & Permissions
('role:read', 'View roles', 'roles'),
('role:create', 'Create roles', 'roles'),
('role:update', 'Update roles', 'roles'),
('role:delete', 'Delete roles', 'roles'),

-- Inventory
('inventory:read', 'View inventory', 'inventory'),
('inventory:create', 'Create inventory items', 'inventory'),
('inventory:update', 'Update inventory items', 'inventory'),
('inventory:delete', 'Delete inventory items', 'inventory'),
('inventory:transfer', 'Transfer stock between warehouses', 'inventory'),
('inventory:adjust', 'Adjust stock quantities', 'inventory'),

-- Warehouses
('warehouse:read', 'View warehouses', 'warehouses'),
('warehouse:create', 'Create warehouses', 'warehouses'),
('warehouse:update', 'Update warehouses', 'warehouses'),
('warehouse:delete', 'Delete warehouses', 'warehouses'),

-- Sales Orders
('order:read', 'View sales orders', 'orders'),
('order:create', 'Create sales orders', 'orders'),
('order:update', 'Update sales orders', 'orders'),
('order:delete', 'Delete sales orders', 'orders'),
('order:approve', 'Approve sales orders', 'orders'),
('order:cancel', 'Cancel sales orders', 'orders'),

-- Purchase Orders
('procurement:read', 'View purchase orders', 'procurement'),
('procurement:create', 'Create purchase orders', 'procurement'),
('procurement:update', 'Update purchase orders', 'procurement'),
('procurement:delete', 'Delete purchase orders', 'procurement'),
('procurement:approve', 'Approve purchase orders', 'procurement'),
('procurement:receive', 'Receive goods', 'procurement'),

-- Customers
('customer:read', 'View customers', 'customers'),
('customer:create', 'Create customers', 'customers'),
('customer:update', 'Update customers', 'customers'),
('customer:delete', 'Delete customers', 'customers'),

-- Vendors
('vendor:read', 'View vendors', 'vendors'),
('vendor:create', 'Create vendors', 'vendors'),
('vendor:update', 'Update vendors', 'vendors'),
('vendor:delete', 'Delete vendors', 'vendors'),

-- Finance
('finance:read', 'View finance data', 'finance'),
('finance:journal:create', 'Create journal entries', 'finance'),
('finance:journal:post', 'Post journal entries', 'finance'),
('finance:account:read', 'View chart of accounts', 'finance'),
('finance:account:create', 'Create accounts', 'finance'),
('finance:account:update', 'Update accounts', 'finance'),
('finance:report:read', 'View financial reports', 'finance'),

-- CRM
('crm:read', 'View CRM data', 'crm'),
('crm:lead:create', 'Create leads', 'crm'),
('crm:lead:update', 'Update leads', 'crm'),
('crm:opportunity:create', 'Create opportunities', 'crm'),
('crm:opportunity:update', 'Update opportunities', 'crm'),

-- HR
('hr:read', 'View HR data', 'hr'),
('hr:employee:create', 'Create employees', 'hr'),
('hr:employee:update', 'Update employees', 'hr'),
('hr:payroll:run', 'Run payroll', 'hr'),

-- Reports
('report:read', 'View reports', 'reports'),
('report:export', 'Export reports', 'reports'),

-- Settings
('settings:read', 'View settings', 'settings'),
('settings:update', 'Update settings', 'settings'),

-- Admin
('admin:read', 'View admin panel', 'admin'),
('admin:user:manage', 'Manage users (super admin)', 'admin'),
('admin:org:manage', 'Manage organizations (super admin)', 'admin')
ON CONFLICT (name) DO NOTHING;

-- System default roles (will be created per organization via seed)