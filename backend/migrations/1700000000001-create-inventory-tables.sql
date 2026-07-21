-- Migration: Create inventory and warehouse tables
-- Version: 1.1.0
-- Description: Creates inventory categories, products, variants, warehouses, stock, and movements tables

-- Inventory Categories
CREATE TABLE IF NOT EXISTS inventory_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES inventory_categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    UNIQUE(organization_id, slug)
);

CREATE INDEX idx_inv_categories_org ON inventory_categories(organization_id);
CREATE INDEX idx_inv_categories_parent ON inventory_categories(parent_id);
CREATE INDEX idx_inv_categories_active ON inventory_categories(organization_id, is_active) WHERE deleted_at IS NULL;

-- Products (Inventory Items)
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    category_id UUID REFERENCES inventory_categories(id) ON DELETE SET NULL,
    sku VARCHAR(100) NOT NULL,
    name VARCHAR(500) NOT NULL,
    description TEXT,
    unit_of_measure VARCHAR(50) DEFAULT 'pcs',
    unit_price NUMERIC(15,2) DEFAULT 0,
    cost_price NUMERIC(15,2) DEFAULT 0,
    reorder_point NUMERIC(12,4) DEFAULT 0,
    reorder_quantity NUMERIC(12,4) DEFAULT 0,
    weight NUMERIC(12,4),
    weight_unit VARCHAR(10) DEFAULT 'kg',
    is_active BOOLEAN DEFAULT TRUE,
    is_serialized BOOLEAN DEFAULT FALSE,
    is_batched BOOLEAN DEFAULT FALSE,
    track_inventory BOOLEAN DEFAULT TRUE,
    attributes JSONB DEFAULT '{}',
    image_url VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    UNIQUE(organization_id, sku)
);

CREATE INDEX idx_products_org ON products(organization_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_sku ON products(organization_id, sku) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_active ON products(organization_id, is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_search ON products USING GIN(to_tsvector('simple', name || ' ' || COALESCE(description, '')));

-- Product Variants
CREATE TABLE IF NOT EXISTS product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku VARCHAR(100) NOT NULL,
    name VARCHAR(500) NOT NULL,
    options JSONB NOT NULL DEFAULT '{}',
    unit_price NUMERIC(15,2),
    cost_price NUMERIC(15,2),
    weight NUMERIC(12,4),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, sku)
);

CREATE INDEX idx_product_variants_product ON product_variants(product_id);
CREATE INDEX idx_product_variants_sku ON product_variants(sku);

-- Product Barcodes
CREATE TABLE IF NOT EXISTS product_barcodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
    barcode VARCHAR(100) NOT NULL,
    type VARCHAR(50) DEFAULT 'EAN13',
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(barcode),
    CONSTRAINT barcode_owner CHECK (
        (product_id IS NOT NULL AND variant_id IS NULL) OR
        (product_id IS NULL AND variant_id IS NOT NULL)
    )
);

CREATE INDEX idx_product_barcodes_product ON product_barcodes(product_id);
CREATE INDEX idx_product_barcodes_variant ON product_barcodes(variant_id);

-- Product-Supplier junction
CREATE TABLE IF NOT EXISTS product_suppliers (
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL,
    supplier_sku VARCHAR(100),
    unit_cost NUMERIC(15,2),
    lead_time_days INTEGER,
    is_preferred BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (product_id, supplier_id)
);

-- Warehouses
CREATE TABLE IF NOT EXISTS warehouses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'US',
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    UNIQUE(organization_id, code)
);

CREATE INDEX idx_warehouses_org ON warehouses(organization_id);
CREATE INDEX idx_warehouses_active ON warehouses(organization_id, is_active) WHERE deleted_at IS NULL;

-- Warehouse Bin Locations
CREATE TABLE IF NOT EXISTS warehouse_bin_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255),
    zone VARCHAR(100),
    aisle VARCHAR(50),
    rack VARCHAR(50),
    shelf VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    max_weight NUMERIC(12,4),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(warehouse_id, code)
);

CREATE INDEX idx_bin_locations_warehouse ON warehouse_bin_locations(warehouse_id);
CREATE INDEX idx_bin_locations_zone ON warehouse_bin_locations(warehouse_id, zone);

-- Warehouse Stock (product inventory per warehouse)
CREATE TABLE IF NOT EXISTS warehouse_stock (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
    bin_location_id UUID REFERENCES warehouse_bin_locations(id) ON DELETE SET NULL,
    quantity NUMERIC(12,4) NOT NULL DEFAULT 0,
    reserved_quantity NUMERIC(12,4) NOT NULL DEFAULT 0,
    min_quantity NUMERIC(12,4) DEFAULT 0,
    max_quantity NUMERIC(12,4),
    unit_cost NUMERIC(15,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_warehouse_stock_warehouse ON warehouse_stock(warehouse_id);
CREATE INDEX idx_warehouse_stock_product ON warehouse_stock(product_id);
CREATE INDEX idx_warehouse_stock_variant ON warehouse_stock(variant_id);
CREATE INDEX idx_warehouse_stock_bin ON warehouse_stock(bin_location_id);
CREATE UNIQUE INDEX idx_warehouse_stock_unique ON warehouse_stock(warehouse_id, product_id) WHERE variant_id IS NULL;
CREATE UNIQUE INDEX idx_warehouse_stock_variant_unique ON warehouse_stock(warehouse_id, product_id, variant_id) WHERE variant_id IS NOT NULL;
CREATE INDEX idx_warehouse_stock_low ON warehouse_stock(warehouse_id, product_id) WHERE quantity <= min_quantity AND min_quantity > 0;

-- Stock Movements (audit trail for all stock changes)
CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    bin_location_id UUID REFERENCES warehouse_bin_locations(id) ON DELETE SET NULL,
    movement_type VARCHAR(50) NOT NULL,
    quantity NUMERIC(12,4) NOT NULL,
    reference_type VARCHAR(100),
    reference_id UUID,
    unit_cost NUMERIC(15,2),
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_stock_movements_org ON stock_movements(organization_id);
CREATE INDEX idx_stock_movements_warehouse ON stock_movements(warehouse_id);
CREATE INDEX idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_type ON stock_movements(movement_type);
CREATE INDEX idx_stock_movements_created ON stock_movements(created_at);
CREATE INDEX idx_stock_movements_reference ON stock_movements(reference_type, reference_id);

-- Cycle Counts (stock counting)
CREATE TABLE IF NOT EXISTS cycle_counts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    bin_location_id UUID REFERENCES warehouse_bin_locations(id) ON DELETE SET NULL,
    expected_quantity NUMERIC(12,4) NOT NULL,
    counted_quantity NUMERIC(12,4),
    variance NUMERIC(12,4),
    status VARCHAR(50) DEFAULT 'pending',
    counted_by UUID REFERENCES users(id),
    counted_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cycle_counts_org ON cycle_counts(organization_id);
CREATE INDEX idx_cycle_counts_warehouse ON cycle_counts(warehouse_id);
CREATE INDEX idx_cycle_counts_status ON cycle_counts(organization_id, status);

-- Movement type enum values
COMMENT ON COLUMN stock_movements.movement_type IS 'Values: receipt, sale, transfer_out, transfer_in, adjustment, consumption, production, return, initial';
