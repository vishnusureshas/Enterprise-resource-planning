-- Quality Control Module (Phase 8)
-- Depends on: products, purchase_order_items, work_order_outputs, sales_order_items

-- ─── Quality Checklists ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quality_checklists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_quality_checklists_org ON quality_checklists(organization_id);

-- ─── Quality Checklist Items ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quality_checklist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    checklist_id UUID NOT NULL REFERENCES quality_checklists(id) ON DELETE CASCADE,
    sequence INTEGER NOT NULL DEFAULT 0,
    description TEXT NOT NULL,
    expected_value VARCHAR(500),
    min_value NUMERIC(15,4),
    max_value NUMERIC(15,4),
    unit VARCHAR(50),
    is_critical BOOLEAN NOT NULL DEFAULT false,
    inspection_method VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quality_checklist_items_checklist ON quality_checklist_items(checklist_id);

-- ─── Quality Inspections ─────────────────────────────────────────────
CREATE TYPE inspection_status AS ENUM ('pending', 'in_progress', 'passed', 'failed', 'blocked');
CREATE TYPE inspection_reference_type AS ENUM ('purchase_order_item', 'work_order_output', 'sales_order_item');

CREATE TABLE IF NOT EXISTS quality_inspections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    inspection_number VARCHAR(50) NOT NULL,
    checklist_id UUID REFERENCES quality_checklists(id),
    reference_type inspection_reference_type NOT NULL,
    reference_id UUID NOT NULL,
    status inspection_status NOT NULL DEFAULT 'pending',
    inspected_by UUID REFERENCES users(id),
    inspection_date TIMESTAMPTZ,
    notes TEXT,
    result_summary VARCHAR(50), -- 'pass', 'fail', 'conditional_pass'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_quality_inspections_org_number ON quality_inspections(organization_id, inspection_number);
CREATE INDEX IF NOT EXISTS idx_quality_inspections_org ON quality_inspections(organization_id);
CREATE INDEX IF NOT EXISTS idx_quality_inspections_reference ON quality_inspections(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_quality_inspections_status ON quality_inspections(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_quality_inspections_checklist ON quality_inspections(checklist_id);

-- ─── Quality Inspection Results ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS quality_inspection_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inspection_id UUID NOT NULL REFERENCES quality_inspections(id) ON DELETE CASCADE,
    checklist_item_id UUID REFERENCES quality_checklist_items(id),
    item_description TEXT NOT NULL,
    actual_value VARCHAR(500),
    actual_numeric NUMERIC(15,4),
    is_pass BOOLEAN NOT NULL DEFAULT false,
    notes TEXT,
    inspected_by UUID REFERENCES users(id),
    inspected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quality_inspection_results_inspection ON quality_inspection_results(inspection_id);

-- ─── Inspection Criteria Templates ───────────────────────────────────
CREATE TABLE IF NOT EXISTS quality_inspection_criteria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    min_value NUMERIC(15,4),
    max_value NUMERIC(15,4),
    unit VARCHAR(50),
    is_critical BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_quality_inspection_criteria_org ON quality_inspection_criteria(organization_id);
CREATE INDEX IF NOT EXISTS idx_quality_inspection_criteria_product ON quality_inspection_criteria(product_id);
