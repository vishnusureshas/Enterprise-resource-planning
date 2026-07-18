# ERP System — Full Workflow & Documentation Plan

**Stack:** Node.js, Express.js, PostgreSQL, Redis  
**Architecture:** Layered Monolith (scalable to microservices)  
**Target:** Comprehensive Production-Ready ERP covering Inventory, Orders, Finance, HR, CRM, Procurement, Manufacturing, Logistics, and more

---

## 1. SDLC & Project Management

| Phase | Activity | ERP Context |
|-------|----------|-------------|
| Requirements | Gather ERP module needs across all departments | Document user stories per module |
| Design | Architecture design, DB schema, API contracts, cache strategy | ER diagrams, route maps, middleware chain, Redis data model |
| Implementation | Build modules iteratively | Follow layered architecture |
| Testing | Unit → Integration → E2E → Load | Test business rules, API contracts, data integrity, cache invalidation |
| Deployment | CI/CD pipeline → Staging → Production | Containerized deployment with Redis |
| Monitor | Logs, metrics, error tracking, cache hit ratio | Sentry, Grafana, Prometheus, Redis Monitor |

**Git Workflow:** Feature branches → PR → code review → squash merge to `main`

---

## 2. Backend Folder Structure (Node.js + Express.js)

```
backend/
├── src/
│   ├── config/                    # DB, env, logger, redis config
│   │   ├── db.js                  # PostgreSQL connection pool
│   │   ├── redis.js               # Redis client (cache + pub/sub + queues)
│   │   ├── env.js                 # Environment variable validation
│   │   └── logger.js              # Winston/Pino logger setup
│   ├── middleware/                 # Global middleware
│   │   ├── auth.js                # JWT verification
│   │   ├── authorize.js           # RBAC permission check
│   │   ├── validate.js            # Joi/Zod schema validation
│   │   ├── errorHandler.js        # Global error handler
│   │   ├── rateLimiter.js         # Rate limiting
│   │   ├── auditLog.js            # Audit trail middleware
│   │   ├── cache.js               # Redis cache-aside middleware
│   │   ├── pagination.js          # Pagination helper
│   │   └── multer.js              # File upload config
│   ├── modules/
│   │   ├── auth/                  # Authentication & authorization
│   │   │   ├── auth.routes.js
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.service.js
│   │   │   └── auth.validation.js
│   │   ├── user/                  # User management
│   │   │   ├── user.routes.js
│   │   │   ├── user.controller.js
│   │   │   ├── user.service.js
│   │   │   ├── user.repo.js
│   │   │   └── user.validation.js
│   │   ├── organization/          # Multi-tenant organizations
│   │   │   ├── org.routes.js
│   │   │   ├── org.controller.js
│   │   │   ├── org.service.js
│   │   │   ├── org.repo.js
│   │   │   └── org.validation.js
│   │   ├── role/                  # Roles & permissions
│   │   │   ├── role.routes.js
│   │   │   ├── role.controller.js
│   │   │   ├── role.service.js
│   │   │   ├── role.repo.js
│   │   │   └── role.validation.js
│   │   ├── inventory/             # Inventory management
│   │   │   ├── inventory.routes.js
│   │   │   ├── inventory.controller.js
│   │   │   ├── inventory.service.js
│   │   │   ├── inventory.repo.js
│   │   │   └── inventory.validation.js
│   │   ├── warehouse/             # Multi-warehouse, bin locations
│   │   │   ├── warehouse.routes.js
│   │   │   ├── warehouse.controller.js
│   │   │   ├── warehouse.service.js
│   │   │   ├── warehouse.repo.js
│   │   │   └── warehouse.validation.js
│   │   ├── order/                 # Sales orders
│   │   │   ├── order.routes.js
│   │   │   ├── order.controller.js
│   │   │   ├── order.service.js
│   │   │   ├── order.repo.js
│   │   │   └── order.validation.js
│   │   ├── procurement/           # Purchase orders, vendor management
│   │   │   ├── procurement.routes.js
│   │   │   ├── procurement.controller.js
│   │   │   ├── procurement.service.js
│   │   │   ├── procurement.repo.js
│   │   │   └── procurement.validation.js
│   │   ├── vendor/                # Vendor/supplier management
│   │   │   ├── vendor.routes.js
│   │   │   ├── vendor.controller.js
│   │   │   ├── vendor.service.js
│   │   │   ├── vendor.repo.js
│   │   │   └── vendor.validation.js
│   │   ├── customer/              # Customer management
│   │   │   ├── customer.routes.js
│   │   │   ├── customer.controller.js
│   │   │   ├── customer.service.js
│   │   │   ├── customer.repo.js
│   │   │   └── customer.validation.js
│   │   ├── manufacturing/         # Production, BOM, work orders
│   │   │   ├── manufacturing.routes.js
│   │   │   ├── manufacturing.controller.js
│   │   │   ├── manufacturing.service.js
│   │   │   ├── manufacturing.repo.js
│   │   │   └── manufacturing.validation.js
│   │   ├── quality/               # Quality control / inspection
│   │   │   ├── quality.routes.js
│   │   │   ├── quality.controller.js
│   │   │   ├── quality.service.js
│   │   │   ├── quality.repo.js
│   │   │   └── quality.validation.js
│   │   ├── shipping/              # Logistics, shipments, tracking
│   │   │   ├── shipping.routes.js
│   │   │   ├── shipping.controller.js
│   │   │   ├── shipping.service.js
│   │   │   ├── shipping.repo.js
│   │   │   └── shipping.validation.js
│   │   ├── rma/                   # Returns, refunds, RMA
│   │   │   ├── rma.routes.js
│   │   │   ├── rma.controller.js
│   │   │   ├── rma.service.js
│   │   │   ├── rma.repo.js
│   │   │   └── rma.validation.js
│   │   ├── finance/               # General ledger, AP/AR, invoicing
│   │   │   ├── finance.routes.js
│   │   │   ├── finance.controller.js
│   │   │   ├── finance.service.js
│   │   │   ├── finance.repo.js
│   │   │   └── finance.validation.js
│   │   ├── tax/                   # Tax rules, rates, calculations
│   │   │   ├── tax.routes.js
│   │   │   ├── tax.controller.js
│   │   │   ├── tax.service.js
│   │   │   ├── tax.repo.js
│   │   │   └── tax.validation.js
│   │   ├── budgeting/             # Budgeting, forecasting, budget vs actuals
│   │   │   ├── budget.routes.js
│   │   │   ├── budget.controller.js
│   │   │   ├── budget.service.js
│   │   │   ├── budget.repo.js
│   │   │   └── budget.validation.js
│   │   ├── fixed-assets/          # Fixed asset register, depreciation
│   │   │   ├── asset.routes.js
│   │   │   ├── asset.controller.js
│   │   │   ├── asset.service.js
│   │   │   ├── asset.repo.js
│   │   │   └── asset.validation.js
│   │   ├── bank-reconciliation/   # Bank transactions, reconciliation
│   │   │   ├── bank.routes.js
│   │   │   ├── bank.controller.js
│   │   │   ├── bank.service.js
│   │   │   ├── bank.repo.js
│   │   │   └── bank.validation.js
│   │   ├── multi-currency/        # Currency rates, FX conversion
│   │   │   ├── currency.routes.js
│   │   │   ├── currency.controller.js
│   │   │   ├── currency.service.js
│   │   │   ├── currency.repo.js
│   │   │   └── currency.validation.js
│   │   ├── crm/                   # Leads, opportunities, deals, pipeline
│   │   │   ├── crm.routes.js
│   │   │   ├── crm.controller.js
│   │   │   ├── crm.service.js
│   │   │   ├── crm.repo.js
│   │   │   └── crm.validation.js
│   │   ├── hr/                    # Employees, attendance, payroll
│   │   │   ├── hr.routes.js
│   │   │   ├── hr.controller.js
│   │   │   ├── hr.service.js
│   │   │   ├── hr.repo.js
│   │   │   └── hr.validation.js
│   │   ├── project/               # Projects, tasks, timesheets, milestones
│   │   │   ├── project.routes.js
│   │   │   ├── project.controller.js
│   │   │   ├── project.service.js
│   │   │   ├── project.repo.js
│   │   │   └── project.validation.js
│   │   ├── approval/              # Approval workflows (PO, leave, invoice)
│   │   │   ├── approval.routes.js
│   │   │   ├── approval.controller.js
│   │   │   ├── approval.service.js
│   │   │   ├── approval.repo.js
│   │   │   └── approval.validation.js
│   │   ├── notification/          # In-app, email, SMS, push notifications
│   │   │   ├── notification.routes.js
│   │   │   ├── notification.controller.js
│   │   │   ├── notification.service.js
│   │   │   ├── notification.repo.js
│   │   │   └── notification.validation.js
│   │   ├── document/              # Document management, file attachments
│   │   │   ├── document.routes.js
│   │   │   ├── document.controller.js
│   │   │   ├── document.service.js
│   │   │   ├── document.repo.js
│   │   │   └── document.validation.js
│   │   ├── import-export/         # Bulk CSV/Excel import & export
│   │   │   ├── io.routes.js
│   │   │   ├── io.controller.js
│   │   │   ├── io.service.js
│   │   │   ├── io.repo.js
│   │   │   └── io.validation.js
│   │   ├── reporting/             # Configurable reports, drill-down, export
│   │   │   ├── report.routes.js
│   │   │   ├── report.controller.js
│   │   │   ├── report.service.js
│   │   │   ├── report.repo.js
│   │   │   └── report.validation.js
│   │   ├── dashboard/             # Role-based KPI dashboards
│   │   │   ├── dashboard.routes.js
│   │   │   ├── dashboard.controller.js
│   │   │   ├── dashboard.service.js
│   │   │   └── dashboard.repo.js
│   │   ├── audit-trail/           # Full change history & compliance
│   │   │   ├── audit.routes.js
│   │   │   ├── audit.controller.js
│   │   │   ├── audit.service.js
│   │   │   └── audit.repo.js
│   │   └── customer-portal/       # Self-service portal APIs
│   │       ├── portal.routes.js
│   │       ├── portal.controller.js
│   │       ├── portal.service.js
│   │       ├── portal.repo.js
│   │       └── portal.validation.js
│   ├── cache/                     # Cache utility functions
│   │   ├── cacheKeys.js           # Centralized cache key definitions
│   │   ├── cacheAside.js          # Cache-aside pattern helper
│   │   └── warmup.js              # Cache warming scripts
│   ├── jobs/                      # Background job processors (BullMQ workers)
│   │   ├── invoice.worker.js
│   │   ├── email.worker.js
│   │   ├── report.worker.js
│   │   ├── stockAlert.worker.js
│   │   └── dataSync.worker.js
│   ├── shared/                    # Shared utilities
│   │   ├── errors.js             # Custom error classes
│   │   ├── response.js           # Standardized response helpers
│   │   ├── pagination.js         # Pagination logic
│   │   ├── encryption.js         # AES encrypt/decrypt helpers
│   │   ├── fileHelper.js         # File storage helpers (local/S3)
│   │   └── constants.js          # Enums, status codes
│   ├── app.js                     # Express app setup & middleware registration
│   └── server.js                  # Entry point: HTTP server + Redis + DB init
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── migrations/                    # PostgreSQL migration files
├── seeds/                         # Seed data for dev/demo
├── docker/
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── redis/                     # Redis config files
│       └── redis.conf
├── scripts/
│   ├── warmCache.js               # Cache warming script
│   └── seedDemo.js                # Demo data seeder
├── .env.example
├── .eslintrc.js
├── .prettierrc
├── jest.config.js
├── package.json
└── README.md
```

---

## 3. Redis Caching Layer (Complete Configuration)

### 3.1 Redis Client Setup (`src/config/redis.js`)

```js
const Redis = require('ioredis');

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB, 10) || 0,
  retryStrategy: (times) => Math.min(times * 50, 2000),
  enableReadyCheck: true,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

// Dedicated connection for pub/sub (can't share with main client)
const redisSub = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB, 10) || 0,
  lazyConnect: true,
});

// Dedicated connection for BullMQ (separate DB index)
const redisQueue = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  password: process.env.REDIS_PASSWORD,
  db: 1, // separate DB for queues
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  lazyConnect: true,
});

module.exports = { redis, redisSub, redisQueue };
```

### 3.2 Cache Key Conventions

All cache keys follow a consistent namespace pattern:

```
erp:{tenantId}:{entity}:{id}:{variant}
```

| Key Pattern | TTL | Example |
|-------------|-----|---------|
| `erp:{org}:inventory:item:{id}` | 300s (5m) | `erp:org_42:inventory:item:item_101` |
| `erp:{org}:inventory:stock:{warehouseId}:{itemId}` | 60s (1m) | Stock levels need shorter TTL |
| `erp:{org}:inventory:category:{slug}` | 600s (10m) | Categories change rarely |
| `erp:{org}:customer:{id}` | 600s (10m) | Customer details |
| `erp:{org}:vendor:{id}` | 600s (10m) | Vendor details |
| `erp:{org}:product:catalog:page:{n}` | 300s (5m) | Product listings |
| `erp:{org}:finance:coa` | 1800s (30m) | Chart of accounts |
| `erp:{org}:finance:report:{type}:{params}` | 600s (10m) | Financial reports |
| `erp:{org}:currency:rates` | 3600s (1h) | Exchange rates |
| `erp:{org}:tax:rules` | 3600s (1h) | Tax configurations |
| `erp:{org}:role:permissions:{roleId}` | 900s (15m) | Role permissions |
| `erp:{org}:dashboard:kpi:{type}` | 300s (5m) | Dashboard KPIs |
| `erp:{org}:user:session:{token}` | 900s (15m) | Session cache |
| `ratelimit:{ip}:{endpoint}` | Varies | Rate limit counters |
| `erp:queue:email:*` | — | BullMQ queue data |

### 3.3 Cache-Aside Pattern (Middleware)

```js
// src/middleware/cache.js
const { redis } = require('../config/redis');
const logger = require('../config/logger');

function cache({ keyFn, ttl = 300 }) {
  return async (req, res, next) => {
    const cacheKey = keyFn(req);
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        logger.debug(`Cache HIT: ${cacheKey}`);
        res.set('X-Cache', 'HIT');
        return res.json(JSON.parse(cached));
      }
      logger.debug(`Cache MISS: ${cacheKey}`);
      res.set('X-Cache', 'MISS');
      // Monkey-patch res.json to cache response before sending
      const originalJson = res.json.bind(res);
      res.json = (body) => {
        if (res.statusCode < 400) {
          redis.setex(cacheKey, ttl, JSON.stringify(body)).catch(() => {});
        }
        return originalJson(body);
      };
      next();
    } catch (err) {
      logger.warn(`Cache error for ${cacheKey}: ${err.message}`);
      next(); // fall through on cache error
    }
  };
}
```

**Usage in routes:**
```js
router.get('/inventory/items',
  cache({
    keyFn: (req) => `erp:${req.user.org}:inventory:items:page:${req.query.page || 1}`,
    ttl: 300,
  }),
  inventoryController.list
);
```

### 3.4 Manual Cache Invalidation Strategy

Invalidate related caches whenever data mutates:

```js
// inventory.service.js
async updateItem(itemId, data) {
  const item = await inventoryRepo.update(itemId, data);
  // Invalidate caches
  await Promise.all([
    redis.del(`erp:${org}:inventory:item:${itemId}`),
    redis.del(`erp:${org}:inventory:items:page:*`), // pattern delete
    redis.del(`erp:${org}:inventory:stock:${item.warehouse_id}:${itemId}`),
  ]);
  return item;
}
```

### 3.5 Redis for Rate Limiting

```js
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const { redis } = require('../config/redis');

const limiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args),
    prefix: 'ratelimit:',
  }),
  windowMs: 60 * 1000,
  max: 100,
  message: { success: false, error: 'Too many requests' },
});
```

### 3.6 Redis for Session Store

```js
const session = require('express-session');
const RedisStore = require('connect-redis').default;
const { redis } = require('../config/redis');

app.use(session({
  store: new RedisStore({ client: redis, prefix: 'erp:session:' }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: true, httpOnly: true, maxAge: 24 * 60 * 60 * 1000 },
}));
```

### 3.7 Redis for Pub/Sub (Real-Time Events)

```js
// Publish inventory changes
redis.publish('inventory:update', JSON.stringify({ itemId, warehouseId, newQty }));

// Subscribe in notification service
redisSub.subscribe('inventory:update', (err, count) => {});
redisSub.on('message', (channel, message) => {
  if (channel === 'inventory:update') {
    // notify connected clients via WebSocket
  }
});
```

### 3.8 Cache Warming on Startup

```js
// src/cache/warmup.js
async function warmCache(orgId) {
  const items = await inventoryRepo.getAll(orgId);
  const pipeline = redis.pipeline();
  items.forEach(item => {
    const key = `erp:${orgId}:inventory:item:${item.id}`;
    pipeline.setex(key, 300, JSON.stringify(item));
  });
  await pipeline.exec();
  logger.info(`Warmed ${items.length} inventory items into cache`);
}
```

### 3.9 Docker Compose Redis Configuration

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports: ['5000:5000']
    depends_on: [db, redis]
    environment:
      - REDIS_HOST=redis
      - REDIS_PORT=6379
    volumes:
      - ./src:/app/src

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: erp
      POSTGRES_PASSWORD: erp_pass
    ports: ['5432:5432']
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports: ['6379:6379']
    command: ['redis-server', '--appendonly', 'yes', '--maxmemory', '512mb', '--maxmemory-policy', 'allkeys-lru']
    volumes:
      - redisdata:/data
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 5s

  redis-commander:
    image: rediscommander/redis-commander:latest
    ports: ['8081:8081']
    environment:
      - REDIS_HOSTS=local:redis:6379
    depends_on: [redis]

volumes:
  pgdata:
  redisdata:
```

### 3.10 NPM Dependencies for Redis

```json
{
  "dependencies": {
    "ioredis": "^5.4.0",
    "bullmq": "^5.0.0",
    "express-rate-limit": "^7.0.0",
    "rate-limit-redis": "^4.0.0",
    "connect-redis": "^7.0.0",
    "express-session": "^1.17.0",
    "cache-manager": "^5.0.0",
    "cache-manager-ioredis": "^2.0.0"
  }
}
```

### 3.11 Redis Monitoring & Alerts

| Metric | Tool | Alert Threshold |
|--------|------|-----------------|
| Cache hit rate | Redis INFO / Grafana | < 70% (review key TTLs) |
| Memory usage | Redis INFO | > 80% of maxmemory |
| Evicted keys | Redis INFO | > 0 (increase maxmemory or TTL) |
| Connected clients | Redis CLIENT LIST | > 500 (connection pool issue) |
| Queue depth | BullMQ dashboard | > 1000 (worker scaling needed) |
| Latency | Redis MONITOR / SLOWLOG | > 100ms |

---

## 4. Request Lifecycle (Backend Workflow)

```
Client Request
    ↓
Router (module.routes.js)
    ↓
Middleware Chain:
  └─ rateLimiter (Redis-backed)
    └─ auth (JWT verify, attach req.user)
      └─ authorize (RBAC permission check)
        └─ validate (Joi/Zod schema)
          └─ auditLog (log operation)
            └─ cache? (GET → check Redis → HIT: return cached)
    ↓
Controller (module.controller.js)
  └─ Parse req → call service → format response
    ↓
Service (module.service.js)
  └─ Business logic → validation → cache check → call repo → invalidate cache
    ↓
Repository (module.repo.js)
  └─ Raw SQL / query builder → PostgreSQL
    ↓
Response → JSON { success, data, meta, error }
    ↓
Cache middleware (if MISS) → store response in Redis with TTL
```

**Example: Create Sales Order (with caching)**
```
POST /api/orders
  → rateLimiter
  → auth (verify JWT, attach req.user)
  → authorize('order:create')
  → validate (items, customerId, dates)
  → auditLog
  → orderController.create
    → orderService.createOrder
      → BEGIN TRANSACTION
      → fetch inventory from cache (redis.get)
      → validate stock availability
      → reserve stock (inventory.repo)
      → create order record (order.repo)
      → update financial ledger (finance.repo)
      → invalidate caches:
          - inventory item stock levels
          - customer recent orders
          - dashboard KPIs
      → COMMIT
      → enqueue background jobs (invoice generation, email notification)
      → publish event to Redis pub/sub (order.created)
  → Response: 201 { orderId, status, items }
```

---

## 5. Database Engineering (PostgreSQL)

### 5.1 Entity Relationship (All Tables)

```
organizations
organizations ──< users
organizations ──< organization_settings
organizations ──< roles
roles >──< user_roles >── users
roles ──< role_permissions
users ──< user_sessions

departments ──< employees
employees ──< employee_attendance
employees ──< employee_leave_requests
employees ──< employee_payroll
employees ──< employee_documents
employees ──< employee_timesheets
employees ──< employee_notes

inventory_categories ──< products
inventory_categories ──< product_categories (self-referential parent/child)
products ──< product_variants
products ──< product_barcodes
products ──< product_suppliers
products ──< price_lists ──< price_list_items
products ──< bom (bill of materials) ──< bom_items
products ──< work_orders
work_orders ──< work_order_operations
work_orders ──< work_order_consumptions
work_orders ──< work_order_outputs
work_order_outputs ──< quality_inspections

warehouses ──< warehouse_bin_locations
warehouses ──< warehouse_stock
products >──< warehouse_stock >── warehouses
warehouse_stock ──< stock_movements
warehouse_stock ──< inventory_serials
warehouse_stock ──< inventory_batches
warehouse_stock ──< cycle_counts

quality_checks ──< quality_checklists
quality_checklists ──< quality_inspection_criteria
purchase_order_items ──< quality_inspections
work_order_outputs ──< quality_inspections
quality_inspections ──< quality_inspection_results

carriers ──< shipments
sales_orders ──< shipments
shipments ──< shipment_items
shipments ──< shipment_tracking_events

customers ──< customer_addresses
customers ──< customer_contacts
customers ──< customer_notes
customers ──< customer_price_lists
customers ──< sales_orders
sales_orders ──< sales_order_items
sales_orders ──< sales_order_payments
sales_orders ──< sales_order_taxes
sales_order_items ──< quality_inspections
sales_orders ──< rma_requests
rma_requests ──< rma_items
rma_items ──< rma_inspections

suppliers ──< supplier_contacts
suppliers ──< supplier_contracts
suppliers ──< supplier_ratings
suppliers ──< supplier_products
suppliers ──< purchase_orders
purchase_orders ──< purchase_order_items
purchase_orders ──< purchase_order_taxes
purchase_orders ──< goods_receipts
goods_receipts ──< goods_receipt_items
purchase_order_items ──< quality_inspections

currencies
currencies ──< exchange_rates
sales_orders ──< currencies
purchase_orders ──< currencies
journal_entries ──< currencies

payment_methods
sales_order_payments ──< payment_methods

chart_of_accounts
account_types
chart_of_accounts ──< account_types
chart_of_accounts ──< journal_entries
journal_entries ──< journal_lines
journal_entries ──< currencies
chart_of_accounts ──< budget_allocations
customers ──< invoices
suppliers ──< invoices
invoices ──< invoice_lines
invoice_lines ──< invoice_line_taxes
bank_accounts ──< bank_transactions
bank_accounts ──< bank_reconciliation_items
bank_reconciliation_items ──< bank_reconciliation_matches

fixed_assets ──< asset_depreciation_schedules
fixed_assets ──< asset_maintenance

tax_rates
tax_rates ──< tax_groups
tax_groups ──< tax_group_members
sales_orders ──< tax_groups
purchase_orders ──< tax_groups

leads ──< lead_activities
leads ──< opportunities
opportunities ──< opportunity_line_items
opportunities ──< deals
deals ──< sales_orders (won deal converts to order)

projects ──< project_tasks
project_tasks ──< task_assignees
project_tasks ──< task_timesheets
projects ──< project_milestones
projects ──< project_budgets

approval_workflows
approval_workflows ──< approval_stages
approval_stages ──< approval_stage_approvers
approval_requests ──< approval_stages
approval_requests ──< approval_stage_actions
approval_requests >── polymorphic (approvable_type + approvable_id)
  └─ links to: purchase_orders, invoices, leave_requests, rma_requests, etc.

attachments
attachments ──< polymorphic (attachable_type + attachable_id)
  └─ links to: any record (orders, invoices, employees, products, etc.)

notifications
notifications ──< notification_recipients

audit_logs (polymorphic: auditable_type + auditable_id + user_id + action + changes_json)
```

### 5.2 Schema Design Principles

**Conventions across all tables:**
- All tables: `id (UUID PK)`, `created_at`, `updated_at`, `organization_id (FK NOT NULL)`
- Use `ENUM` or lookup tables for status fields (order_status, payment_status, etc.)
- Soft-delete via `deleted_at TIMESTAMP NULL`
- Index all foreign keys and frequently queried columns (`email`, `sku`, `order_number`, `status`, `document_no`)
- Use `JSONB` for flexible metadata/attributes
- Add `created_by` and `updated_by` (UUID FK to users) for audit
- Use `NUMERIC(15,2)` for all monetary fields
- Use `INTEGER` for stock quantities (or `NUMERIC(12,4)` for decimal quantities)
- All tables have a unique business key: `document_no` or `code` (auto-generated, human-readable)

**Key relationships:**
- **Polymorphic associations** for approvals, attachments, audit logs, and notes (using `entity_type` + `entity_id`)
- **Many-to-many via junction tables**: `user_roles`, `warehouse_stock`, `tax_group_members`, `product_suppliers`
- **Self-referential**: `product_categories` (parent_id for hierarchy), `chart_of_accounts` (parent_account_id)

**Transactional integrity:**
- Stock movements always inside `BEGIN/COMMIT` with `FOR UPDATE` row locks
- Financial postings use double-entry: all journal_lines must balance before COMMIT
- Document numbering: auto-increment per organization per document type (order, invoice, PO)

**Naming conventions:**
- Tables: `snake_case`, plural where logical (`products`, `invoices`)
- Columns: `snake_case`, singular (`first_name`, `unit_price`)
- Junction tables: alphabetical pair (`product_supplier`, `user_role`)
- FK columns: `{referenced_table_singular}_id` (`customer_id`, `product_id`)

### 5.3 Core Table Indexing Strategy

```sql
-- Every organization-scoped query needs this
CREATE INDEX idx_{table}_org_id ON {table}(organization_id);

-- Unique business keys
CREATE UNIQUE INDEX idx_products_org_sku ON products(organization_id, sku);
CREATE UNIQUE INDEX idx_orders_org_number ON sales_orders(organization_id, order_number);
CREATE UNIQUE INDEX idx_invoices_org_number ON invoices(organization_id, invoice_number);

-- Foreign key indexes for JOIN performance
CREATE INDEX idx_sales_order_items_order_id ON sales_order_items(sales_order_id);
CREATE INDEX idx_stock_movements_warehouse_stock_id ON stock_movements(warehouse_stock_id);
CREATE INDEX idx_journal_lines_account_id ON journal_lines(account_id);
CREATE INDEX idx_journal_lines_entry_id ON journal_lines(journal_entry_id);

-- Status + date filters (common in reports)
CREATE INDEX idx_orders_status_date ON sales_orders(organization_id, status, created_at);
CREATE INDEX idx_invoices_due_date ON invoices(organization_id, due_date) WHERE status = 'unpaid';

-- Full-text search
CREATE INDEX idx_products_search ON products USING GIN(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Polymorphic lookups
CREATE INDEX idx_approval_requests_poly ON approval_requests(entity_type, entity_id);
CREATE INDEX idx_attachments_poly ON attachments(attachable_type, attachable_id);
```

### 5.4 Migrations Workflow

```
1. Create migration: npx node-pg-migrate create add_phone_number_to_customers
2. Edit generated SQL file:
     -- UP: ALTER TABLE customers ADD COLUMN phone VARCHAR(20);
     -- DOWN: ALTER TABLE customers DROP COLUMN phone;
3. Run: npx node-pg-migrate up
4. Commit migration file to version control
5. CI/CD runs migrations automatically before app restart
```

### 5.5 Key SQL Patterns

```sql
-- ============================================================
-- TRANSACTION: Create Sales Order with Stock Reservation
-- ============================================================
BEGIN;

-- Lock stock rows to prevent double-reservation
SELECT ws.id, ws.quantity
FROM warehouse_stock ws
JOIN products p ON p.id = ws.product_id
WHERE p.sku = $1 AND ws.warehouse_id = $2 AND ws.quantity >= $3
FOR UPDATE;

-- Deduct stock
UPDATE warehouse_stock
SET quantity = quantity - $3
WHERE product_id = (SELECT id FROM products WHERE sku = $1)
  AND warehouse_id = $2
  AND quantity >= $3;

IF NOT FOUND THEN
  ROLLBACK;
  RAISE EXCEPTION 'Insufficient stock';
END IF;

-- Record stock movement
INSERT INTO stock_movements (warehouse_stock_id, quantity, movement_type, reference_type, reference_id, created_by)
VALUES (
  (SELECT id FROM warehouse_stock WHERE product_id = (SELECT id FROM products WHERE sku = $1) AND warehouse_id = $2),
  -$3, 'sale', 'sales_order', $4, $5
);

-- Create sales order
INSERT INTO sales_orders (id, organization_id, customer_id, order_date, status, created_by)
VALUES ($6, $7, $8, NOW(), 'confirmed', $5);

INSERT INTO sales_order_items (sales_order_id, product_id, quantity, unit_price, line_total)
VALUES ($6, (SELECT id FROM products WHERE sku = $1), $3, $9, $3 * $9);

COMMIT;

-- ============================================================
-- MULTI-TENANT QUERY with org scoping
-- ============================================================
SELECT so.*, c.name AS customer_name
FROM sales_orders so
JOIN customers c ON c.id = so.customer_id
WHERE so.organization_id = $1
  AND so.status = $2
  AND so.created_at >= $3
ORDER BY so.created_at DESC
LIMIT $4 OFFSET $5;

-- ============================================================
-- MOVING AVERAGE COST CALCULATION
-- ============================================================
SELECT
  SUM(sm.quantity * sm.unit_cost) / NULLIF(SUM(sm.quantity), 0) AS avg_cost
FROM stock_movements sm
JOIN warehouse_stock ws ON ws.id = sm.warehouse_stock_id
WHERE ws.product_id = $1 AND sm.movement_type = 'purchase';

-- ============================================================
-- STOCK LEVEL ACROSS ALL WAREHOUSES (with min threshold alert)
-- ============================================================
SELECT
  p.sku, p.name,
  ws.warehouse_id, w.name AS warehouse_name,
  ws.quantity,
  p.reorder_point,
  CASE WHEN ws.quantity <= p.reorder_point THEN 'REORDER' ELSE 'OK' END AS status
FROM warehouse_stock ws
JOIN products p ON p.id = ws.product_id
JOIN warehouses w ON w.id = ws.warehouse_id
WHERE p.organization_id = $1
ORDER BY ws.quantity ASC;

-- ============================================================
-- AGING REPORT: Accounts Receivable
-- ============================================================
SELECT
  c.name AS customer_name,
  i.invoice_number,
  i.total_amount,
  i.due_date,
  CASE
    WHEN i.due_date >= CURRENT_DATE THEN 'current'
    WHEN i.due_date >= CURRENT_DATE - INTERVAL '30 days' THEN '1-30 days'
    WHEN i.due_date >= CURRENT_DATE - INTERVAL '60 days' THEN '31-60 days'
    WHEN i.due_date >= CURRENT_DATE - INTERVAL '90 days' THEN '61-90 days'
    ELSE '90+ days'
  END AS aging_bucket,
  i.balance_due
FROM invoices i
JOIN customers c ON c.id = i.customer_id
WHERE i.organization_id = $1
  AND i.status = 'sent'
  AND i.balance_due > 0
ORDER BY i.due_date ASC;

-- ============================================================
-- P&L BY MONTH (Financial Reporting)
-- ============================================================
SELECT
  DATE_TRUNC('month', je.posted_at) AS month,
  SUM(CASE WHEN ac.financial_type = 'revenue' THEN jl.amount ELSE 0 END) AS revenue,
  SUM(CASE WHEN ac.financial_type = 'expense' THEN jl.amount ELSE 0 END) AS expenses,
  SUM(CASE WHEN ac.financial_type = 'revenue' THEN jl.amount ELSE 0 END) -
  SUM(CASE WHEN ac.financial_type = 'expense' THEN jl.amount ELSE 0 END) AS net_profit
FROM journal_lines jl
JOIN chart_of_accounts ac ON ac.id = jl.account_id
JOIN journal_entries je ON je.id = jl.journal_entry_id
WHERE je.organization_id = $1
  AND je.status = 'posted'
  AND je.posted_at BETWEEN $2 AND $3
GROUP BY month
ORDER BY month;

-- ============================================================
-- BOM EXPLOSION (Recursive CTE for multi-level BOM)
-- ============================================================
WITH RECURSIVE bom_cte AS (
  -- Anchor: top-level product
  SELECT bi.id, bi.parent_product_id, bi.component_product_id, bi.quantity, 1 AS level
  FROM bom_items bi
  JOIN bom b ON b.id = bi.bom_id
  WHERE b.product_id = $1

  UNION ALL

  -- Recursive: sub-components
  SELECT bi.id, bi.parent_product_id, bi.component_product_id, bi.quantity * cte.quantity, cte.level + 1
  FROM bom_items bi
  JOIN bom b ON b.id = bi.bom_id
  JOIN bom_cte cte ON cte.component_product_id = b.product_id
)
SELECT * FROM bom_cte ORDER BY level;

-- ============================================================
-- AUDIT LOG: Changes to a specific record
-- ============================================================
SELECT
  al.created_at,
  u.name AS changed_by,
  al.action,
  al.changed_fields
FROM audit_logs al
JOIN users u ON u.id = al.user_id
WHERE al.auditable_type = 'sales_order'
  AND al.auditable_id = $1
ORDER BY al.created_at DESC;
```

---

## 6. Authentication & Authorization

| Feature | Implementation |
|---------|---------------|
| Register | bcrypt hash (cost 12), store in `users` table |
| Login | Verify hash → issue JWT pair (access + refresh) |
| JWT Access Token | Short-lived (15m), signed with `JWT_SECRET` |
| JWT Refresh Token | Long-lived (7d), stored in DB (hashed), rotated on each use |
| MFA / 2FA | Optional TOTP via `otplib`, verify before issuing tokens |
| Password Reset | Rate-limited email with signed token (15m expiry) |
| Role-Based Access | `roles` & `role_permissions` tables, middleware checks permission |
| Organization Scoping | All queries filter by `organization_id` from JWT claim |
| Rate Limiting | Redis-backed `express-rate-limit`, per-endpoint tiers |
| OAuth / SSO | Passport.js strategies for Google, GitHub, Microsoft |
| Session Cache | User permissions cached in Redis (15m TTL) |
| Device Tracking | Login history table tracks IP, user-agent, location |

**Permission Model:**
```json
{
  "roles": ["admin", "manager", "finance", "inventory_clerk", "sales_rep", "viewer"],
  "permissions": ["order:create", "order:read", "order:update", "order:approve",
                  "inventory:write", "inventory:read", "finance:read", "finance:approve_payment",
                  "hr:manage", "crm:write", "report:export"]
}
```

**Middleware Chain:**
```js
router.post('/orders',
  rateLimit({ windowMs: 60000, max: 100 }),
  authenticate,
  authorize('order:create'),
  validate(createOrderSchema),
  auditLog('order.create'),
  orderController.create
);
```

---

## 7. API Design (RESTful)

### 7.1 Core ERP Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register user |
| POST | /api/auth/login | Login |
| POST | /api/auth/refresh | Refresh access token |
| POST | /api/auth/logout | Invalidate refresh token |
| POST | /api/auth/mfa/setup | Enable TOTP |
| POST | /api/auth/mfa/verify | Verify TOTP code |
| POST | /api/auth/forgot-password | Request password reset |
| POST | /api/auth/reset-password | Reset password with token |
| CRUD | /api/users | User management |
| CRUD | /api/roles | Role management |
| CRUD | /api/permissions | Permission assignments |
| CRUD | /api/organizations | Multi-tenant org admin |
| GET | /api/me | Current user profile + permissions |

### 7.2 Inventory & Warehouse

| Method | Endpoint | Description |
|--------|----------|-------------|
| CRUD | /api/inventory/categories | Inventory categories |
| CRUD | /api/inventory/items | Inventory items |
| GET | /api/inventory/items/:id | Item detail with variants |
| PATCH | /api/inventory/items/:id | Update item |
| POST | /api/inventory/items/:id/variants | Add variant |
| GET | /api/inventory/stock/:itemId | Stock level across warehouses |
| GET | /api/inventory/stock/:itemId/:warehouseId | Stock at specific warehouse |
| POST | /api/inventory/transfer | Transfer stock between warehouses |
| POST | /api/inventory/adjust | Stock adjustment (count correction) |
| GET | /api/inventory/movements | Stock movement history |
| GET | /api/inventory/serials/:itemId | Serial numbers |
| GET | /api/inventory/batches/:itemId | Batch/lot numbers |
| CRUD | /api/warehouses | Warehouse management |
| CRUD | /api/warehouses/:id/bins | Bin locations |
| POST | /api/warehouses/:id/count | Start stock count |

### 7.3 Sales & Customers

| Method | Endpoint | Description |
|--------|----------|-------------|
| CRUD | /api/customers | Customer management |
| GET | /api/customers/:id/orders | Customer order history |
| POST | /api/customers/:id/notes | Add customer note |
| CRUD | /api/orders | Sales orders |
| GET | /api/orders/:id | Order detail with items |
| PATCH | /api/orders/:id/status | Update order status |
| POST | /api/orders/:id/cancel | Cancel order |
| POST | /api/orders/:id/payments | Record payment |
| GET | /api/orders/:id/deliveries | Order deliveries |
| GET | /api/orders/:id/timeline | Order status timeline |
| POST | /api/orders/bulk | Bulk create orders |

### 7.4 Procurement & Vendors

| Method | Endpoint | Description |
|--------|----------|-------------|
| CRUD | /api/vendors | Vendor/supplier management |
| GET | /api/vendors/:id/ratings | Vendor performance rating |
| GET | /api/vendors/:id/contracts | Vendor contracts |
| GET | /api/vendors/:id/purchase-orders | PO history |
| CRUD | /api/purchase-orders | Purchase orders |
| POST | /api/purchase-orders/:id/approve | Approve PO |
| POST | /api/purchase-orders/:id/receive | Goods receipt |
| GET | /api/purchase-orders/:id/receipts | Receipt history |
| POST | /api/purchase-orders/:id/return | Return to vendor |

### 7.5 Manufacturing

| Method | Endpoint | Description |
|--------|----------|-------------|
| CRUD | /api/manufacturing/bom | Bill of materials |
| GET | /api/manufacturing/bom/:id/explode | BOM explosion (all levels) |
| CRUD | /api/manufacturing/work-orders | Work orders |
| POST | /api/manufacturing/work-orders/:id/start | Start production |
| POST | /api/manufacturing/work-orders/:id/complete | Complete production |
| POST | /api/manufacturing/work-orders/:id/consume | Record material consumption |
| POST | /api/manufacturing/work-orders/:id/output | Record finished output |
| GET | /api/manufacturing/routes | Production routing |
| CRUD | /api/manufacturing/work-centers | Work centers/machines |

### 7.6 Quality Control

| Method | Endpoint | Description |
|--------|----------|-------------|
| CRUD | /api/quality/checklists | QC checklists |
| POST | /api/quality/inspect | Create inspection |
| GET | /api/quality/inspections/:id | Inspection result |
| GET | /api/quality/inspections | Inspection history |
| GET | /api/quality/reports/:itemId | Quality report by item |

### 7.7 Shipping & Logistics

| Method | Endpoint | Description |
|--------|----------|-------------|
| CRUD | /api/shipping/carriers | Shipping carriers |
| CRUD | /api/shipping/shipments | Shipments |
| POST | /api/shipping/shipments/:id/dispatch | Mark dispatched |
| POST | /api/shipping/shipments/:id/deliver | Mark delivered |
| GET | /api/shipping/tracking/:number | Track shipment |
| POST | /api/shipping/rates | Calculate shipping rates |

### 7.8 Returns & RMA

| Method | Endpoint | Description |
|--------|----------|-------------|
| CRUD | /api/rma/requests | RMA requests |
| POST | /api/rma/requests/:id/approve | Approve return |
| POST | /api/rma/requests/:id/receive | Receive returned items |
| POST | /api/rma/requests/:id/inspect | Inspect returned items |
| POST | /api/rma/requests/:id/refund | Process refund |
| POST | /api/rma/requests/:id/replace | Issue replacement |

### 7.9 Finance & Accounting

| Method | Endpoint | Description |
|--------|----------|-------------|
| CRUD | /api/finance/chart-of-accounts | Chart of accounts |
| CRUD | /api/finance/journal-entries | Journal entries |
| GET | /api/finance/journal-entries/:id | Entry with lines |
| POST | /api/finance/journal-entries/:id/post | Post entry |
| CRUD | /api/finance/invoices | Customer invoices |
| POST | /api/finance/invoices/:id/send | Send invoice to customer |
| POST | /api/finance/invoices/:id/pay | Record payment |
| GET | /api/finance/accounts-receivable | AR aging report |
| GET | /api/finance/accounts-payable | AP aging report |
| GET | /api/finance/general-ledger | General ledger |
| GET | /api/finance/trial-balance | Trial balance |
| GET | /api/finance/income-statement | P&L statement |
| GET | /api/finance/balance-sheet | Balance sheet |
| GET | /api/finance/cash-flow | Cash flow statement |

### 7.10 Tax Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| CRUD | /api/tax/rates | Tax rates |
| CRUD | /api/tax/rules | Tax rules (conditions) |
| CRUD | /api/tax/groups | Tax groups |
| POST | /api/tax/calculate | Calculate tax for transaction |
| GET | /api/tax/reports/summary | Tax summary report |

### 7.11 Budgeting & Forecasting

| Method | Endpoint | Description |
|--------|----------|-------------|
| CRUD | /api/budget/allocations | Budget allocations |
| GET | /api/budget/vs-actual | Budget vs actual report |
| GET | /api/budget/forecast | Financial forecast |
| POST | /api/budget/rollover | Roll over budget to next period |

### 7.12 Fixed Assets

| Method | Endpoint | Description |
|--------|----------|-------------|
| CRUD | /api/assets | Fixed asset register |
| POST | /api/assets/:id/depreciate | Run depreciation |
| GET | /api/assets/:id/depreciation-schedule | Depreciation schedule |
| POST | /api/assets/:id/dispose | Asset disposal |

### 7.13 Bank Reconciliation

| Method | Endpoint | Description |
|--------|----------|-------------|
| CRUD | /api/bank/accounts | Bank accounts |
| POST | /api/bank/transactions/import | Import bank statement (CSV/OFX) |
| GET | /api/bank/transactions | Bank transactions |
| POST | /api/bank/reconciliation/start | Start reconciliation |
| POST | /api/bank/reconciliation/match | Match transaction |
| GET | /api/bank/reconciliation/:id | Reconciliation report |

### 7.14 Multi-Currency

| Method | Endpoint | Description |
|--------|----------|-------------|
| CRUD | /api/currency/rates | Exchange rates |
| POST | /api/currency/rates/update | Auto-update rates via API |
| POST | /api/currency/convert | Convert amount |
| GET | /api/currency/gains-losses | FX gains/losses report |

### 7.15 CRM

| Method | Endpoint | Description |
|--------|----------|-------------|
| CRUD | /api/crm/leads | Lead management |
| POST | /api/crm/leads/:id/convert | Convert lead to customer |
| CRUD | /api/crm/opportunities | Opportunities |
| PATCH | /api/crm/opportunities/:id/stage | Update pipeline stage |
| GET | /api/crm/pipeline | Pipeline view with stages |
| POST | /api/crm/opportunities/:id/activities | Log activity |
| GET | /api/crm/forecast | Sales forecast |
| CRUD | /api/crm/campaigns | Campaign management |

### 7.16 HR & Payroll

| Method | Endpoint | Description |
|--------|----------|-------------|
| CRUD | /api/hr/departments | Departments |
| CRUD | /api/hr/employees | Employee management |
| GET | /api/hr/employees/:id/timeline | Employment history |
| POST | /api/hr/attendance/clock-in | Clock in |
| POST | /api/hr/attendance/clock-out | Clock out |
| GET | /api/hr/attendance/:employeeId | Attendance report |
| CRUD | /api/hr/leave-requests | Leave management |
| POST | /api/hr/leave-requests/:id/approve | Approve/deny leave |
| POST | /api/hr/payroll/run | Run payroll |
| GET | /api/hr/payroll/:employeeId | Payslip |
| POST | /api/hr/payroll/disburse | Disburse salaries |

### 7.17 Project Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| CRUD | /api/projects | Projects |
| CRUD | /api/projects/:id/tasks | Tasks |
| PUT | /api/projects/:id/tasks/:taskId/assign | Assign task |
| PATCH | /api/projects/:id/tasks/:taskId/status | Update task status |
| POST | /api/timesheets | Log timesheet entry |
| GET | /api/timesheets/report | Timesheet report |
| CRUD | /api/projects/:id/milestones | Milestones |

### 7.18 Approval Workflows

| Method | Endpoint | Description |
|--------|----------|-------------|
| CRUD | /api/approval/workflows | Workflow definitions |
| CRUD | /api/approval/workflows/:id/stages | Workflow stages |
| POST | /api/approval/requests | Submit approval request |
| GET | /api/approval/requests/pending | Pending approvals |
| POST | /api/approval/requests/:id/approve | Approve |
| POST | /api/approval/requests/:id/reject | Reject with reason |
| GET | /api/approval/requests/:id/timeline | Approval timeline |

### 7.19 Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/notifications | User notifications |
| PATCH | /api/notifications/:id/read | Mark as read |
| POST | /api/notifications/read-all | Mark all as read |
| GET | /api/notifications/settings | Notification preferences |
| PUT | /api/notifications/settings | Update preferences |

### 7.20 Document Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/documents/upload | Upload document |
| CRUD | /api/documents | Document list/delete |
| GET | /api/documents/:id/download | Download file |
| GET | /api/documents/:id/versions | Version history |
| POST | /api/documents/:id/versions | Upload new version |
| POST | /api/documents/attach | Attach to entity (order, invoice, etc.) |

### 7.21 Data Import/Export

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/import/upload | Upload CSV/Excel file |
| POST | /api/import/:id/preview | Preview mapped data |
| POST | /api/import/:id/execute | Execute import |
| GET | /api/import/:id/errors | Import errors log |
| POST | /api/export/:module | Export module data |
| GET | /api/export/:jobId/download | Download export file |

### 7.22 Reporting & Dashboards

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/reports/custom | Create custom report |
| GET | /api/reports/available | Available report templates |
| POST | /api/reports/:id/generate | Generate report |
| GET | /api/reports/:id/export/:format | Export (PDF, CSV, XLSX) |
| DELETE | /api/reports/:id | Delete report |
| GET | /api/dashboard/:role | Role-specific KPI dashboard |
| GET | /api/dashboard/:module/kpis | Module-specific KPIs |

### 7.23 Audit Trail

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/audit-logs | Audit log listing |
| GET | /api/audit-logs/:entity/:entityId | Changes to specific record |
| GET | /api/audit-logs/user/:userId | Actions by specific user |
| GET | /api/audit-logs/export | Export audit logs |

### 7.24 Customer Portal (Self-Service)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/portal/auth/login | Portal login |
| GET | /api/portal/orders | My orders |
| GET | /api/portal/orders/:id | Order detail |
| POST | /api/portal/rma | Submit return request |
| GET | /api/portal/invoices | My invoices |
| GET | /api/portal/profile | My profile |
| PUT | /api/portal/profile | Update profile |
| POST | /api/portal/tickets | Submit support ticket |

### 7.25 Response Format

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  },
  "error": null
}
```

**Error Response:**
```json
{
  "success": false,
  "data": null,
  "meta": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      { "field": "email", "message": "Invalid email format" }
    ],
    "traceId": "req-abc-123"
  }
}
```

---

## 8. Security

| Measure | Implementation |
|---------|---------------|
| Input Validation | Joi/Zod schemas on every route |
| SQL Injection | Parameterized queries via `pg` driver |
| XSS | Helmet.js middleware |
| CORS | Whitelist allowed origins |
| Rate Limiting | Redis-backed per-endpoint + per-user limits |
| HTTPS | Enforce in production via reverse proxy (Nginx) |
| Secrets Management | `.env` in `.gitignore`, loaded via `dotenv`, never committed |
| Password Hashing | bcrypt (cost factor 12) |
| Data Encryption | AES-256-GCM for sensitive fields at rest (PII, bank details) |
| Audit Logging | Log all CRUD operations with userId, timestamp, diff |
| RBAC | Middleware checks permission before every mutating endpoint |
| IP Whitelisting | Admin endpoints restricted by IP |
| Request Size Limiting | `express.json({ limit: '10mb' })` |
| HSTS | Strict-Transport-Security header |
| CSRF | Token-based protection for session-based auth |
| Secure Cookies | `httpOnly`, `secure`, `sameSite: strict` |
| Account Lockout | Lock after 5 failed login attempts (15min cooldown) |
| Session Rotation | New session ID on privilege escalation |

---

## 9. Admin Panel Architecture

The ERP Admin Panel is the primary frontend interface for internal users. It connects to the Express.js backend APIs and consumes the RESTful endpoints defined in this document.

### 9.1 Frontend Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | React.js with Vite | Component-based UI with fast HMR |
| Type Safety | TypeScript | Catch type errors at compile time |
| Styling | Tailwind CSS | Utility-first responsive design |
| State Management | Zustand + React Query | Server cache via React Query, client state via Zustand |
| Routing | React Router v6 | Role-based route protection and lazy loading |
| Forms | React Hook Form + Zod | Performant forms with schema validation |
| UI Components | shadcn/ui + Radix | Accessible, composable components |
| Charts | Recharts / Tremor | Dashboard KPIs and analytics |
| Data Tables | TanStack Table | Sortable, filterable, paginated tables |
| HTTP Client | Axios / ky | API calls with interceptors for JWT refresh |

### 9.2 Admin Panel Modules (Role-Based)

| Module | Routes | Roles |
|--------|--------|-------|
| Dashboard | `/dashboard` | All roles (content varies by role) |
| Inventory | `/inventory/*` | inventory_clerk, manager, admin |
| Sales Orders | `/orders/*` | sales_rep, manager, admin |
| Purchases | `/procurement/*` | procurement, manager, admin |
| Customers | `/customers/*` | sales_rep, crm, admin |
| Vendors | `/vendors/*` | procurement, finance, admin |
| Manufacturing | `/manufacturing/*` | production, manager, admin |
| Finance | `/finance/*` | finance, admin |
| HR | `/hr/*` | hr, admin |
| CRM | `/crm/*` | sales_rep, crm, admin |
| Reports | `/reports/*` | manager, admin, finance |
| Settings | `/settings/*` | admin only |
| Users & Roles | `/users/*` | admin only |
| Audit Logs | `/audit/*` | admin, compliance |
| Import/Export | `/data/*` | admin, manager |

### 9.3 Admin Panel Request Flow

```
Browser (React App)
  ↓
React Router → ProtectedRoute wrapper (check auth + role)
  ↓
Layout (Sidebar + Header + Content Area)
  ↓
Page Component mounts
  ↓
React Query (useQuery/useMutation) → Axios → Backend API
  ↓
JWT Interceptor: attach access token → on 401, refresh silently → retry
  ↓
Backend responds → React Query caches → UI updates
```

### 9.4 JWT Interceptor (Axios)

```ts
// Axios interceptor for automatic token refresh
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      const { accessToken } = await authApi.refreshToken();
      localStorage.setItem('accessToken', accessToken);
      error.config.headers.Authorization = `Bearer ${accessToken}`;
      return axios(error.config);
    }
    return Promise.reject(error);
  }
);
```

### 9.5 Route Protection (Frontend)

```tsx
function ProtectedRoute({ roles, children }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <Spinner />;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.some(r => user.roles.includes(r)))
    return <Navigate to="/unauthorized" />;
  return children;
}

// Usage
<Route path="/finance" element={
  <ProtectedRoute roles={['finance', 'admin']}>
    <FinanceModule />
  </ProtectedRoute>
} />
```

### 9.6 Admin Panel Pages (per Module)

Each module in the admin panel follows a consistent page structure:

| Page | Description | Backend API |
|------|-------------|-------------|
| List | Filterable, sortable, paginated data table | `GET /api/{module}?page=&limit=&search=&sort=` |
| Detail | Single record view with related data tabs | `GET /api/{module}/:id` |
| Create | Form with validation | `POST /api/{module}` |
| Edit | Pre-filled form | `PUT /api/{module}/:id` |
| Delete | Confirmation dialog | `DELETE /api/{module}/:id` |
| Bulk Actions | Multi-select + batch operation | `POST /api/{module}/bulk-*` |

### 9.7 Admin Panel Folder Structure (Frontend)

```
admin-panel/
├── src/
│   ├── components/          # Shared UI components
│   │   ├── ui/              # shadcn/ui primitives
│   │   ├── layout/          # Sidebar, Header, PageContainer
│   │   └── shared/          # DataTable, FormModal, FileUpload, etc.
│   ├── hooks/               # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── usePermissions.ts
│   │   └── useDebounce.ts
│   ├── lib/                 # Utilities
│   │   ├── api.ts           # Axios instance + interceptors
│   │   ├── utils.ts
│   │   └── validators.ts
│   ├── modules/             # Feature-based modules
│   │   ├── auth/            # Login, Register, ForgotPassword
│   │   ├── dashboard/       # KPI cards, charts
│   │   ├── inventory/       # Items, Categories, Warehouses, Stock
│   │   ├── orders/          # Sales Orders, Invoices
│   │   ├── procurement/     # Purchase Orders, Vendors
│   │   ├── finance/         # Chart of Accounts, Journal, Reports
│   │   ├── manufacturing/   # BOM, Work Orders
│   │   ├── crm/             # Leads, Opportunities, Pipeline
│   │   ├── hr/              # Employees, Attendance, Payroll
│   │   ├── reports/         # Custom Reports, Export
│   │   ├── settings/        # Organization, Roles, Users
│   │   └── audit/           # Audit Logs viewer
│   ├── stores/              # Zustand stores
│   │   ├── authStore.ts
│   │   └── uiStore.ts       # Sidebar state, theme, etc.
│   ├── types/               # TypeScript type definitions
│   └── App.tsx              # Root with Router + QueryClient
├── public/
├── tailwind.config.ts
├── vite.config.ts
└── package.json
```

### 9.8 Admin Panel End-to-End Workflows

#### 9.8.1 Sales Order — Create & Fulfill

```
User: Sales Representative
Role: sales_rep
Pages: Orders → Create Order

┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 1: Navigate                                                       │
│  Sidebar → Sales → "New Order" button → Create Order page              │
├─────────────────────────────────────────────────────────────────────────┤
│  STEP 2: Select Customer                                                │
│  Search customer dropdown (GET /api/customers?search=)                  │
│  → Auto-populate shipping address, tax exemption, price list           │
│  → React Query caches customer list for next search                    │
├─────────────────────────────────────────────────────────────────────────┤
│  STEP 3: Add Items                                                      │
│  Product search (GET /api/inventory/items?search=&warehouse=)           │
│  → Real-time stock check per warehouse (cached in Redis, 60s TTL)      │
│  → Select product → set quantity → line total calculated client-side   │
│  → Add multiple lines with inline editing                              │
│  → Subtotal, tax, shipping, grand total auto-calculated                │
├─────────────────────────────────────────────────────────────────────────┤
│  STEP 4: Set Order Details                                              │
│  Warehouse, delivery date, payment terms, notes                        │
├─────────────────────────────────────────────────────────────────────────┤
│  STEP 5: Validate & Submit                                              │
│  Client-side: Zod schema validates all required fields                 │
│  → Submit button enabled → POST /api/orders                            │
│  → Server-side validation + stock reservation in DB transaction        │
│  → Backend: BEGIN → lock stock → deduct → create order → COMMIT       │
│  → Backend: enqueue invoice generation (BullMQ)                        │
│  → Backend: invalidate dashboard KPI cache in Redis                    │
│  → Backend: publish event to Redis pub/sub (order.created)             │
├─────────────────────────────────────────────────────────────────────────┤
│  STEP 6: Confirmation                                                   │
│  Success toast → redirect to Order Detail page                         │
│  → React Query invalidates orders list cache → auto-refresh            │
│  → Real-time notification via WebSocket if order status changes        │
├─────────────────────────────────────────────────────────────────────────┤
│  STEP 7: Fulfill                                                        │
│  Order Detail → "Create Shipment" button → POST /api/shipments         │
│  → Warehouse picks items → PATCH /api/shipments/:id/dispatch           │
│  → PATCH /api/orders/:id/status (shipped → delivered)                  │
│  → Customer receives email notification                                │
└─────────────────────────────────────────────────────────────────────────┘
```

#### 9.8.2 Purchase Order — Create & Receive

```
User: Procurement Manager
Role: procurement
Pages: Purchasing → New Purchase Order

┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 1: Reorder Trigger                                                │
│  Dashboard shows stock alerts (items below reorder point)              │
│  → Click "Create PO" on any alert → pre-fills vendor + items           │
│  OR: Manual → Purchasing → New PO → select vendor                     │
├─────────────────────────────────────────────────────────────────────────┤
│  STEP 2: Select Vendor                                                  │
│  GET /api/vendors?search= → vendor detail with ratings + contracts    │
│  → Auto-populate vendor address, payment terms, currency               │
├─────────────────────────────────────────────────────────────────────────┤
│  STEP 3: Add Items                                                      │
│  GET /api/inventory/items → select items → set quantity, unit cost    │
│  → Expected delivery date per line                                     │
│  → Backend: check if item already has pending PO (avoid duplicate)     │
├─────────────────────────────────────────────────────────────────────────┤
│  STEP 4: Submit for Approval                                            │
│  POST /api/purchase-orders → status = 'pending_approval'               │
│  → Backend: create approval_request (polymorphic: PO)                  │
│  → Notification sent to approver (in-app + email)                      │
│  → PO appears in approver's "Pending Approvals" widget                 │
├─────────────────────────────────────────────────────────────────────────┤
│  STEP 5: Approval Flow                                                  │
│  Approver logs in → Dashboard → Pending Approvals → click PO           │
│  → Review PO details inline → Approve / Reject with reason             │
│  → POST /api/approval/requests/:id/approve                             │
│  → Backend: PATCH PO status → 'approved'                              │
│  → Backend: enqueue email notification to requester                    │
├─────────────────────────────────────────────────────────────────────────┤
│  STEP 6: Goods Receipt                                                  │
│  Warehouse receives items → Purchasing → Goods Receipt                 │
│  → Search PO number → POST /api/purchase-orders/:id/receive            │
│  → Backend: validate items → increase warehouse_stock.quantity         │
│  → Backend: insert stock_movements (type: 'purchase')                  │
│  → Backend: update moving average cost                                 │
│  → Backend: invalidate inventory cache keys                            │
├─────────────────────────────────────────────────────────────────────────┤
│  STEP 7: Invoice Matching                                               │
│  Finance → match supplier invoice to PO + goods receipt                │
│  → Three-way match: PO qty = receipt qty = invoice qty                │
│  → POST /api/finance/invoices → link to PO                             │
│  → Status: 'awaiting_payment'                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

#### 9.8.3 Inventory — Stock Transfer & Adjustment

```
User: Inventory Clerk
Role: inventory_clerk
Pages: Inventory → Stock Transfer

┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 1: Initiate Transfer                                              │
│  Inventory → Stock Transfer → "New Transfer"                           │
│  → Select Source Warehouse, Destination Warehouse                     │
├─────────────────────────────────────────────────────────────────────────┤
│  STEP 2: Add Items                                                      │
│  Search items (GET /api/inventory/items)                               │
│  → Shows current stock in source warehouse (Redis cached)              │
│  → Enter transfer quantity → client validates ≤ available              │
├─────────────────────────────────────────────────────────────────────────┤
│  STEP 3: Submit Transfer                                                │
│  POST /api/inventory/transfer                                           │
│  → Backend: BEGIN → lock source stock → deduct → add to destination   │
│  → Backend: insert 2 stock_movements (outbound + inbound)              │
│  → Backend: COMMIT                                                     │
│  → Backend: invalidate stock cache for both warehouses                 │
│  → User sees success with transfer reference number                    │
├─────────────────────────────────────────────────────────────────────────┤
│  STEP 4: Stock Adjustment (Count Correction)                            │
│  Inventory → Stock Count → select warehouse                            │
│  → Enter counted quantity → system shows expected vs difference        │
│  → POST /api/inventory/adjust → reason required (damage, theft, etc.) │
│  → Backend: audit log with before/after values                         │
└─────────────────────────────────────────────────────────────────────────┘
```

#### 9.8.4 Finance — Invoice & Payment

```
User: Finance Officer
Role: finance
Pages: Finance → Invoices

┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 1: Generate Invoice                                               │
│  Finance → Invoices → "New Invoice"                                    │
│  → Select Customer (GET /api/customers?search=)                        │
│  → Select Sales Order (GET /api/orders?status=delivered&invoiced=false)│
│  → Auto-populates line items from order                                │
│  → Tax applied based on customer's tax group                           │
│  → POST /api/finance/invoices                                         │
│  → Backend: double-entry journal entry DR: Accounts Receivable          │
│  →                     CR: Revenue                                      │
│  → Backend: enqueue email to customer with PDF attachment              │
├─────────────────────────────────────────────────────────────────────────┤
│  STEP 2: Receive Payment                                                │
│  Finance → Invoices → select invoice → "Record Payment"                │
│  → Enter amount, payment date, payment method (Bank Transfer/Cash/Cheque)
│  → POST /api/finance/invoices/:id/pay                                  │
│  → Backend: DR: Bank Account, CR: Accounts Receivable                  │
│  → Backend: update invoice status → 'paid'                             │
│  → Backend: invalidate AR aging cache                                  │
├─────────────────────────────────────────────────────────────────────────┤
│  STEP 3: Bank Reconciliation                                            │
│  Finance → Bank Reconciliation → "Start New"                           │
│  → Import bank statement (CSV/OFX upload) → POST /api/bank/import      │
│  → System suggests matches (bank tx ↔ invoice payment)                 │
│  → Review and confirm matches → POST /api/bank/reconciliation/match    │
│  → Backend: mark bank transactions as reconciled                       │
├─────────────────────────────────────────────────────────────────────────┤
│  STEP 4: Financial Reports                                              │
│  Finance → Reports → Select report type                                │
│  → Select date range → "Generate"                                      │
│  → GET /api/finance/income-statement?from=&to=                         │
│  → Results cached in Redis (10m TTL)                                   │
│  → Export as PDF/CSV → POST /api/reports/export                        │
└─────────────────────────────────────────────────────────────────────────┘
```

#### 9.8.5 HR — Employee Onboarding & Payroll

```
User: HR Manager
Role: hr
Pages: HR → Employees

┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 1: Add Employee                                                   │
│  HR → Employees → "Add Employee"                                       │
│  → Form: personal info, department, role, reporting manager            │
│  → File upload: resume, ID proof, offer letter (POST /api/documents)    │
│  → POST /api/hr/employees                                              │
│  → Backend: create user account (if employee needs system access)      │
│  → Backend: enqueue onboarding tasks                                   │
├─────────────────────────────────────────────────────────────────────────┤
│  STEP 2: Attendance Tracking                                            │
│  Employee clocks in → POST /api/hr/attendance/clock-in                 │
│  → Backend: validates no overlapping shift                              │
│  → Real-time dashboard shows who's clocked in                          │
│  HR → Reports → Attendance Report → date range                         │
│  → GET /api/hr/attendance?from=&to=&department=                        │
├─────────────────────────────────────────────────────────────────────────┤
│  STEP 3: Leave Request & Approval                                       │
│  Employee submits → POST /api/hr/leave-requests                        │
│  → status = 'pending_approval'                                         │
│  → Backend: create approval_request (polymorphic: leave)               │
│  → Manager logs in → Dashboard → Pending Approvals → Approve/Reject    │
│  → POST /api/hr/leave-requests/:id/approve                             │
│  → Backend: update employee_leave_balance                              │
├─────────────────────────────────────────────────────────────────────────┤
│  STEP 4: Run Payroll                                                    │
│  HR → Payroll → "Run Payroll" → select period                          │
│  → System calculates: base salary + overtime - deductions - taxes      │
│  → Preview payroll summary before finalizing                           │
│  → POST /api/hr/payroll/run → status = 'calculated'                    │
│  → Review → "Disburse" → POST /api/hr/payroll/disburse                │
│  → Backend: generate journal entry DR: Salary Expense, CR: Bank        │
│  → Backend: enqueue payslip email to each employee                     │
└─────────────────────────────────────────────────────────────────────────┘
```

#### 9.8.6 CRM — Lead-to-Deal Pipeline

```
User: Sales Representative
Role: sales_rep
Pages: CRM → Pipeline

┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 1: Create Lead                                                    │
│  CRM → Leads → "Add Lead"                                              │
│  → Form: company name, contact, source (website/referral/cold call)    │
│  → POST /api/crm/leads → status = 'new'                               │
│  → Lead appears in pipeline kanban board                               │
├─────────────────────────────────────────────────────────────────────────┤
│  STEP 2: Qualify → Convert to Opportunity                               │
│  Drag lead card to "Qualified" column → PATCH /api/crm/leads/:id/stage │
│  → Click "Convert to Opportunity"                                      │
│  → POST /api/crm/opportunities → pre-fills lead data                   │
│  → Set expected value, close date, probability %                       │
├─────────────────────────────────────────────────────────────────────────┤
│  STEP 3: Move Through Pipeline                                          │
│  Pipeline view shows kanban: Qualification → Proposals → Negotiation  │
│  → Drag opportunities between columns → PATCH stage                   │
│  → Activity log: add notes, emails, calls per opportunity              │
│  → Backend: calculate weighted forecast (value × probability)          │
├─────────────────────────────────────────────────────────────────────────┤
│  STEP 4: Close Deal                                                     │
│  → Move to "Closed Won"                                                │
│  → Backend: create deal record                                         │
│  → Backend: optionally create customer record if new                   │
│  → Backend: optionally create sales order (if product sale)            │
│  → Forecast updates, dashboard KPIs refresh                            │
└─────────────────────────────────────────────────────────────────────────┘
```

#### 9.8.7 Manufacturing — Production Run

```
User: Production Manager
Role: production
Pages: Manufacturing → Work Orders

┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 1: Create Work Order                                              │
│  Manufacturing → Work Orders → "New Work Order"                        │
│  → Select Product → auto-loads BOM (GET /api/manufacturing/bom/:id)   │
│  → Set quantity to produce, scheduled start/end dates                  │
│  → POST /api/manufacturing/work-orders → status = 'planned'            │
│  → Backend: check raw material availability against warehouse stock    │
│  → If insufficient stock: flag with warning, suggest purchase order    │
├─────────────────────────────────────────────────────────────────────────┤
│  STEP 2: Start Production                                               │
│  → "Start" → POST /api/manufacturing/work-orders/:id/start             │
│  → Backend: reserve raw materials in warehouse stock                   │
│  → Backend: status → 'in_progress'                                     │
│  → Operations log: track time per operation per work center            │
├─────────────────────────────────────────────────────────────────────────┤
│  STEP 3: Record Material Consumption                                    │
│  → POST /api/manufacturing/work-orders/:id/consume                     │
│  → Backend: deduct raw materials from warehouse stock                  │
│  → Backend: record stock_movements (type: 'manufacturing_consumption') │
├─────────────────────────────────────────────────────────────────────────┤
│  STEP 4: Record Finished Output                                         │
│  → POST /api/manufacturing/work-orders/:id/output                      │
│  → Backend: add finished goods to warehouse stock                      │
│  → Backend: record stock_movements (type: 'manufacturing_output')      │
│  → Backend: update manufacturing cost (actual vs estimated)            │
├─────────────────────────────────────────────────────────────────────────┤
│  STEP 5: Quality Inspection                                             │
│  → POST /api/quality/inspect → link to work_order_output               │
│  → Record pass/fail results per criteria                               │
│  → If failed: route to rework or scrap                                 │
├─────────────────────────────────────────────────────────────────────────┤
│  STEP 6: Complete Work Order                                            │
│  → POST /api/manufacturing/work-orders/:id/complete                    │
│  → Backend: status → 'completed'                                       │
│  → Backend: update product cost (actual)                               │
└─────────────────────────────────────────────────────────────────────────┘
```

#### 9.8.8 Approval Workflow (Cross-Module)

```
Applies to: Purchase Orders, Leave Requests, Invoices, RMA, etc.

┌─────────────────────────────────────────────────────────────────────────┐
│  INITIATOR FLOW:                                                        │
│                                                                         │
│  User submits request (PO/Leave/Invoice)                                │
│  → Backend: creates approval_request (polymorphic)                      │
│  → Backend: determines workflow based on entity type + amount + dept   │
│  → Backend: notification to first-stage approver                       │
│  → User sees in "My Requests" with status 'pending_approval'            │
│                                                                         │
│  APPROVER FLOW:                                                         │
│                                                                         │
│  Approver logs in → Dashboard → "Pending Approvals" widget             │
│  → Click request → slide-out panel with request details                │
│  → Review attached documents (if any)                                  │
│  → Decision: Approve / Reject / Request Changes                        │
│  → POST /api/approval/requests/:id/approve                             │
│  → POST /api/approval/requests/:id/reject  { reason: "..." }          │
│                                                                         │
│  MULTI-STAGE WORKFLOW (e.g., PO > $10,000):                            │
│  Stage 1: Department Manager approves                                  │
│  Stage 2: Finance Director approves                                    │
│  Stage 3: CEO approves (if > $50,000)                                  │
│  → Each stage triggers notification to next approver                   │
│  → Any rejection → whole request cancelled, requester notified         │
│                                                                         │
│  ESCALATION:                                                            │
│  If approver doesn't act within 48h → auto-escalate to next level      │
│  → Backend: cron job checks pending approvals > 48h                    │
└─────────────────────────────────────────────────────────────────────────┘
```

#### 9.8.9 Reporting & Export

```
User: Manager / Admin
Role: manager, admin, finance
Pages: Reports

┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 1: Select Report                                                  │
│  Reports → Available Reports → pick template                           │
│  → GET /api/reports/available → list with descriptions                 │
│  Templates: Sales Summary, Inventory Valuation, AR Aging, P&L, etc.    │
├─────────────────────────────────────────────────────────────────────────┤
│  STEP 2: Configure Parameters                                           │
│  → Date range (from/to)                                                │
│  → Filters: department, warehouse, customer, product category          │
│  → Group by: day/week/month/quarter                                    │
├─────────────────────────────────────────────────────────────────────────┤
│  STEP 3: Generate                                                       │
│  → POST /api/reports/:id/generate                                      │
│  → Backend: query PostgreSQL (optimized with indexes)                  │
│  → Backend: cache result in Redis (300s TTL)                           │
│  → Backend: store in reports table for history                         │
│  → Frontend: display in table + chart (Recharts)                       │
├─────────────────────────────────────────────────────────────────────────┤
│  STEP 4: Export                                                         │
│  → "Export" → select format (PDF / CSV / XLSX)                         │
│  → POST /api/reports/:id/export/:format                                │
│  → Backend: generate file (PDFKit for PDF, exceljs for XLSX)           │
│  → Backend: upload to S3 / local storage                               │
│  → Response: download URL → browser downloads                          │
├─────────────────────────────────────────────────────────────────────────┤
│  STEP 5: Schedule                                                        │
│  → "Schedule" → select frequency (daily/weekly/monthly)                │
│  → POST /api/reports/:id/schedule                                      │
│  → Backend: enqueue BullMQ recurring job                               │
│  → On trigger: generate report → email to distribution list            │
└─────────────────────────────────────────────────────────────────────────┘
```

#### 9.8.10 Data Import (Bulk Operations)

```
User: Admin / Manager
Role: admin
Pages: Data Management → Import

┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 1: Download Template                                              │
│  Data → Import → select entity (Products / Customers / Inventory)      │
│  → Download CSV/Excel template with required columns                   │
├─────────────────────────────────────────────────────────────────────────┤
│  STEP 2: Upload File                                                    │
│  → Select file → POST /api/import/upload (multipart)                   │
│  → Backend: validate file format, column headers                       │
│  → Backend: parse first 5 rows for preview                             │
│  → Frontend: show preview table with column mapping                    │
├─────────────────────────────────────────────────────────────────────────┤
│  STEP 3: Map Columns & Execute                                          │
│  → Auto-map columns by header name → user can adjust mapping           │
│  → POST /api/import/:id/execute                                        │
│  → Backend: enqueue BullMQ job for async processing                    │
│  → Frontend: show progress bar with row count                          │
├─────────────────────────────────────────────────────────────────────────┤
│  STEP 4: Review Results                                                 │
│  → On completion: show success count, error count                      │
│  → GET /api/import/:id/errors → download error log                    │
│  → Fix errors → re-upload corrected rows                               │
└─────────────────────────────────────────────────────────────────────────┘
```

#### 9.8.11 Admin Panel Workflow Summary (Data Flow)

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Browser      │    │  React Query  │    │  Axios        │    │  Backend API  │
│  (React App)  │◄──►│  Cache Layer  │◄──►│  Interceptor  │◄──►│  (Express.js) │
└──────────────┘    └──────────────┘    └──────────────┘    └──────┬───────┘
                                                                   │
                                                  ┌────────────────┼────────────────┐
                                                  │                │                │
                                          ┌───────▼───────┐ ┌──────▼───────┐ ┌──────▼───────┐
                                          │  PostgreSQL    │ │  Redis         │ │  BullMQ       │
                                          │  (Source of    │ │  (Cache +      │ │  (Background  │
                                          │   Truth)       │ │  Session + Pub)│ │   Jobs)       │
                                          └───────────────┘ └───────────────┘ └──────────────┘
```

**Key Data Flow Rules:**
1. **Read operations**: React Query → check Axios cache → GET API → check Redis cache → MISS → query PostgreSQL → cache in Redis → respond → cache in React Query
2. **Write operations**: Mutation → POST/PUT/DELETE API → update PostgreSQL → invalidate Redis cache → invalidate React Query cache → enqueue background jobs → respond
3. **Real-time updates**: WebSocket (Socket.IO) → Redis pub/sub → push to connected clients → update React Query cache
4. **Optimistic updates**: Mutation → immediately update React Query cache → rollback on API error

---

## 10. Background Jobs & Async Processing

**Tool:** BullMQ + Redis

| Job | Trigger | Action | Priority |
|-----|---------|--------|----------|
| Invoice Generation | Order completed | Generate PDF, email to customer | High |
| Payment Confirmation | Webhook received | Update order status, send receipt | High |
| Stock Reorder Alert | Stock < threshold | Notify procurement team | Medium |
| Email Notifications | Various events | Send transactional emails | Medium |
| Report Generation | Scheduled (cron) | Generate and store reports | Low |
| Data Sync | Scheduled | Sync with external systems | Low |
| Cache Warming | App startup / schedule | Pre-populate hot cache keys | Low |
| Bulk Import Processing | File uploaded | Process rows, validate, insert | Low |
| Payroll Processing | Scheduled (monthly) | Calculate salaries, generate payslips | High |
| Asset Depreciation | Scheduled (monthly) | Run depreciation calculations | Medium |
| Currency Rate Update | Scheduled (daily) | Fetch latest exchange rates | Low |
| Database Backup | Scheduled (daily) | pg_dump to S3 | High |

**Workflow:**
```
Controller → enqueue job (add to BullMQ queue) → respond 202 Accepted
Worker → pick up job → process → update DB → ack
         → on failure: retry with backoff (max 3)
         → on permanent failure: move to failed queue, alert admin
```

**BullMQ Configuration:**
```js
const { Queue, Worker, QueueScheduler } = require('bullmq');
const { redisQueue } = require('../config/redis');

const emailQueue = new Queue('email', { connection: redisQueue, defaultJobOptions: {
  attempts: 3,
  backoff: { type: 'exponential', delay: 2000 },
  removeOnComplete: { age: 86400 },
  removeOnFail: { age: 604800 },
}});

const worker = new Worker('email', async job => {
  await sendEmail(job.data);
}, { connection: redisQueue, concurrency: 5 });
```

---

## 11. Testing Strategy

| Layer | Tool | Scope |
|-------|------|-------|
| Unit | Jest | Pure functions, validators, helpers, service logic |
| Integration | Jest + supertest | API endpoints with test DB + test Redis |
| E2E | Playwright | Full user flows across modules |
| Load / Stress | k6 | Critical endpoints (order creation, inventory lookup) |
| Security | OWASP ZAP / nmap | Vulnerability scanning |
| Cache Tests | Jest + ioredis mock | Cache hit/miss behavior, invalidation logic |

**Test DB Setup:** Separate PostgreSQL DB, migrations run before test suite.  
**Test Redis Setup:** Use `ioredis-mock` or separate Redis DB index (db=15).

```json
// jest.config.js
{
  "globalSetup": "./tests/setup/globalSetup.js",
  "globalTeardown": "./tests/setup/globalTeardown.js",
  "testEnvironment": "node",
  "setupFilesAfterSetup": ["./tests/setup/redisMock.js"]
}
```

---

## 12. DevOps & Deployment

### 12.1 Development Environment

```yaml
# docker-compose.yml
services:
  app:
    build: .
    ports: ['5000:5000']
    depends_on: [db, redis]
    environment:
      - NODE_ENV=development
      - DB_HOST=db
      - REDIS_HOST=redis
    volumes:
      - ./src:/app/src

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: erp
      POSTGRES_USER: erp_user
      POSTGRES_PASSWORD: erp_pass
    ports: ['5432:5432']
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports: ['6379:6379']
    command: ['redis-server', '--appendonly', 'yes', '--maxmemory-policy', 'allkeys-lru']
    volumes:
      - redisdata:/data

volumes:
  pgdata:
  redisdata:
```

### 12.2 Environment Variables (.env)

```bash
# App
NODE_ENV=development
PORT=5000
API_PREFIX=/api

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=erp
DB_USER=erp_user
DB_PASSWORD=erp_pass
DB_POOL_MIN=2
DB_POOL_MAX=20

# Redis (Main)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Redis (BullMQ — separate DB)
REDIS_QUEUE_DB=1

# Auth
JWT_SECRET=your-256-bit-secret
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
SESSION_SECRET=session-secret-key

# Encryption
ENCRYPTION_KEY=32-byte-hex-key-for-aes-256

# Email
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=sg-api-key
EMAIL_FROM=noreply@erp.com

# File Storage
STORAGE_PROVIDER=local  # local | s3
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=erp-uploads

# External APIs
CURRENCY_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Monitoring
SENTRY_DSN=https://key@sentry.io/project
```

### 12.3 CI/CD Pipeline (GitHub Actions)

```yaml
name: ERP CI/CD
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run lint

  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_DB: erp_test
          POSTGRES_PASSWORD: test_pass
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports: ['5432:5432']
      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports: ['6379:6379']
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run migrate:up
        env:
          DB_HOST: localhost
          DB_NAME: erp_test
          DB_PASSWORD: test_pass
      - run: npm test
        env:
          DB_HOST: localhost
          DB_NAME: erp_test
          DB_PASSWORD: test_pass
          REDIS_HOST: localhost
          JWT_SECRET: test-secret

  build:
    needs: [lint, test]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - run: docker build -t ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }} .
      - run: docker push ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}

  deploy-staging:
    needs: [build]
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - run: echo "Deploy to staging via SSH or AWS ECS"

  deploy-production:
    needs: [deploy-staging]
    runs-on: ubuntu-latest
    environment: production
    steps:
      - run: echo "Promote to production"
```

### 12.4 Production Architecture

```
                          ┌──────────────────────┐
                          │   Cloudflare DNS + CDN │
                          └──────────┬───────────┘
                                     │
                          ┌──────────▼───────────┐
                          │  Nginx / Traefik      │
                          │  (SSL termination,     │
                          │   reverse proxy, gzip) │
                          └──────────┬───────────┘
                                     │
                          ┌──────────▼───────────┐
                          │  Load Balancer (ALB)  │
                          └──────────┬───────────┘
                    ┌────────────────┼────────────────┐
                    │                │                │
            ┌───────▼───────┐ ┌──────▼───────┐ ┌──────▼───────┐
            │ Node App      │ │ Node App      │ │ Node App      │
            │ (PM2 Cluster) │ │ (PM2 Cluster) │ │ (PM2 Cluster) │
            │ Port 5000     │ │ Port 5000     │ │ Port 5000     │
            └───────┬───────┘ └──────┬───────┘ └──────┬───────┘
                    │                │                │
                    └────────────────┼────────────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
            ┌───────▼───────┐ ┌──────▼───────┐ ┌──────▼───────┐
            │ PostgreSQL    │ │ Redis         │ │ S3 / Local   │
            │ Primary +     │ │ Cache +       │ │ File Storage │
            │ Read Replica  │ │ Queues + Pub  │ │              │
            └───────────────┘ └───────────────┘ └──────────────┘
```

### 12.5 Deployment Options

| Platform | Type | Best For |
|----------|------|----------|
| Railway / Render | PaaS | Quick start, auto-deploy from GitHub |
| VPS (DigitalOcean, Linode) | IaaS | Full control, predictable cost, small teams |
| AWS ECS / Fargate | Container | Production-grade, auto-scaling |
| AWS Elastic Beanstalk | PaaS | Managed, less configuration |
| Kubernetes (EKS / DOKS) | Orchestration | Large scale, multi-service |

### 12.6 PM2 Configuration

```js
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'erp-api',
    script: 'src/server.js',
    instances: 'max',           // cluster mode, use all CPUs
    exec_mode: 'cluster',
    env: { NODE_ENV: 'production' },
    max_memory_restart: '1G',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    error_file: 'logs/error.log',
    out_file: 'logs/output.log',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_restarts: 10,
    restart_delay: 4000,
  }]
};
```

### 12.7 Step-by-Step Deployment Procedures

Each deployment path below is derived from the deployment patterns in the full-stack roadmap.

---

#### 12.7.1 Railway (PaaS — Quick Start)

**Best for:** Rapid prototyping, small teams, automatic deploys from GitHub.

```
1. Push code to GitHub repository
2. Go to railway.com → New Project → Deploy from GitHub repo
3. Railway auto-detects Node.js, sets build command (npm install) and start command (npm start)
4. Add environment variables in Railway dashboard:
   DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
   REDIS_HOST, REDIS_PORT, JWT_SECRET, etc.
5. Add PostgreSQL and Redis plugins via Railway dashboard
6. Set custom domain (optional): Railway dashboard → Settings → Domain
7. Auto-deploy: every push to main triggers a new deployment
```

```bash
# Railway CLI alternative
railway login
railway init
railway up
```

---

#### 12.7.2 Render (PaaS — Free Tier Available)

**Best for:** Student projects, portfolio demos, cost-effective hosting.

```
1. Push code to GitHub
2. Go to render.com → New + → Web Service → Connect GitHub repo
3. Configure:
   - Build Command: npm install
   - Start Command: npm start
   - Select plan (Free/Starter/Pro)
4. Add environment variables in Render dashboard
5. Add PostgreSQL via Render Dashboard → New + → PostgreSQL
6. Render auto-deploys on every push to the connected branch
7. Custom domain: Render dashboard → Settings → Custom Domain
8. SSL auto-provisioned by Render
```

---

#### 12.7.3 Docker Deployment (Any Cloud)

**Best for:** Consistent environments, portable across any provider.

```dockerfile
# Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
USER node
CMD ["node", "src/server.js"]
```

```bash
# Step 1: Build the Docker image
docker build -t erp-backend:latest .

# Step 2: Tag and push to a registry (Docker Hub / GHCR)
docker tag erp-backend:latest ghcr.io/myorg/erp-backend:latest
docker push ghcr.io/myorg/erp-backend:latest

# Step 3: On the production server, pull and run
docker pull ghcr.io/myorg/erp-backend:latest
docker run -d \
  --name erp-api \
  --restart unless-stopped \
  -p 5000:5000 \
  --env-file .env.production \
  -v erp-logs:/app/logs \
  ghcr.io/myorg/erp-backend:latest

# Or use docker-compose on the server
docker compose -f docker-compose.prod.yml up -d
```

```yaml
# docker-compose.prod.yml
services:
  app:
    image: ghcr.io/myorg/erp-backend:latest
    ports: ['5000:5000']
    env_file: .env.production
    depends_on: [db, redis]
    restart: unless-stopped
  db:
    image: postgres:16-alpine
    volumes: ['pgdata:/var/lib/postgresql/data']
    env_file: .env.production
    restart: unless-stopped
  redis:
    image: redis:7-alpine
    command: ['redis-server', '--appendonly', 'yes']
    volumes: ['redisdata:/data']
    restart: unless-stopped
volumes: { pgdata:, redisdata: }
```

---

#### 12.7.4 VPS Deployment (DigitalOcean Droplet / Linode)

**Best for:** Full control, predictable pricing, production apps with moderate traffic.

```
Step 1: Provision a VPS (e.g., DigitalOcean Droplet)
  - OS: Ubuntu 22.04 LTS
  - Plan: at least 2GB RAM, 2 vCPUs
  - Add SSH key for access

Step 2: Initial server setup
```

```bash
# SSH into the server
ssh root@<server-ip>

# Update system and install dependencies
apt update && apt upgrade -y
apt install -y nginx certbot python3-certbot-nginx git curl

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install PM2 globally
npm install -g pm2

# Install PostgreSQL
apt install -y postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql

# Install Redis
apt install -y redis-server
systemctl start redis-server
systemctl enable redis-server
```

```bash
# Step 3: Deploy the application
git clone https://github.com/myorg/erp-backend.git /opt/erp
cd /opt/erp
npm ci --only=production
cp .env.production .env

# Step 4: Set up PostgreSQL database
sudo -u postgres psql -c "CREATE DATABASE erp_prod;"
sudo -u postgres psql -c "CREATE USER erp_user WITH PASSWORD 'STRONG_PASSWORD';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE erp_prod TO erp_user;"

# Step 5: Run migrations
npm run migrate:up

# Step 6: Start with PM2
pm2 start src/server.js -i max --name erp-api
pm2 save
pm2 startup  # this generates a systemd command — run it

# Step 7: Configure Nginx as reverse proxy
```

```nginx
# /etc/nginx/sites-available/erp
server {
    listen 80;
    server_name erp.mycompany.com;

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Admin panel static files (if built separately)
    location / {
        root /var/www/erp-admin/build;
        try_files $uri $uri/ /index.html;
    }

    # File uploads
    location /uploads {
        alias /opt/erp/uploads;
    }
}
```

```bash
# Enable the site and configure SSL
ln -s /etc/nginx/sites-available/erp /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx

# Step 8: Configure SSL with Let's Encrypt (auto-renewing)
certbot --nginx -d erp.mycompany.com

# Step 9: Verify deployment
curl https://erp.mycompany.com/api/health
```

---

#### 12.7.5 DigitalOcean App Platform

**Best for:** Simplified deployment without managing servers.

```
1. Push code to GitHub
2. Go to cloud.digitalocean.com → App Platform → Create App
3. Connect GitHub repository → Select branch (main)
4. Configure:
   - Resource Type: Web Service
   - Build Command: npm install
   - Run Command: npm start
   - HTTP Port: 5000
5. Add environment variables in the App Settings
6. Add PostgreSQL via DigitalOcean Managed Database
7. Add Redis via DigitalOcean Managed Database
8. Enable auto-deploy: every push to main deploys automatically
9. Custom domain + SSL auto-provisioned
10. Set up health checks (path: /api/health)
```

---

#### 12.7.6 AWS Deployment Options

**Best for:** Enterprise production, scalability, full cloud integration.

**Option A: AWS Elastic Beanstalk (PaaS)**

```bash
# Initialize Elastic Beanstalk
npm install -g aws-cli eb-cli
eb init erp-backend --platform node.js --region us-east-1
eb create production-env --cname erp-prod --db.engine postgres --db.i db.t3.micro
eb setenv DB_HOST=xxx DB_USER=xxx DB_PASSWORD=xxx REDIS_HOST=xxx JWT_SECRET=xxx
eb deploy

# Zero-downtime deployment
eb deploy --staged
```

**Option B: AWS ECS with Fargate (Container)**

```
1. Build and push Docker image to Amazon ECR:
   aws ecr create-repository --repository-name erp-backend
   docker build -t erp-backend .
   docker tag erp-backend:latest <account>.dkr.ecr.<region>.amazonaws.com/erp-backend:latest
   docker push <account>.dkr.ecr.<region>.amazonaws.com/erp-backend:latest

2. Create ECS Cluster (Fargate) via AWS Console or CDK

3. Define Task Definition:
   - Container: erp-backend, port 5000
   - Environment variables from AWS Secrets Manager
   - CPU: 1 vCPU, Memory: 2GB

4. Create ECS Service:
   - Tasks: 2 (min), 8 (max) with auto-scaling
   - Load Balancer: Application Load Balancer (ALB)
   - Health check: /api/health

5. Set up Auto Scaling:
   - Target: 70% CPU
   - Scale out: +2 tasks
   - Scale in: -1 task after 15 min below threshold

6. Add RDS PostgreSQL + ElastiCache Redis
7. Configure CodePipeline: GitHub → Build (CodeBuild) → Deploy (ECS)
```

**Option C: EC2 (VPS-style, full control)**

```
Same as VPS Deployment (section 12.7.4) but on EC2 instances behind an ALB.
```

---

#### 12.7.7 Domain Configuration + DNS + SSL

```
Step 1: Purchase a domain (Namecheap, GoDaddy, Cloudflare Registrar)

Step 2: Point DNS to your hosting provider:

  ┌──────────────────────────────────────────────────────────────┐
  │ Platform      │ Record Type │ Name  │ Value                  │
  ├──────────────────────────────────────────────────────────────┤
  │ Railway       │ CNAME       │ @     │ railway.app            │
  │ Render        │ CNAME       │ @     │ onrender.com           │
  │ DigitalOcean  │ A           │ @     │ <droplet-ip>           │
  │ AWS (ALB)     │ CNAME       │ @     │ <alb-dns>.elb.amazonaws│
  │ Cloudflare    │ A           │ @     │ <origin-ip>            │
  └──────────────────────────────────────────────────────────────┘

Step 3: Configure SSL:
  - Railway/Render/Vercel: SSL auto-provisioned for custom domains
  - VPS/Droplet: Use Certbot + Let's Encrypt (auto-renewing)
  - AWS: Use ACM (AWS Certificate Manager) for ALB
  - Cloudflare: Enable Full (Strict) SSL mode

Step 4: Verify SSL:
  curl -I https://erp.mycompany.com
  # Look for: HTTP/2 200 and SSL certificate valid

Step 5: Set up redirects (HTTP → HTTPS):
  - Nginx: return 301 https://$host$request_uri;
  - Cloudflare: Always Use HTTPS (one click)
  - ALB: Listen on port 80 → redirect to 443
```

---

#### 12.7.8 Vercel (Frontend / Admin Panel Deployment)

**Best for:** Deploying the React admin panel frontend with automatic preview URLs for every PR.

```
1. Push frontend code to GitHub (separate repo or /admin subdirectory)
2. Go to vercel.com → Import Project → Connect GitHub repo
3. Vercel auto-detects framework (Vite/React) — configure:
   - Build Command: npm run build
   - Output Directory: dist
   - Install Command: npm ci
4. Add environment variables:
   VITE_API_URL=https://api.erp.mycompany.com/api
   VITE_APP_NAME=ERP Admin
5. Every push:
   - PR branch → creates preview URL: erp-admin-git-feature.vercel.app
   - Merge to main → deploys to production: admin.erp.mycompany.com
6. Custom domain: Vercel dashboard → Domains → add admin.erp.mycompany.com
7. SSL auto-provisioned by Vercel
```

```bash
# Vercel CLI alternative
npm i -g vercel
vercel --prod
```

**Preview Deployments Flow (from roadmap):**
```
Feature branch push → Vercel creates preview URL → Reviewers test → Merge to main → Production deploy
```

---

#### 12.7.9 Kubernetes Deployment (Production-Grade Orchestration)

**Best for:** Large-scale, multi-service, auto-scaling, self-healing infrastructure.

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: erp-api
  namespace: erp
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 0
      maxSurge: 1
  selector:
    matchLabels:
      app: erp-api
  template:
    metadata:
      labels:
        app: erp-api
    spec:
      containers:
        - name: api
          image: ghcr.io/myorg/erp-backend:latest
          ports:
            - containerPort: 5000
          envFrom:
            - secretRef:
                name: erp-secrets
            - configMapRef:
                name: erp-config
          livenessProbe:
            httpGet:
              path: /api/health
              port: 5000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /api/health/ready
              port: 5000
            initialDelaySeconds: 5
            periodSeconds: 5
          resources:
            requests:
              cpu: 250m
              memory: 512Mi
            limits:
              cpu: 1
              memory: 1Gi
---
# k8s/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: erp-api-service
  namespace: erp
spec:
  type: ClusterIP
  selector:
    app: erp-api
  ports:
    - port: 80
      targetPort: 5000
---
# k8s/hpa.yaml (Horizontal Pod Autoscaler)
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: erp-api-hpa
  namespace: erp
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: erp-api
  minReplicas: 3
  maxReplicas: 15
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
---
# k8s/ingress.yaml (with SSL)
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: erp-ingress
  namespace: erp
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - api.erp.mycompany.com
      secretName: erp-tls
  rules:
    - host: api.erp.mycompany.com
      http:
        paths:
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: erp-api-service
                port:
                  number: 80
```

```bash
# K8s deployment commands
kubectl create namespace erp
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/hpa.yaml
kubectl apply -f k8s/ingress.yaml

# Rolling update
kubectl set image deployment/erp-api api=ghcr.io/myorg/erp-backend:v2.0.0

# Scale manually
kubectl scale deployment/erp-api --replicas=5

# View status
kubectl get pods -n erp -w
kubectl get hpa -n erp
```

---

#### 12.7.10 CloudFront CDN Setup (Global Content Delivery)

**Best for:** Caching static assets, API responses, and file uploads at edge locations worldwide.

```
Step 1: Upload static files to S3 bucket
  aws s3 sync ./admin-panel/dist s3://erp-static-assets/admin/
  aws s3 cp --recursive s3://erp-static-assets s3://erp-static-assets-eu --region eu-west-1

Step 2: Create CloudFront Distribution
  - Origin 1: S3 bucket (erp-static-assets.s3.amazonaws.com)
    - Path pattern: /admin/*
    - Viewer protocol: Redirect HTTP to HTTPS
  - Origin 2: API Load Balancer (erp-alb-123.elb.amazonaws.com)
    - Path pattern: /api/*
    - Viewer protocol: HTTPS only

Step 3: Configure cache behaviors
  - /admin/* → Caching: 24h, TTL min=3600, max=86400
  - /api/* → Caching: 0s (dynamic content, pass through)
  - /uploads/* → Caching: 1h, TTL min=600, max=3600
  - /api/health → No caching

Step 4: Custom domain + SSL
  - Alternate domain: cdn.erp.mycompany.com
  - SSL: Custom SSL Certificate (ACM)

Step 5: Point DNS
  - CNAME: cdn.erp.mycompany.com → d123abc.cloudfront.net

Step 6: Invalidate cache on deploy
  aws cloudfront create-invalidation --distribution-id E123 --paths "/*"
```

---

#### 12.7.11 Auto-Scaling Strategy (from Roadmap)

Following the roadmap's scaling pattern, define auto-scaling rules for each layer:

```
┌─────────────────────────────────────────────────────────────────┐
│            AUTO-SCALING RULES (Roadmap Pattern)                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  App Layer (Horizontal Pod Autoscaler / AWS Auto Scaling)       │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Metric: CPU > 70% for 5 minutes                           │  │
│  │ Action: Add 1 instance (up to max: 8)                     │  │
│  │ Cooldown: 3 minutes before next scale-up                  │  │
│  ├───────────────────────────────────────────────────────────┤  │
│  │ Metric: CPU < 30% for 15 minutes                          │  │
│  │ Action: Remove 1 instance (down to min: 2)                │  │
│  │ Cooldown: 10 minutes before next scale-down               │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Database Layer (Read Replicas)                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Metric: DB CPU > 75% OR Connections > 80% of max          │  │
│  │ Action: Add read replica (up to max: 5 read replicas)     │  │
│  ├───────────────────────────────────────────────────────────┤  │
│  │ Metric: DB CPU < 30% AND Connections < 40% for 30 min     │  │
│  │ Action: Remove read replica (down to min: 1)              │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Queue Workers (BullMQ)                                         │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Metric: Queue depth > 500 for 2 minutes                   │  │
│  │ Action: Spin up 2 additional workers                      │  │
│  ├───────────────────────────────────────────────────────────┤  │
│  │ Metric: Queue depth < 50 for 10 minutes                   │  │
│  │ Action: Reduce workers to baseline (2)                    │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Redis Cache                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Metric: Memory usage > 75% for 5 minutes                  │  │
│  │ Action: Increase maxmemory OR failover to larger node     │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

#### 12.7.12 CI/CD Pipeline Workflow (Aligned with Roadmap)

The complete CI/CD workflow based on the roadmap's deployment and CI/CD workflow patterns:

```
┌─────────────────────────────────────────────────────────────────┐
│           ERP CI/CD WORKFLOW (Roadmap-Aligned)                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Developer creates feature branch from main                     │
│       │                                                         │
│       ▼                                                         │
│  Push feature branch → GitHub Actions triggers CI               │
│       │                                                         │
│       ├── lint (ESLint + Prettier)                              │
│       ├── type-check (TypeScript)                               │
│       ├── unit tests (Jest)                                     │
│       ├── integration tests (Jest + supertest)                  │
│       └── build check (Docker build)                            │
│       │                                                         │
│       ▼ (all pass)                                              │
│  Open Pull Request → CI re-runs on PR                           │
│       │                                                         │
│       └── code review → approval → squash merge to main         │
│                                                                 │
│       ▼                                                         │
│  Push to main → Full pipeline triggers:                         │
│       │                                                         │
│       ├── lint + type-check + test + build                      │
│       ├── build & push Docker image to registry                 │
│       ├── run DB migrations (idempotent)                        │
│       ├── deploy to staging environment                         │
│       │   └── smoke tests (health check + critical flows)       │
│       ├── manual approval gate (or auto if tests pass)          │
│       └── deploy to production:                                 │
│           ├── Pull image on all nodes (rolling update)          │
│           ├── Run pending migrations                            │
│           ├── Health check: /api/health (expect 200)            │
│           ├── Warm cache: npm run cache:warm                    │
│           ├── Invalidate CDN cache (CloudFront)                 │
│           └── Notify team (Slack: deploy succeeded)             │
│                                                                 │
│  On failure at any stage:                                       │
│       └── Notify team (Slack: build failed)                     │
│       └── Rollback: re-deploy previous known-good image         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

```yaml
# .github/workflows/ci.yml — triggered on PR and feature branch pushes
name: CI
on:
  pull_request:
    branches: [main, develop]
  push:
    branches-ignore: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_DB: erp_test
          POSTGRES_PASSWORD: test_pass
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports: ['5432:5432']
      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports: ['6379:6379']
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run migrate:up
        env:
          DB_HOST: localhost
          DB_NAME: erp_test
          DB_PASSWORD: test_pass
          REDIS_HOST: localhost
          JWT_SECRET: test-secret
      - run: npm test
        env:
          DB_HOST: localhost
          DB_NAME: erp_test
          DB_PASSWORD: test_pass
          REDIS_HOST: localhost
          JWT_SECRET: test-secret

---
# .github/workflows/deploy.yml — triggered on merge to main
name: Deploy
on:
  push:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test-and-build:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_DB: erp_test
          POSTGRES_PASSWORD: test_pass
        ports: ['5432:5432']
      redis:
        image: redis:7-alpine
        ports: ['6379:6379']
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run lint
      - run: npm test
        env:
          DB_HOST: localhost
          DB_NAME: erp_test
          DB_PASSWORD: test_pass
          REDIS_HOST: localhost
          JWT_SECRET: test-secret
      - name: Build & push Docker image
        run: |
          docker build -t ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }} .
          docker tag ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }} ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest
          docker push --all-tags ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}

  deploy-staging:
    needs: [test-and-build]
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - name: Deploy to staging
        run: |
          ssh deploy@${{ secrets.STAGING_HOST }} "
            docker pull ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }} &&
            docker stop erp-api-staging || true &&
            docker rm erp-api-staging || true &&
            docker run -d --name erp-api-staging \
              -p 5001:5000 \
              --env-file /opt/erp/.env.staging \
              ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }} &&
            sleep 10 &&
            npm run migrate:up &&
            curl -f http://localhost:5001/api/health
          "
      - name: Run smoke tests
        run: |
          curl -f https://staging.erp.mycompany.com/api/health
          curl -f https://staging.erp.mycompany.com/api/auth/login -X POST -d '{"email":"test@test.com","password":"test"}'

  deploy-production:
    needs: [deploy-staging]
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://api.erp.mycompany.com
    steps:
      - name: Notify deployment start
        run: |
          curl -X POST ${{ secrets.SLACK_WEBHOOK }} \
            -H 'Content-Type: application/json' \
            -d '{"text": "🚀 Deploying ERP API v${{ github.sha }} to production..."}'

      - name: Rolling update to production
        run: |
          ssh deploy@${{ secrets.PROD_HOST_1 }} "
            docker pull ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }} &&
            docker stop erp-api-1 || true &&
            docker rm erp-api-1 || true &&
            docker run -d --name erp-api-1 \
              -p 5000:5000 \
              --env-file /opt/erp/.env.production \
              ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }} &&
            sleep 5 &&
            curl -f http://localhost:5000/api/health
          "

      - name: Run pending migrations
        run: |
          ssh deploy@${{ secrets.PROD_HOST_1 }} "
            docker exec erp-api-1 npm run migrate:up
          "

      - name: Update remaining nodes
        run: |
          for host in "${{ secrets.PROD_HOST_2 }}" "${{ secrets.PROD_HOST_3 }}"; do
            ssh deploy@$host "
              docker pull ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }} &&
              docker stop erp-api || true &&
              docker rm erp-api || true &&
              docker run -d --name erp-api \
                -p 5000:5000 \
                --env-file /opt/erp/.env.production \
                ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
            "
          done

      - name: Warm cache
        run: |
          curl -X POST https://api.erp.mycompany.com/api/admin/cache/warm \
            -H "Authorization: Bearer ${{ secrets.ADMIN_TOKEN }}"

      - name: Invalidate CDN
        run: |
          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.CLOUDFRONT_DIST_ID }} \
            --paths "/*"

      - name: Notify deployment success
        if: success()
        run: |
          curl -X POST ${{ secrets.SLACK_WEBHOOK }} \
            -H 'Content-Type: application/json' \
            -d '{"text": "✅ ERP API v${{ github.sha }} deployed successfully to production"}'

      - name: Notify deployment failure
        if: failure()
        run: |
          curl -X POST ${{ secrets.SLACK_WEBHOOK }} \
            -H 'Content-Type: application/json' \
            -d '{"text": "❌ ERP API v${{ github.sha }} deployment FAILED. Rolling back..."}'
```

---

## 13. Monitoring & Observability

Follows the roadmap pattern: Instrument → Scrape → Visualize → Alert.

### 13.1 Prometheus Metrics Endpoint

```js
// src/config/metrics.js (using prom-client)
const client = require('prom-client');

const register = new client.Registry();
client.collectDefaultMetrics({ register });

// Custom ERP metrics
const httpRequestDuration = new client.Histogram({
  name: 'erp_http_request_duration_seconds',
  help: 'HTTP request latency in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register],
});

const httpRequestsTotal = new client.Counter({
  name: 'erp_http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

const dbQueryDuration = new client.Histogram({
  name: 'erp_db_query_duration_seconds',
  help: 'Database query latency',
  labelNames: ['query_name'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
  registers: [register],
});

const cacheHitRatio = new client.Gauge({
  name: 'erp_cache_hit_ratio',
  help: 'Redis cache hit ratio per key pattern',
  labelNames: ['key_pattern'],
  registers: [register],
});

const queueDepth = new client.Gauge({
  name: 'erp_queue_depth',
  help: 'BullMQ queue depth per queue name',
  labelNames: ['queue_name', 'status'],
  registers: [register],
});

const stockReservationFailures = new client.Counter({
  name: 'erp_stock_reservation_failures_total',
  help: 'Count of failed stock reservations due to insufficient stock',
  registers: [register],
});

// Metrics endpoint
app.get('/api/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

### 13.2 Prometheus Scrape Configuration

```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'erp-api'
    static_configs:
      - targets: ['localhost:5000']
    metrics_path: '/api/metrics'
    relabel_configs:
      - source_labels: [__address__]
        target_label: instance
        replacement: 'erp-api-prod'

  - job_name: 'postgresql'
    static_configs:
      - targets: ['localhost:9187']  # postgres_exporter

  - job_name: 'redis'
    static_configs:
      - targets: ['localhost:9121']  # redis_exporter

  - job_name: 'node'
    static_configs:
      - targets: ['localhost:9100']  # node_exporter (system metrics)
```

### 13.3 Grafana Dashboard Panels (Roadmap-Aligned)

```json
{
  "title": "ERP Production Dashboard",
  "panels": [
    {
      "title": "Request Rate (req/s) by Endpoint",
      "type": "graph",
      "targets": [
        {
          "expr": "rate(erp_http_requests_total[5m])",
          "legendFormat": "{{route}}"
        }
      ]
    },
    {
      "title": "Latency Heatmap (p50, p95, p99)",
      "type": "heatmap",
      "targets": [
        {
          "expr": "histogram_quantile(0.50, rate(erp_http_request_duration_seconds_bucket[5m]))",
          "legendFormat": "p50"
        },
        {
          "expr": "histogram_quantile(0.95, rate(erp_http_request_duration_seconds_bucket[5m]))",
          "legendFormat": "p95"
        },
        {
          "expr": "histogram_quantile(0.99, rate(erp_http_request_duration_seconds_bucket[5m]))",
          "legendFormat": "p99"
        }
      ]
    },
    {
      "title": "Error Rate % by Module",
      "type": "graph",
      "targets": [
        {
          "expr": "sum(rate(erp_http_requests_total{status_code=~'5..'}[5m])) / sum(rate(erp_http_requests_total[5m])) * 100",
          "legendFormat": "error_rate"
        }
      ]
    },
    {
      "title": "Cache Hit Ratio %",
      "type": "gauge",
      "targets": [
        {
          "expr": "erp_cache_hit_ratio * 100"
        }
      ]
    },
    {
      "title": "BullMQ Queue Depth",
      "type": "graph",
      "targets": [
        {
          "expr": "erp_queue_depth",
          "legendFormat": "{{queue_name}}-{{status}}"
        }
      ]
    },
    {
      "title": "DB Connection Pool Utilization",
      "type": "graph",
      "targets": [
        {
          "expr": "pg_stat_database_numbackends / pg_settings_max_connections * 100"
        }
      ]
    },
    {
      "title": "Redis Memory Usage",
      "type": "gauge",
      "unit": "bytes",
      "targets": [
        {
          "expr": "redis_memory_used_bytes / redis_memory_max_bytes * 100"
        }
      ]
    },
    {
      "title": "HTTP Status Code Breakdown",
      "type": "pie",
      "targets": [
        {
          "expr": "sum(rate(erp_http_requests_total[5m])) by (status_code)"
        }
      ]
    }
  ]
}
```

### 13.4 Alert Rules (PagerDuty / Slack)

```yaml
# prometheus-alerts.yml
groups:
  - name: erp-alerts
    rules:
      - alert: HighErrorRate
        expr: rate(erp_http_requests_total{status_code=~"5.."}[5m]) / rate(erp_http_requests_total[5m]) > 0.05
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Error rate > 5% for 2 minutes"
          description: "ERP API error rate is {{ $value | humanizePercentage }}"

      - alert: HighLatency
        expr: histogram_quantile(0.95, rate(erp_http_request_duration_seconds_bucket[5m])) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "p95 latency > 2s"
          description: "p95 latency is {{ $value }}s"

      - alert: QueueBacklog
        expr: erp_queue_depth{status="waiting"} > 1000
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "BullMQ queue backlog > 1000"
          description: "Queue {{ $labels.queue_name }} has {{ $value }} waiting jobs"

      - alert: CacheHitRateLow
        expr: erp_cache_hit_ratio < 0.7
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Cache hit rate < 70%"
          description: "Hit rate is {{ $value | humanizePercentage }}"

      - alert: StockReservationFailures
        expr: rate(erp_stock_reservation_failures_total[5m]) > 0
        for: 1m
        labels:
          severity: warning
        annotations:
          summary: "Stock reservation failures detected"
```

### 13.5 Logging Pipeline (Structured Logging)

```js
// src/config/logger.js — using Pino (structured JSON)
const pino = require('pino');

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label }),
    bindings: () => ({}),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: ['req.headers.authorization', 'req.body.password', 'req.body.token'],
  transport: process.env.NODE_ENV === 'development'
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,
});

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info({
      type: 'request',
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: Date.now() - start,
      userId: req.user?.id,
      orgId: req.user?.org,
      traceId: req.headers['x-trace-id'],
    });
  });
  next();
});

// Audit log helper (used in service layer)
function auditLog(action, entityType, entityId, changes, userId) {
  logger.info({
    type: 'audit',
    action,
    entityType,
    entityId,
    changes: JSON.stringify(changes),
    userId,
  });
}
```

### 13.6 Tools Summary

| Tool | Purpose | Integration |
|------|---------|-------------|
| PM2 | Process management, auto-restart, clustering | `pm2 start server.js -i max` |
| Pino | Structured JSON logging | `pino` package + `pino-pretty` in dev |
| Sentry | Error tracking with context (user, request, breadcrumbs) | `@sentry/node` — init in `app.js` |
| Prometheus | Metrics collection & storage | `prom-client` — expose `/api/metrics` |
| Grafana | Dashboards & visualization | Connect Prometheus data source |
| Redis Exporter | Redis metrics (memory, hit rate, clients) | `redis_exporter` sidecar |
| postgres_exporter | DB metrics (connections, queries, deadlocks) | `postgres_exporter` sidecar |
| node_exporter | System metrics (CPU, memory, disk) | `node_exporter` sidecar |
| BullMQ Dashboard | Queue monitoring UI | `bull-board` Express middleware at `/admin/queues` |
| Health Check | Liveness + readiness probes | `GET /api/health` and `GET /api/health/ready` |
| Uptime Robot | External uptime monitoring per 5m | HTTP check against `https://api.erp.mycompany.com/health` |
| Log rotation | Rotate PM2 logs weekly | `logrotate` config for `/var/log/pm2/*.log` |

**Key Metrics to Track:**
- API p50/p95/p99 response times per endpoint
- Error rate by endpoint and module (target: < 1%)
- DB connection pool utilization (target: < 80%)
- Cache hit/miss ratio per key pattern (target: > 80%)
- Queue depth per BullMQ queue (alert: > 500)
- Stock reservation failure rate (target: 0)
- Order throughput (orders/min)
- Redis memory usage (target: < 75% of maxmemory)
- Active users and sessions per hour
- Disk usage on VPS (alert: > 85%)

---

## 14. ERP Module Implementation Order

**Dependency Rules Applied:**
1. **Foundation first** — Auth, multi-tenant, audit
2. **Cross-cutting infrastructure** — Notifications, Documents, Import/Export (needed by almost all modules)
3. **Master data** — Inventory, Products, Warehouses, Customers, Vendors
4. **Financial core** — Chart of Accounts, Journals, Tax **BEFORE** transactional modules
5. **Transactional modules** — Sales, Purchase, Shipping (all need Finance for journal entries)
6. **Dependent operations** — Manufacturing, RMA, QC (need Inventory + Orders)
7. **Parallel tracks** — CRM, HR/Payroll, Projects (independent after master data)
8. **Meta-modules** — Approvals, Multi-currency, Assets, Banking (depend on transactional)
9. **Intelligence** — Reporting, Dashboards (need data from all above)
10. **External** — Customer Portal (last)

| Phase | Module | Dependencies | Rationale | Est. Time |
|-------|--------|--------------|-----------|-----------|
| 1 | Auth + Users + Roles + Organizations | — | Foundation for multi-tenant access | 2 weeks |
| 2 | Organization Settings + Audit Trail | 1 | System-wide config, compliance baseline | 1 week |
| 3 | Notifications Engine (in-app, email, SMS) | 1,2 | **Cross-cutting** — order confirmations, alerts, reminders | 1 week |
| 4 | Document Management (attachments, versions) | 1,2 | **Cross-cutting** — files on customers, orders, invoices, employees | 1 week |
| 5 | Data Import/Export (CSV, Excel) | 1,2 | **Cross-cutting** — initial data migration, bulk ops | 1 week |
| 6 | Inventory + Categories + Warehouses + Products | 1,2 | Core master data for all transactions | 3 weeks |
| 7 | Customers + Vendors | 1,2,6 | Business partner master data | 1 week |
| 8 | Finance + Chart of Accounts + Journals + Tax | 1,2 | **Financial core** — MUST be before Sales/Purchase for journal entries | 3 weeks |
| 9 | Sales Orders + Order Workflow + Invoicing | 1,2,6,7,8 | Revenue core — creates AR journals, checks stock, generates invoices | 3 weeks |
| 10 | Purchase Orders + Goods Receipt | 1,2,6,7,8 | Replenishment — creates AP journals, updates stock valuation | 2 weeks |
| 11 | Shipping + Deliveries | 1,2,6,9 | Logistics — from sales order to delivery | 2 weeks |
| 12 | RMA + Returns | 1,2,6,9,11 | Reverse logistics — needs sales order + shipping | 1 week |
| 13 | Manufacturing + BOM + Work Orders + QC | 1,2,6,10 | Production — needs inventory, purchase receipt for materials | 3 weeks |
| 14 | CRM + Leads + Opportunities | 1,2,7 | Sales pipeline — semi-independent after Customers | 2 weeks |
| 15 | HR + Attendance + Leave | 1,2 | Workforce management — independent track | 2 weeks |
| 16 | Payroll | 1,2,8,15 | Salary processing — needs Finance for journal entries | 2 weeks |
| 17 | Project Management + Timesheets | 1,2,15 | Project tracking — needs HR for resources | 2 weeks |
| 18 | Approval Workflows | 1,2,10,15,16 | Cross-module engine — after PO, Leave, Invoice, Payroll exist | 2 weeks |
| 19 | Multi-Currency + Exchange Rates | 1,2,8 | International ops — needs Finance for FX gain/loss | 1 week |
| 20 | Fixed Assets + Depreciation | 1,2,8 | Asset lifecycle — needs Finance for journals | 1 week |
| 21 | Bank Reconciliation | 1,2,8,19 | Financial accuracy — needs Finance, Multi-currency | 1 week |
| 22 | Budgeting + Forecasting | 1,2,8,21 | Financial planning — needs Finance, Chart of Accounts | 1 week |
| 23 | Reporting Engine + Custom Reports | 1,2,9,10,11,12,13,16,22 | BI — needs data from transactional modules | 2 weeks |
| 24 | Dashboards + KPIs | 1,2,23 | Role-specific views — after Reporting | 1 week |
| 25 | Customer Portal (self-service) | 1,2,9,10,11,14,19 | External access — needs customer-facing modules + docs | 2 weeks |
| 26 | Performance Optimization + Caching | All | Load tuning — ongoing | Ongoing |

---

### Dependency Graph (Critical Path)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CRITICAL PATH (Longest Dependency Chain)             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Auth (1) ──► Org Settings (2) ──► Inventory/Products (6) ──► Customers   │
│                      │                                                 │    │
│                      └──► Notifications (3) ◄───┘                        │    │
│                      └──► Documents (4) ◄─────────────────────────────────┘    │
│                      └──► Import/Export (5) ◄────────────────────────────────┘   │
│                                                                             │
│                      ┌──────────────────────────────────────────────────┐   │
│                      │  Finance + COA + Tax (8)  ◄─── MUST BEFORE ─────┘   │
│                      └──────────────────────────────────────────────────┘   │
│                                    │                                        │
│                     ┌──────────────┼──────────────┐                        │
│                     ▼              ▼              ▼                         │
│              Sales Orders      Purchase       Payroll                      │
│              + Invoicing       Orders + GR     (16)                       │
│              (9)               (10)            │                           │
│                     │              │             │                          │
│                     ▼              ▼             │                          │
│              Shipping (11)  Manufacturing    Approvals                     │
│              (12)           (13)          (18)                             │
│                                    │             │                          │
│                                    └──────┬──────┘                          │
│                                           ▼                                 │
│                              Multi-Currency (19)                            │
│                              Fixed Assets (20)                              │
│                              Bank Recon (21)                                │
│                              Budgeting (22)                                 │
│                                           │                                 │
│                                           ▼                                 │
│                              Reporting (23) ◄─── All data sources           │
│                                           │                                 │
│                                           ▼                                 │
│                              Dashboards (24)                                │
│                                           │                                 │
│                                           ▼                                 │
│                              Customer Portal (25)                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

Parallel tracks (can run concurrently after Phase 8):
  • CRM (14) ──► Leads → Opportunities → Deals
  • HR/Payroll (15,16) ──► Attendance → Leave → Payroll
  • Projects (17) ──► Tasks → Timesheets
```

---

## 15. Development Scripts (package.json)

```json
{
  "scripts": {
    "dev": "nodemon src/server.js",
    "start": "node src/server.js",
    "lint": "eslint src/",
    "lint:fix": "eslint src/ --fix",
    "format": "prettier --write src/",
    "test": "jest --coverage --forceExit",
    "test:watch": "jest --watch",
    "test:integration": "jest --testPathPattern=integration --forceExit",
    "test:e2e": "jest --testPathPattern=e2e --forceExit",
    "migrate:up": "node-pg-migrate up",
    "migrate:down": "node-pg-migrate down",
    "migrate:create": "node-pg-migrate create",
    "seed": "node seeds/run.js",
    "seed:demo": "node scripts/seedDemo.js",
    "docker:dev": "docker compose up",
    "docker:build": "docker build -t erp-backend .",
    "docker:push": "docker push ghcr.io/org/erp-backend",
    "cache:warm": "node scripts/warmCache.js",
    "queue:worker": "node src/jobs/worker.js",
    "queue:dashboard": "bull-board",
    "db:backup": "pg_dump erp > backups/erp_$(date +%F).sql"
  }
}
```

---

## 16. Key NPM Dependencies

### Production

| Package | Purpose |
|---------|---------|
| express | Web framework |
| pg | PostgreSQL driver |
| knex | Query builder / SQL builder |
| ioredis | Redis client (cache, pub/sub, sessions) |
| bullmq | Background jobs |
| joi / zod | Request validation |
| jsonwebtoken | JWT auth |
| bcrypt | Password hashing |
| helmet | Security headers |
| cors | CORS middleware |
| express-rate-limit | Rate limiting |
| rate-limit-redis | Redis-backed rate limit store |
| express-session | Session management |
| connect-redis | Redis session store |
| winston / pino | Logging |
| dotenv | Environment variables |
| multer | File upload handling |
| aws-sdk / @aws-sdk/client-s3 | S3 file storage |
| nodemailer | Email sending |
| handlebars / ejs | Email templates |
| uuid | UUID generation |
| dayjs / date-fns | Date manipulation |
| lodash | Utility functions |
| compression | Gzip response compression |
| prom-client | Prometheus metrics |
| @sentry/node | Error tracking |
| bull-board | Queue management UI |
| exceljs / csv-parse | Import/export |
| pdfkit | PDF generation |
| otplib | TOTP for 2FA |
| node-pg-migrate | Database migrations |

### Development

| Package | Purpose |
|---------|---------|
| nodemon | Auto-restart on file changes |
| jest | Test runner |
| supertest | HTTP assertion testing |
| ioredis-mock | Redis mock for tests |
| eslint + prettier | Code quality |
| husky + lint-staged | Git hooks |

---

## 17. Deployment Checklist (Production)

```
[ ] Environment variables set on host/secrets manager (DB, Redis, JWT, email, S3, Sentry)
[ ] PostgreSQL backups scheduled (pg_dump to S3, daily)
[ ] PostgreSQL connection pool sized correctly (max_connections)
[ ] Redis maxmemory set with appropriate eviction policy
[ ] Redis persistence (AOF / RDB) configured
[ ] SSL certificate configured and auto-renewing (Let's Encrypt)
[ ] CORS whitelist set to production domain only
[ ] Rate limiting enabled with Redis-backed store
[ ] Error tracking (Sentry) configured with release tracking
[ ] Health check endpoint (/api/health) returns 200 with DB + Redis status
[ ] PM2 configured with cluster mode, auto-restart, max memory limit
[ ] Log rotation configured (logrotate or PM2)
[ ] Database migrations applied and verified
[ ] Seed data / demo data disabled in production
[ ] Load test passed for expected traffic (k6)
[ ] Audit logging active and logs shipped to central store
[ ] Database indexes created for all query patterns
[ ] Cache warming script runs on deploy (critical inventory/catalog data)
[ ] Queue workers running (BullMQ) for background jobs
[ ] Reverse proxy (Nginx) configured with rate limiting + gzip + SSL
[ ] Monitoring dashboards set up (Grafana + Prometheus)
[ ] Alert thresholds configured (error rate, latency, Redis memory, disk space)
[ ] Backup restore tested at least once
[ ] Security headers verified (Helmet)
[ ] File upload size limits configured
[ ] API documentation published (OpenAPI/Swagger)
[ ] Rollback plan documented (previous Docker image, DB migration revert)
```

---

## 18. Future Scalability Path

```
Phase 1: Monolith (all modules in one deployable app)
  → Shared PostgreSQL, shared Redis

Phase 2: Modular Monolith (code separated by module, single deploy)
  → API gateway pattern emerges
  → Shared DB with schema-per-module

Phase 3: Extract high-load modules to microservices:
    - Order Service (high write throughput, independent scaling)
    - Inventory Service (real-time stock, WebSocket updates)
    - Finance Service (compliance isolation, separate audit)
    - Notification Service (email/SMS/Push throughput)
  → API Gateway (Kong / Traefik) in front of services
  → Event bus (RabbitMQ / Kafka) for cross-module communication
  → Shared data via events + materialized views, not direct DB access

Phase 4: Polyglot Persistence
    - Primary: PostgreSQL (transactions, core data)
    - Cache: Redis (session, stock, catalog)
    - Search: Elasticsearch (product search, log search)
    - Analytics: ClickHouse / TimescaleDB (reporting, time-series)
    - File: S3 / MinIO (documents, images)

Phase 5: Observability at Scale
    - Distributed tracing (OpenTelemetry + Jaeger)
    - Centralized logging (ELK / Loki)
    - Service mesh (Istio / Linkerd)
```

---

*This document serves as the architectural blueprint and workflow reference for the production-ready ERP system. Each module should further break down into detailed API contracts, validation rules, and service methods as implementation begins.*
