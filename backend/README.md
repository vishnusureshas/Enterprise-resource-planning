# ERP Backend

Production-ready ERP backend built with **Node.js**, **Express.js**, **PostgreSQL**, and **Redis**.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        ERP Backend                               │
├─────────────────────────────────────────────────────────────────┤
│  Express.js (Layered Architecture)                              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐              │
│  │   Routes    │→│ Controllers │→│   Services  │→│ Repositories │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
│         │              │              │              │          │
│         ▼              ▼              ▼              ▼          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  Middleware Chain                        │   │
│  │  RateLimit → Auth → Authorize → Validate → AuditLog      │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        ┌──────────┐   ┌──────────┐   ┌──────────┐
        │PostgreSQL│   │  Redis   │   │  BullMQ  │
        │ (Primary)│   │(Cache/Queue│   │(Jobs)    │
        └──────────┘   └──────────┘   └──────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 16+
- Redis 7+
- Docker & Docker Compose (optional)

### Development Setup

```bash
# Clone and navigate
cd backend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Start with Docker Compose (includes PostgreSQL, Redis)
npm run docker:dev

# Or start services manually and run:
npm run migrate:up
npm run seed
npm run dev
```

### Environment Variables

```env
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

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_QUEUE_DB=1

# Auth
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
SESSION_SECRET=your-session-secret

# Encryption (64 hex chars = 32 bytes)
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef

# Email
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
EMAIL_FROM=noreply@yourdomain.com

# Monitoring
SENTRY_DSN=https://key@sentry.io/project
```

## 📦 Project Structure

```
backend/
├── src/
│   ├── config/           # DB, Redis, Logger, Env
│   ├── middleware/       # Auth, RateLimit, Validation, Errors
│   ├── modules/          # Feature modules
│   │   ├── auth/         # Authentication & Authorization
│   │   ├── user/         # User Management
│   │   ├── role/         # RBAC
│   │   ├── organization/ # Multi-tenancy
│   │   └── ...           # Other modules
│   ├── shared/           # Errors, Responses, Constants
│   ├── app.js            # Express app setup
│   └── server.js         # Entry point
├── migrations/           # Database migrations
├── seeds/                # Seed data
├── tests/                # Unit, Integration, E2E tests
├── docker/               # Docker configs
└── scripts/              # Utility scripts
```

## 🔐 Authentication & Authorization

### JWT Flow
```
Login → Access Token (15m) + Refresh Token (7d)
  │
  ├── Access Token: Bearer <token> (short-lived, stateless)
  └── Refresh Token: Stored in Redis (long-lived, rotatable)
```

### Token Refresh
```bash
POST /api/auth/refresh
{
  "refreshToken": "uuid-from-login"
}
```

### MFA Support
- TOTP (Google Authenticator, Authy)
- QR code setup
- Backup codes

### RBAC Permissions
```javascript
// Check permission
authorize('inventory:create')

// Check role
authorizeRole('admin', 'manager')

// Organization scoping (automatic)
scopeOrganization  // adds organization_id to queries
```

## 📚 API Documentation

### Base URL
```
Development: http://localhost:5000/api
Production:  https://api.yourdomain.com/api
```

### Auth Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/register | Register new org + admin user |
| POST | /auth/login | Login with email/password |
| POST | /auth/refresh | Refresh access token |
| POST | /auth/logout | Logout (revoke tokens) |
| POST | /auth/forgot-password | Request password reset |
| POST | /auth/reset-password | Reset with token |
| POST | /auth/change-password | Change password (auth) |
| GET | /auth/me | Get current user profile |
| PATCH | /auth/me | Update profile |

### Response Format
```json
{
  "success": true,
  "data": {},
  "meta": { "page": 1, "limit": 20, "total": 100 },
  "error": null
}
```

### Error Format
```json
{
  "success": false,
  "data": null,
  "meta": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [{ "field": "email", "message": "Invalid email" }]
  }
}
```

## 🗄️ Database

### Migrations
```bash
# Create migration
npm run migrate:create -- create_users_table

# Run migrations
npm run migrate:up

# Rollback
npm run migrate:down
```

### Core Tables
| Table | Description |
|-------|-------------|
| `organizations` | Multi-tenant root |
| `users` | System users |
| `roles` | RBAC roles per org |
| `permissions` | System permissions |
| `user_roles` | User ↔ Role mapping |
| `role_permissions` | Role ↔ Permission mapping |
| `user_sessions` | Refresh token tracking |
| `audit_logs` | Change history |

## 🔄 Background Jobs (BullMQ + Redis)

### Job Types
| Job | Trigger | Priority |
|-----|---------|----------|
| `invoice:generate` | Order completed | High |
| `email:send` | Various events | Medium |
| `stock:alert` | Stock < threshold | Medium |
| `report:generate` | Scheduled (cron) | Low |
| `data:sync` | Scheduled (cron) | Low |

### Running Workers
```bash
npm run queue:worker
```

### Job Monitoring
```bash
# Bull Board UI
npm run queue:dashboard
# Open http://localhost:5000/admin/queues
```

## 📊 Monitoring

### Health Check
```bash
GET /api/health
# Returns: { status: "healthy", checks: { database: true, redis: true } }
```

### Prometheus Metrics
```bash
GET /api/metrics
# Exposes: http_request_duration_seconds, cache_hit_ratio, queue_depth, etc.
```

### Grafana Dashboards
- Request rate, latency (p50/p95/p99)
- Error rate by endpoint
- Cache hit ratio
- Queue depth
- DB connection pool

### Logging
```javascript
// Structured JSON logs (Pino)
logger.info({ type: 'audit', action: 'order.create', userId, orderId });
logger.error({ err, path: req.path }, 'Request error');
```

## 🧪 Testing

```bash
# All tests with coverage
npm test

# Watch mode
npm run test:watch

# Integration tests only
npm run test:integration

# E2E tests
npm run test:e2e
```

### Test Structure
```
tests/
├── unit/           # Pure functions, validators
├── integration/    # API endpoints with test DB
└── e2e/            # Full user flows (Playwright)
```

## 🐳 Deployment

### Development
```bash
docker compose -f docker/docker-compose.dev.yml up
```

### Production
```bash
# Set required env vars
export DB_PASSWORD=...
export REDIS_PASSWORD=...
export JWT_SECRET=...
export SESSION_SECRET=...
export ENCRYPTION_KEY=...

docker compose -f docker/docker-compose.prod.yml up -d
```

### Kubernetes (Helm)
```yaml
# values.yaml
replicaCount: 3
image:
  repository: ghcr.io/yourorg/erp-backend
  tag: latest
resources:
  limits:
    cpu: 1000m
    memory: 1Gi
autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70
```

## 🔒 Security Checklist

- [ ] Strong JWT_SECRET (32+ chars)
- [ ] HTTPS enforced (reverse proxy)
- [ ] Rate limiting enabled
- [ ] CORS restricted to known origins
- [ ] Helmet.js security headers
- [ ] Input validation on all routes
- [ ] Parameterized queries (no SQL injection)
- [ ] Password hashing (bcrypt, cost 12)
- [ ] Token rotation on refresh
- [ ] Audit logging for sensitive actions
- [ ] MFA for admin users
- [ ] Secrets in environment/secret manager

## 📈 Scaling Path

```
Phase 1: Modular Monolith (current)
  └── Single Node.js app, shared DB

Phase 2: Modular Monolith + Workers
  └── Extract BullMQ workers to separate processes

Phase 3: Service Extraction
  ├── Order Service (high write)
  ├── Inventory Service (real-time)
  ├── Finance Service (compliance)
  └── Notification Service (throughput)

Phase 4: Polyglot Persistence
  ├── PostgreSQL (transactions)
  ├── Redis (cache/sessions)
  ├── Elasticsearch (search)
  └── ClickHouse (analytics)
```

## 📝 Scripts Reference

| Script | Description |
|--------|-------------|
| `npm run dev` | Start with nodemon |
| `npm run start` | Production start |
| `npm run lint` | ESLint check |
| `npm run format` | Prettier format |
| `npm test` | Run tests + coverage |
| `npm run migrate:up` | Apply migrations |
| `npm run seed` | Seed database |
| `npm run docker:dev` | Start dev stack |
| `npm run docker:build` | Build production image |
| `npm run cache:warm` | Warm Redis cache |

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Run tests (`npm test`)
4. Run lint (`npm run lint`)
5. Commit changes (`git commit -m 'feat: add amazing feature'`)
6. Push branch (`git push origin feature/amazing-feature`)
7. Open Pull Request

## 📄 License

MIT License - see LICENSE file for details.