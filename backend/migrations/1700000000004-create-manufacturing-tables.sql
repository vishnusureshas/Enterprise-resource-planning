-- Migration: Create manufacturing/production tables
-- Version: 1.0.0
-- Description: Creates BOM, work orders, work centers, and related tables

-- Work Centers (machines/workstations)
CREATE TABLE IF NOT EXISTS work_centers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(100) NOT NULL,
    description TEXT,
    capacity_per_shift INTEGER DEFAULT 1,
    operating_hours JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    deleted_at TIMESTAMPTZ
);

-- Bill of Materials (recipe for finished goods)
CREATE TABLE IF NOT EXISTS bom (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    quantity NUMERIC(15,4) NOT NULL DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    deleted_at TIMESTAMPTZ
);

-- BOM Items (each raw material/component in the BOM)
CREATE TABLE IF NOT EXISTS bom_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bom_id UUID NOT NULL REFERENCES bom(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity NUMERIC(15,4) NOT NULL,
    unit_cost NUMERIC(15,2),
    sequence INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Work Orders (production runs)
CREATE TABLE IF NOT EXISTS work_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    work_order_number VARCHAR(50) NOT NULL,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    bom_id UUID REFERENCES bom(id),
    work_center_id UUID REFERENCES work_centers(id),
    quantity NUMERIC(15,4) NOT NULL,
    quantity_produced NUMERIC(15,4) DEFAULT 0,
    quantity_scrapped NUMERIC(15,4) DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    priority VARCHAR(20) DEFAULT 'medium',
    start_date TIMESTAMPTZ,
    due_date TIMESTAMPTZ,
    completed_date TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    deleted_at TIMESTAMPTZ
);

-- Work Order Operations (steps within a work order)
CREATE TABLE IF NOT EXISTS work_order_operations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    sequence INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    work_center_id UUID REFERENCES work_centers(id),
    planned_duration_minutes INTEGER,
    actual_duration_minutes INTEGER,
    status VARCHAR(50) DEFAULT 'pending',
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Work Order Consumptions (raw materials used during production)
CREATE TABLE IF NOT EXISTS work_order_consumptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity_planned NUMERIC(15,4) NOT NULL,
    quantity_actual NUMERIC(15,4),
    warehouse_stock_id UUID REFERENCES warehouse_stock(id),
    unit_cost NUMERIC(15,2),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- Work Order Outputs (finished goods from production)
CREATE TABLE IF NOT EXISTS work_order_outputs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity NUMERIC(15,4) NOT NULL,
    warehouse_stock_id UUID REFERENCES warehouse_stock(id),
    batch_number VARCHAR(100),
    is_defective BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_work_centers_org ON work_centers(organization_id);
CREATE INDEX IF NOT EXISTS idx_work_centers_code ON work_centers(organization_id, code);

CREATE INDEX IF NOT EXISTS idx_bom_org ON bom(organization_id);
CREATE INDEX IF NOT EXISTS idx_bom_product ON bom(product_id);
CREATE INDEX IF NOT EXISTS idx_bom_active ON bom(organization_id, is_active) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_bom_items_bom ON bom_items(bom_id);
CREATE INDEX IF NOT EXISTS idx_bom_items_product ON bom_items(product_id);

CREATE INDEX IF NOT EXISTS idx_work_orders_org ON work_orders(organization_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_product ON work_orders(product_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_work_orders_date ON work_orders(organization_id, start_date, due_date);
CREATE INDEX IF NOT EXISTS idx_work_orders_number ON work_orders(organization_id, work_order_number);

CREATE INDEX IF NOT EXISTS idx_wo_operations_order ON work_order_operations(work_order_id);
CREATE INDEX IF NOT EXISTS idx_wo_operations_center ON work_order_operations(work_center_id);

CREATE INDEX IF NOT EXISTS idx_wo_consumptions_order ON work_order_consumptions(work_order_id);
CREATE INDEX IF NOT EXISTS idx_wo_consumptions_product ON work_order_consumptions(product_id);

CREATE INDEX IF NOT EXISTS idx_wo_outputs_order ON work_order_outputs(work_order_id);
CREATE INDEX IF NOT EXISTS idx_wo_outputs_product ON work_order_outputs(product_id);

-- Manufacturing permissions
INSERT INTO permissions (name, description, category) VALUES
    ('manufacturing:read', 'View manufacturing/BOM/work orders', 'manufacturing'),
    ('manufacturing:create', 'Create BOM and work orders', 'manufacturing'),
    ('manufacturing:update', 'Update BOM and work orders', 'manufacturing'),
    ('manufacturing:delete', 'Delete BOM and work orders', 'manufacturing'),
    ('manufacturing:produce', 'Start/complete production and record consumption/output', 'manufacturing')
ON CONFLICT (name) DO NOTHING;
