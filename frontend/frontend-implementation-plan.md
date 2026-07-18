# ERP Admin Panel — Frontend Implementation Plan (Revised)

## 1. Tech Stack (Actual)

| Layer | Choice | Note |
|-------|--------|------|
| Framework | **Next.js 15 (App Router)** | Deviated from plan (Vite → Next.js for SSR, file-based routing) |
| Language | TypeScript (strict) | strict: true in tsconfig |
| Routing | Next.js App Router (file-based) | layout.tsx, page.tsx, route groups `(dashboard)` |
| HTTP Client | Axios | JWT interceptor with refresh token rotation |
| Server State | TanStack React Query v5 | queryClient in providers.tsx |
| Client State | Zustand (persist middleware) | auth-store.ts, ui-store.ts |
| Forms | React Hook Form + Zod | zodResolver integration |
| UI Components | shadcn/ui (Radix primitives) | Button, Input, Card, Dialog, Table, Badge, Avatar, Toast, Select, Separator, DropdownMenu |
| Styling | Tailwind CSS v3 | shadcn/ui CSS variables for light/dark |
| Tables | TanStack Table v8 | DataTable wrapper component |
| Charts | Recharts | (installed, not yet used) |
| Icons | Lucide React | — |
| Build | Next.js + Turbopack | `next dev --turbopack -p 3000` |

## 2. Project Structure (Actual)

```
frontend/
├── public/
│   ├── favicon.ico
│   └── logo.svg
├── src/
│   ├── app/
│   │   ├── (dashboard)/          # Route group — requires auth
│   │   │   ├── layout.tsx        # ProtectedRoute + Sidebar + Header
│   │   │   ├── loading.tsx
│   │   │   ├── page.tsx          # Dashboard redirect
│   │   │   ├── dashboard/
│   │   │   │   ├── page.tsx      # Server component shell
│   │   │   │   └── dashboard-client.tsx
│   │   │   ├── users/
│   │   │   │   └── page.tsx      # User list (DataTable + search + pagination)
│   │   │   ├── roles/
│   │   │   │   └── page.tsx      # Role list (DataTable + actions)
│   │   │   ├── profile/
│   │   │   │   ├── page.tsx      # Update profile form
│   │   │   │   └── change-password/
│   │   │   │       └── page.tsx
│   │   │   ├── customers/
│   │   │   │   ├── page.tsx          # Customer list + DataTable
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx      # Detail with tabs
│   │   │   ├── orders/
│   │   │   │   ├── page.tsx          # Order list + filters
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx      # Order creation form
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx      # Detail with items + payments
│   │   │   └── mfa/
│   │   ├── auth/
│   │   │   ├── layout.tsx        # Centered card layout
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   ├── forgot-password/page.tsx
│   │   │   └── reset-password/page.tsx
│   │   ├── forbidden/
│   │   │   └── page.tsx
│   │   ├── layout.tsx            # Root layout (Inter font, Providers)
│   │   ├── page.tsx              # Redirects to /auth/login
│   │   ├── loading.tsx
│   │   ├── error.tsx
│   │   ├── not-found.tsx
│   │   ├── globals.css            # Tailwind directives + shadcn/ui theme vars
│   │   └── providers.tsx          # QueryClientProvider + Toaster
│   ├── components/
│   │   ├── ui/                    # shadcn/ui primitives (16 components)
│   │   ├── layout/
│   │   │   ├── sidebar.tsx        # Role-aware nav menu
│   │   │   └── header.tsx         # User menu, theme toggle, logout
│   │   ├── shared/
│   │   │   ├── data-table.tsx     # TanStack Table wrapper (pagination)
│   │   │   ├── confirm-dialog.tsx # Delete/action confirmation
│   │   │   ├── search-input.tsx   # Debounced search input
│   │   │   ├── loading-spinner.tsx
│   │   │   └── empty-state.tsx
│   │   └── guards/
│   │       ├── protected-route.tsx # Auth + role-based guard
│   │       └── permission-gate.tsx # Conditional render by permission
│   ├── hooks/
│   │   ├── useAuth.ts             # Login/register/logout + React Query mutations
│   │   ├── usePermissions.ts      # Permission check helpers
│   │   └── use-debounce.ts
│   ├── lib/
│   │   ├── api.ts                 # Axios instance + JWT interceptor
│   │   ├── utils.ts               # cn() helper
│   │   ├── validators.ts          # Zod schemas
│   │   └── constants.ts           # Routes, permissions, cache keys, status enums
│   ├── modules/
│   │   ├── auth/
│   │   │   └── auth.api.ts        # All auth API functions
│   │   ├── users/
│   │   │   └── users.api.ts       # User CRUD API functions
│   │   ├── roles/
│   │   │   └── roles.api.ts       # Role CRUD + permissions API functions
│   │   ├── organizations/         # (to be created in Phase 2)
│   │   │   └── org.api.ts
│   │   ├── customer/               # (Phase 5 — complete)
│   │   │   ├── customer.api.ts
│   │   │   └── components/
│   │   │       └── customer-form-modal.tsx
│   │   ├── order/                  # (Phase 5 — complete)
│   │   │   └── order.api.ts
│   │   ├── inventory/             # (Phase 4 — complete)
│   │   │   ├── inventory.api.ts
│   │   │   └── components/        # product-form, category-form, warehouse-form, transfer-stock, adjust-stock modals
│   │   └── audit/
│   ├── stores/
│   │   ├── auth-store.ts          # Zustand + persist (user, tokens)
│   │   └── ui-store.ts            # Zustand + persist (sidebar, theme)
│   ├── types/
│   │   ├── api.ts                 # ApiResponse, ApiErrorResponse, PaginationMeta
│   │   ├── auth.ts                # User, LoginResponse, all payloads
│   │   ├── user.ts                # UserListItem
│   │   └── role.ts                # Role, Permission
│   └── middleware.ts              # Next.js middleware (public path allowlist)
├── .env.development               # NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api
├── .env.production
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── postcss.config.js
├── package.json
└── .prettierrc
```

## 3. Implementation Status

Phases align with the backend module order from `d:\ERP\backend\erp-workflow-plan.md` section 2.

### Phase 0: Project Scaffold + UI Framework (Complete)
```
Goal: Working frontend shell with navigation
Frontend: ✅ Next.js 15 scaffold, Tailwind, shadcn/ui primitives
          ✅ Sidebar (role-aware nav), Header (user menu, theme toggle)
          ✅ Providers (React Query, Toaster)
          ✅ DataTable, ConfirmDialog, SearchInput, LoadingSpinner, EmptyState
          ✅ ProtectedRoute, PermissionGate guards
          ✅ Error, loading, 404, 403 pages
```

### Phase 1: Authentication (Complete)
```
Goal: Working login → dashboard flow
Backend: Auth endpoints (register, login, refresh, logout,
         forgot/reset/change-password, MFA setup/verify/disable, profile GET/PATCH)
Frontend: ✅ Login, Register, Forgot/Reset password pages
          ✅ MFA setup/disable pages
          ✅ Profile page + Change password
          ✅ auth-store (Zustand + persist), auth.api.ts
          ✅ useAuth hook, usePermissions hook
```

### Phase 2: User, Role & Organization Management (Complete)
```
Backend: CRUD for users, roles, organizations (org-scoped, RBAC-protected)
Frontend: ✅ User list (DataTable + search + pagination + create/edit modals + delete)
          ✅ Role list (DataTable + create/edit modals + delete)
          ✅ org.api.ts (to be wired to Settings page)
Endpoints:
  GET    /api/users?page=&limit=&search=&sort=&status=&role=
  GET    /api/users/:id
  POST   /api/users
  PATCH  /api/users/:id
  DELETE /api/users/:id
  GET    /api/roles
  GET    /api/roles/permissions
  GET    /api/roles/:id
  POST   /api/roles
  PATCH  /api/roles/:id
  DELETE /api/roles/:id
```

### Phase 3: Audit Trail + Organization Settings (✅ Complete)
```
Backend:
  GET/PATCH /api/organizations              — Org profile
  GET/PATCH /api/organizations/settings     — Email, security, notification, localization settings
  GET       /api/organizations/stats        — User/role counts
  GET       /api/audit-logs                 — Paginated audit log list (filterable)
  GET       /api/audit-logs/export          — Export audit logs as JSON
  GET       /api/audit-logs/:entityType/:entityId  — Changes to specific record
  GET       /api/audit-logs/user/:userId    — Actions by specific user

  Middleware: auditLog writes to both logger and audit_logs DB table
  Audit logging active on: auth, user, role, org mutation routes

Frontend: ✅ audit/page.tsx — DataTable with changes dialog, export, search
          ✅ settings/page.tsx — Org settings forms (email, security, notifications, localization)
```

### Phase 4: Inventory & Warehouse Management (✅ Complete)
```
Backend: Full CRUD + stock operations, 10 database tables, 24+ endpoints
Cache:   Redis cache-aside middleware, key conventions, cache warming

Tables:
  inventory_categories    (org-scoped, self-referential parent/child)
  products                (org-scoped, SKU-unique, category FK)
  product_variants        (nested under products, SKU-unique)
  product_barcodes        (polymorphic: product or variant)
  product_suppliers       (junction: product ↔ supplier)
  warehouses              (org-scoped, code-unique, default flag)
  warehouse_bin_locations (nested under warehouses)
  warehouse_stock         (warehouse × product × variant, qty + reserved)
  stock_movements         (audit trail for all stock changes)
  cycle_counts            (physical inventory counting)

Backend endpoints:
  Categories:   GET/POST      /api/inventory/categories
                GET/PATCH/DELETE /api/inventory/categories/:id
  Products:     GET/POST      /api/inventory/products
                GET/PATCH/DELETE /api/inventory/products/:id
  Variants:     GET/POST      /api/inventory/products/:productId/variants
                PATCH/DELETE  /api/inventory/products/:productId/variants/:variantId
  Warehouses:   GET/POST      /api/inventory/warehouses
                GET/PATCH/DELETE /api/inventory/warehouses/:id
  Stock:        GET           /api/inventory/stock
                POST          /api/inventory/stock/transfer
                POST          /api/inventory/stock/adjust
  Movements:    GET           /api/inventory/movements

  Permission checks on every route (inventory:read, create, update, delete, transfer, adjust, warehouse:*)
  Audit logging on all mutation routes.

Cache module:
  cacheKeys.js    — Centralized key definitions (erp:{org}:{entity}:{id}:{variant})
  cacheAside.js   — Express middleware with invalidateCache() helper
  warmup.js       — Cache warming scripts (categories, products, warehouses)

Frontend: ✅ inventory.api.ts — All types + API functions
          ✅ Sub-layout with tab navigation (Products, Categories, Warehouses, Stock, Movements)
          ✅ Products list page (DataTable + search + pagination + create/edit modal)
          ✅ Categories list page (DataTable + search + create/edit/delete)
          ✅ Warehouses list page (DataTable + search + create/edit/delete)
          ✅ Stock view page (grouped by warehouse, inline table, transfer/adjust buttons)
          ✅ Transfer Stock modal (destination selector, quantity, notes)
          ✅ Adjust Stock modal (new quantity, reason)
          ✅ Movement history page (DataTable, product/warehouse/type filters)
```

### Phase 5: Customers & Sales Orders (✅ Complete)
```
Backend: ✅ Customer module (CRUD + addresses/contacts/notes sub-resources)
         ✅ Sales Order module (create with line items, status transitions, payments, bulk create)
         ✅ 8 DB tables (customers, customer_addresses, customer_contacts, customer_notes,
            sales_orders, sales_order_items, sales_order_payments, sales_order_taxes)
         ✅ Registered at /api/customers and /api/orders
Frontend: ✅ customers page (DataTable + search + pagination + create/edit modal)
          ✅ customer detail page (tabs: details, addresses, contacts, notes)
          ✅ orders list page (DataTable + search + status filter)
          ✅ order detail page (items table, payments, status transitions)
          ✅ order create page (customer select, line items with qty/price/disc/tax, totals)

Endpoints:
  Customers:
    GET/POST      /api/customers
    GET/PUT/DELETE /api/customers/:id
    POST          /api/customers/:id/addresses
    PATCH/DELETE  /api/customers/:id/addresses/:addrId
    POST          /api/customers/:id/contacts
    PATCH/DELETE  /api/customers/:id/contacts/:contactId
    POST          /api/customers/:id/notes
    DELETE        /api/customers/:id/notes/:noteId
  Orders:
    GET/POST      /api/orders
    GET           /api/orders/:id
    POST          /api/orders/bulk
    PATCH         /api/orders/:id/status
    POST          /api/orders/:id/cancel
    POST          /api/orders/:id/payments
    GET           /api/orders/:id/deliveries
    GET           /api/orders/:id/timeline
```

### Phase 6: Vendors & Procurement (✅ Backend Complete, Frontend Pending)
```
Backend: ✅ Vendor module (CRUD + contacts/contracts sub-resources + purchase order history)
         ✅ Purchase Order module (create with line items, status transitions, goods receiving, payments)
         ✅ 7 DB tables (vendors, vendor_contacts, vendor_contracts,
            purchase_orders, purchase_order_items, purchase_order_taxes,
            goods_receipts, goods_receipt_items)
         ✅ Registered at /api/vendors and /api/purchase-orders
Frontend: ❌ Not yet built

Endpoints:
  Vendors:
    GET/POST      /api/vendors
    GET/PUT/DELETE /api/vendors/:id
    GET/POST      /api/vendors/:id/contacts
    PATCH/DELETE  /api/vendors/:id/contacts/:contactId
    GET/POST      /api/vendors/:id/contracts
    PATCH/DELETE  /api/vendors/:id/contracts/:contractId
    GET           /api/vendors/:id/purchase-orders
  Purchase Orders:
    GET/POST      /api/purchase-orders
    GET           /api/purchase-orders/:id
    PATCH         /api/purchase-orders/:id/status
    POST          /api/purchase-orders/:id/receive
    GET           /api/purchase-orders/:id/receipts/:receiptId
    GET           /api/purchase-orders/:id/timeline

Status transitions: draft → pending → approved → ordered → [partial | received] → cancelled

Permissions (already seeded):
  vendor:read, vendor:create, vendor:update, vendor:delete
  procurement:read, procurement:create, procurement:update, procurement:delete,
  procurement:approve, procurement:receive
```

### Phase 7+: Remaining modules
```
Each module follows the same pattern:
  ListPage → DataTable + Search + Pagination
  DetailPage → Read-only view + Edit button
  FormPage → React Hook Form + Zod schema → POST/PATCH
  Delete → ConfirmDialog → DELETE

Backend modules pending (in order):
  Manufacturing                 → Phase 7
  Quality Control               → Phase 8
  Quality Control               → Phase 10
  Shipping & Logistics          → Phase 9
  RMA / Returns                 → Phase 10
  Finance & Accounting          → Phase 11
  Tax Management                → Phase 12
  Budgeting                     → Phase 13
  Fixed Assets                  → Phase 14
  Bank Reconciliation           → Phase 15
  Multi-Currency                → Phase 16
  CRM                           → Phase 17
  HR & Payroll                  → Phase 18
  Project Management            → Phase 19
  Approval Workflows            → Phase 20
  Notifications                 → Phase 21
  Document Management           → Phase 22
  Import / Export               → Phase 23
  Reporting & Dashboards        → Phase 24
  Customer Portal               → Phase 25
```

## 4. Key Deviations from Original Plan

| Original Plan | Actual |
|---------------|--------|
| Vite + React Router v6 | Next.js 15 App Router |
| `AppLayout.tsx`, `Header.tsx`, `Sidebar.tsx` | Next.js route group `(dashboard)/layout.tsx` + `sidebar.tsx`, `header.tsx` |
| `PageContainer.tsx` | Inline page structure (h2 + p + Card) |
| `FormModal.tsx` | Not built yet |
| `StatusBadge.tsx` | Inline `<Badge>` usage |
| `FileUpload.tsx` | Not built yet |
| `auth.api.ts` in `modules/auth/` | ✅ Created |
| `AuthStore.setAuth(data: LoginResponse)` | `setAuth(user, accessToken, refreshToken)` — 3 separate args |
| React Query for auth | ✅ Added loginMutation, registerMutation, logoutMutation, currentUserQuery |
| `PermissionGate` component | ✅ Added |
| `.eslintrc.cjs` | ESLint not configured (next lint defaults) |
| `App.tsx` + `router.tsx` + `main.tsx` | Replaced by Next.js `app/` directory |
| Phase C / Phase 2 stubs | ✅ Fully implemented (User + Role management) |
| Backend Cache module | ✅ Added: `src/cache/cacheKeys.js`, `cacheAside.js`, `warmup.js` |
| Backend Inventory module | ✅ Added: 10 DB tables, 24+ endpoints, full CRUD + stock transfer/adjust |
| Backend Customer module | ✅ Added: 4 DB tables, CRUD + addresses/contacts/notes sub-resources |
| Backend Order module | ✅ Added: 4 DB tables, create with line items, status transitions, payments, bulk create |
| Module order deviation | Customers (pending) + Orders (pending) were swapped to build as Phase 5 backend together since Customers is a dependency of Orders |

## 5. Route Definitions (Next.js App Router)

| Path | Page | Guard |
|------|------|-------|
| `/` | Redirect → `/auth/login` | None |
| `/auth/login` | LoginPage | None |
| `/auth/register` | RegisterPage | None |
| `/auth/forgot-password` | ForgotPasswordPage | None |
| `/auth/reset-password` | ResetPasswordPage | None |
| `/dashboard` | DashboardPage | ProtectedRoute |
| `/profile` | ProfilePage | ProtectedRoute |
| `/profile/change-password` | ChangePasswordPage | ProtectedRoute |
| `/mfa/setup` | MfaSetupPage | ProtectedRoute |
| `/mfa/disable` | MfaDisablePage | ProtectedRoute |
| `/users` | UserListPage | ProtectedRoute (admin) |
| `/roles` | RoleListPage | ProtectedRoute (admin) |
| `/audit` | AuditLogPage | ProtectedRoute (admin, compliance) |
| `/inventory` | InventoryListPage | ProtectedRoute (inventory_clerk, manager, admin) |
| `/inventory/categories` | CategoryListPage | ProtectedRoute (inventory_clerk, manager, admin) |
| `/inventory/warehouses` | WarehouseListPage | ProtectedRoute (inventory_clerk, manager, admin) |
| `/inventory/stock` | StockPage | ProtectedRoute (inventory_clerk, manager, admin) |
| `/inventory/movements` | MovementListPage | ProtectedRoute (inventory_clerk, manager, admin) |
| `/customers` | CustomerListPage | ProtectedRoute (admin, sales_rep, crm) |
| `/customers/[id]` | CustomerDetailPage | ProtectedRoute (admin, sales_rep, crm) |
| `/orders` | OrderListPage | ProtectedRoute (admin, sales_rep, manager) |
| `/orders/new` | NewOrderPage | ProtectedRoute (admin, sales_rep, manager) |
| `/orders/[id]` | OrderDetailPage | ProtectedRoute (admin, sales_rep, manager) |
| `/settings` | SettingsPage | ProtectedRoute (admin) |
| `/403` | ForbiddenPage | None |
| `/404` | NotFoundPage | None |

## 6. Cache Keys

```typescript
CACHE_KEYS = {
  USERS:            ['users'],
  USER:             (id) => ['users', id],
  CURRENT_USER:     ['auth', 'me'],
  ROLES:            ['roles'],
  ROLE:             (id) => ['roles', id],
  PERMISSIONS:      ['permissions'],
  DASHBOARD_STATS:  ['dashboard', 'stats'],
  AUDIT_LOGS:       ['audit-logs'],
  ORG_SETTINGS:     ['organizations', 'settings'],
  INVENTORY_ITEMS:  ['inventory', 'products'],
  INVENTORY_ITEM:   (id) => ['inventory', 'products', id],
  CATEGORIES:       ['inventory', 'categories'],
  CATEGORY:         (id) => ['inventory', 'categories', id],
  WAREHOUSES:       ['warehouses'],
  WAREHOUSE:        (id) => ['warehouses', id],
  STOCK:            ['inventory', 'stock'],
  MOVEMENTS:        ['inventory', 'movements'],
}
```

## 6. Key Conventions

- **File naming**: PascalCase for components, camelCase for hooks/libs, kebab-case for dirs
- **Exports**: Named exports for all components; default exports for pages
- **Types**: Co-located in `types/` or inline
- **API functions**: Grouped in `{module}.api.ts` files, export plain async functions
- **React Query keys**: Array keys with params like `['users', { page, limit, search }]`
- **Permissions**: Check via `user.permissions.includes('user:read')` at route/component level
- **No prop drilling**: Zustand for global state, React Query for server state
- **404/403**: Dedicated pages, not redirects

## 7. Dependencies Graph

```
start: Next.js scaffold
  ├── tailwind + shadcn/ui            ← Phase 0 (complete)
  ├── api layer (Axios)               ← Phase 1 (complete)
  ├── auth store (Zustand)            ← Phase 1 (complete)
  ├── auth pages + API                ← Phase 1 (complete)
  ├── ProtectedRoute guard            ← Phase 1 (complete)
  ├── PermissionGate                  ← Phase 1 (complete)
  ├── layout (Sidebar + Header)       ← Phase 0 (complete)
  ├── dashboard page                  ← Phase 0 (complete)
  ├── DataTable component             ← Phase 0 (complete)
  ├── User + Role pages + API         ← Phase 2 (complete)
  ├── Org settings + Audit pages      ← Phase 3 (backend done)
  ├── Inventory + Warehouse pages     ← Phase 4 (complete)
  ├── Customer + Order backend        ← Phase 5 (complete)
  ├── Customer + Order frontend       ← Phase 5 (complete)
  ├── Vendor + Procurement backend    ← Phase 6 (backend complete)
  └── Vendor + Procurement frontend   ← Phase 6 (pending)
```

## 8. File Count (Current)

| Category | Files |
|----------|-------|
| Config (next, tailwind, ts, postcss, prettier) | 6 |
| App directory (layouts, pages, loading, error, not-found) | ~22 |
| lib (api, utils, validators, constants) | 4 |
| stores (auth, ui) | 2 |
| types (api, auth, user, role) | 4 |
| components/ui (shadcn primitives) | 16 |
| components/layout (sidebar, header) | 2 |
| components/shared (DataTable, ConfirmDialog, SearchInput, LoadingSpinner, EmptyState) | 5 |
| components/guards (ProtectedRoute, PermissionGate) | 2 |
| hooks (useAuth, usePermissions, useDebounce) | 3 |
| modules/auth (auth.api.ts) | 1 |
| modules/users (users.api.ts) | 1 |
| modules/roles (roles.api.ts) | 1 |
| modules/inventory (inventory.api.ts + 4 modals) | 5 |
| modules/customer (customer.api.ts + customer-form-modal) | 2 |
| modules/order (order.api.ts) | 1 |
| public (favicon, logo) | 2 |
| env (.dev, .prod) | 2 |
| middleware.ts | 1 |
| **Total** | **~82 files** |

---

## 9. Known Issues (Pre-existing)

| Issue | Location | Symptom | Root Cause |
|-------|----------|---------|------------|
| `/orders` page crashes on load | `frontend/src/app/(dashboard)/orders/page.tsx` | Internal Server Error (500) at runtime | Likely Next.js SSR crash — component tries to access browser-only API (`localStorage`, `window`) or a module fails to load during server render |
| Auth refresh endpoint crashes | `backend/src/modules/auth/auth.controller.js:35` | `Cannot read properties of undefined (reading 'id')` on `POST /api/auth/refresh` | The refresh handler expects `req.user.id` but `req.user` is `undefined` when the refresh token middleware doesn't populate it |

*This plan aligns with backend phases 1–6 at `d:\ERP\backend\erp-workflow-plan.md` and maps directly to the API endpoints, data models, and auth flows already built.*
