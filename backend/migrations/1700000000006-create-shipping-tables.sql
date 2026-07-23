-- Shipping & Logistics Module (Phase 9)
-- Depends on: organizations, users, sales_orders, products

-- ─── Carriers ─────────────────────────────────────────────────────────
CREATE TYPE carrier_status AS ENUM ('active', 'inactive');

CREATE TABLE IF NOT EXISTS carriers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    website VARCHAR(500),
    phone VARCHAR(50),
    email VARCHAR(255),
    tracking_url_template VARCHAR(500),
    status carrier_status NOT NULL DEFAULT 'active',
    attributes JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_carriers_org_code ON carriers(organization_id, code) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_carriers_org ON carriers(organization_id);
CREATE INDEX IF NOT EXISTS idx_carriers_status ON carriers(organization_id, status);

-- ─── Shipments ────────────────────────────────────────────────────────
CREATE TYPE shipment_status AS ENUM ('draft', 'pending', 'dispatched', 'in_transit', 'delivered', 'failed', 'returned');

CREATE TABLE IF NOT EXISTS shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    shipment_number VARCHAR(50) NOT NULL,
    sales_order_id UUID REFERENCES sales_orders(id),
    carrier_id UUID REFERENCES carriers(id),
    carrier_tracking_number VARCHAR(255),
    status shipment_status NOT NULL DEFAULT 'draft',
    origin_address TEXT,
    destination_address TEXT,
    shipped_date TIMESTAMPTZ,
    estimated_delivery_date TIMESTAMPTZ,
    actual_delivery_date TIMESTAMPTZ,
    total_weight NUMERIC(12,4),
    weight_unit VARCHAR(20) DEFAULT 'kg',
    total_value NUMERIC(15,2),
    shipping_cost NUMERIC(15,2),
    currency VARCHAR(3) DEFAULT 'USD',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_shipments_org_number ON shipments(organization_id, shipment_number);
CREATE INDEX IF NOT EXISTS idx_shipments_org ON shipments(organization_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_shipments_sales_order ON shipments(sales_order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_carrier ON shipments(carrier_id);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking ON shipments(carrier_tracking_number);
CREATE INDEX IF NOT EXISTS idx_shipments_dates ON shipments(organization_id, shipped_date, estimated_delivery_date);

-- ─── Shipment Items ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shipment_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
    sales_order_item_id UUID REFERENCES sales_order_items(id),
    product_id UUID REFERENCES products(id),
    quantity NUMERIC(12,4) NOT NULL DEFAULT 1,
    unit_weight NUMERIC(12,4),
    attributes JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipment_items_shipment ON shipment_items(shipment_id);
CREATE INDEX IF NOT EXISTS idx_shipment_items_order_item ON shipment_items(sales_order_item_id);

-- ─── Tracking Events ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shipment_tracking_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
    status VARCHAR(100) NOT NULL,
    location VARCHAR(255),
    description TEXT,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipment_tracking_shipment ON shipment_tracking_events(shipment_id);
CREATE INDEX IF NOT EXISTS idx_shipment_tracking_occurred ON shipment_tracking_events(shipment_id, occurred_at DESC);

-- ─── Permissions ──────────────────────────────────────────────────────
INSERT INTO permissions (name, description, category) VALUES
    ('shipping:read', 'View carriers and shipments', 'shipping'),
    ('shipping:create', 'Create carriers and shipments', 'shipping'),
    ('shipping:update', 'Update carriers and shipments', 'shipping'),
    ('shipping:delete', 'Delete carriers and shipments', 'shipping')
ON CONFLICT (name) DO NOTHING;
