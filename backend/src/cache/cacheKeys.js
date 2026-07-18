const CACHE_PREFIX = 'erp';

const keys = {
  inventory: {
    item: (orgId, itemId) => `${CACHE_PREFIX}:${orgId}:inventory:item:${itemId}`,
    items: (orgId, page) => `${CACHE_PREFIX}:${orgId}:inventory:items:page:${page}`,
    stock: (orgId, warehouseId, itemId) =>
      `${CACHE_PREFIX}:${orgId}:inventory:stock:${warehouseId}:${itemId}`,
    category: (orgId, slug) => `${CACHE_PREFIX}:${orgId}:inventory:category:${slug}`,
    categories: (orgId) => `${CACHE_PREFIX}:${orgId}:inventory:categories`,
    lowStock: (orgId) => `${CACHE_PREFIX}:${orgId}:inventory:low-stock`,
  },
  warehouse: {
    item: (orgId, id) => `${CACHE_PREFIX}:${orgId}:warehouse:${id}`,
    list: (orgId) => `${CACHE_PREFIX}:${orgId}:warehouses`,
  },
  customer: {
    item: (orgId, id) => `${CACHE_PREFIX}:${orgId}:customer:${id}`,
  },
  vendor: {
    item: (orgId, id) => `${CACHE_PREFIX}:${orgId}:vendor:${id}`,
  },
  product: {
    catalog: (orgId, page) => `${CACHE_PREFIX}:${orgId}:product:catalog:page:${page}`,
  },
  finance: {
    coa: (orgId) => `${CACHE_PREFIX}:${orgId}:finance:coa`,
    report: (orgId, type, params) =>
      `${CACHE_PREFIX}:${orgId}:finance:report:${type}:${params}`,
  },
  currency: {
    rates: () => `${CACHE_PREFIX}:currency:rates`,
  },
  tax: {
    rules: (orgId) => `${CACHE_PREFIX}:${orgId}:tax:rules`,
  },
  role: {
    permissions: (orgId, roleId) =>
      `${CACHE_PREFIX}:${orgId}:role:permissions:${roleId}`,
  },
  dashboard: {
    kpi: (orgId, type) => `${CACHE_PREFIX}:${orgId}:dashboard:kpi:${type}`,
  },
  user: {
    session: (token) => `${CACHE_PREFIX}:user:session:${token}`,
  },
};

module.exports = { keys, CACHE_PREFIX };
