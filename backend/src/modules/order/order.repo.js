const db = require('../../config/db');
const { NotFoundError } = require('../../shared/errors');

class OrderRepository {
  async findAll(organizationId, { limit, offset, sortBy, sortOrder, search, status, customerId, fromDate, toDate }) {
    const conditions = ['o.organization_id = $1', 'o.deleted_at IS NULL'];
    const params = [organizationId];
    let paramIndex = 2;

    if (search) {
      conditions.push(`(
        LOWER(o.order_number) LIKE LOWER($${paramIndex}) OR
        LOWER(c.name) LIKE LOWER($${paramIndex})
      )`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (status) {
      conditions.push(`o.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (customerId) {
      conditions.push(`o.customer_id = $${paramIndex}`);
      params.push(customerId);
      paramIndex++;
    }

    if (fromDate) {
      conditions.push(`o.order_date >= $${paramIndex}`);
      params.push(fromDate);
      paramIndex++;
    }

    if (toDate) {
      conditions.push(`o.order_date <= $${paramIndex}`);
      params.push(toDate);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');
    const allowedSort = ['order_number', 'order_date', 'status', 'grand_total', 'created_at'];
    const sortColumn = allowedSort.includes(sortBy) ? sortBy : 'created_at';
    const order = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    const countResult = await db.query(
      `SELECT COUNT(*) FROM sales_orders o
       JOIN customers c ON c.id = o.customer_id
       WHERE ${whereClause}`, params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const dataResult = await db.query(
      `SELECT o.*,
              jsonb_build_object('id', c.id, 'name', c.name, 'code', c.code) AS customer
       FROM sales_orders o
       JOIN customers c ON c.id = o.customer_id
       WHERE ${whereClause}
       ORDER BY o.${sortColumn} ${order}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    return { data: dataResult.rows, total };
  }

  async findById(id, organizationId) {
    const result = await db.query(
      `SELECT o.*,
              jsonb_build_object('id', c.id, 'name', c.name, 'code', c.code, 'email', c.email, 'phone', c.phone) AS customer
       FROM sales_orders o
       JOIN customers c ON c.id = o.customer_id
       WHERE o.id = $1 AND o.organization_id = $2 AND o.deleted_at IS NULL`,
      [id, organizationId]
    );
    return result.rows[0];
  }

  async findItemsByOrderId(orderId) {
    const result = await db.query(
      `SELECT soi.*,
              jsonb_build_object('id', p.id, 'sku', p.sku, 'name', p.name) AS product
       FROM sales_order_items soi
       JOIN products p ON p.id = soi.product_id
       WHERE soi.sales_order_id = $1
       ORDER BY soi.created_at ASC`,
      [orderId]
    );
    return result.rows;
  }

  async findPaymentsByOrderId(orderId) {
    const result = await db.query(
      `SELECT sop.*,
              jsonb_build_object('id', u.id, 'name', CONCAT(u.first_name, ' ', u.last_name)) AS created_by_user
       FROM sales_order_payments sop
       LEFT JOIN users u ON u.id = sop.created_by
       WHERE sop.sales_order_id = $1
       ORDER BY sop.paid_at DESC`,
      [orderId]
    );
    return result.rows;
  }

  async findTaxesByOrderId(orderId) {
    const result = await db.query(
      `SELECT * FROM sales_order_taxes WHERE sales_order_id = $1 ORDER BY created_at ASC`,
      [orderId]
    );
    return result.rows;
  }

  async findMaxOrderNumber(organizationId) {
    const result = await db.query(
      `SELECT order_number FROM sales_orders
       WHERE organization_id = $1
       ORDER BY created_at DESC LIMIT 1`,
      [organizationId]
    );
    return result.rows[0];
  }

  async create(data, items, organizationId, userId) {
    const db = require('../../config/db');
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      const orderResult = await client.query(
        `INSERT INTO sales_orders (organization_id, order_number, customer_id, order_date, status,
                currency_code, exchange_rate, subtotal, discount_total, tax_total,
                shipping_total, grand_total, notes, shipping_address_id, billing_address_id, created_by, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 'draft', $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())
         RETURNING *`,
        [organizationId, data.orderNumber, data.customerId, data.orderDate,
         data.currencyCode || 'USD', data.exchangeRate || 1,
         data.subtotal, data.discountTotal, data.taxTotal,
         data.shippingTotal || 0, data.grandTotal, data.notes || null,
         data.shippingAddressId || null, data.billingAddressId || null, userId]
      );
      const order = orderResult.rows[0];

      for (const item of items) {
        await client.query(
          `INSERT INTO sales_order_items (sales_order_id, product_id, variant_id, product_code,
                  product_name, quantity, unit_price, discount_percent, discount_amount,
                  tax_percent, tax_amount, line_total, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())`,
          [order.id, item.productId, item.variantId || null, item.productCode || null,
           item.productName, item.quantity, item.unitPrice, item.discountPercent || 0,
           item.discountAmount || 0, item.taxPercent || 0, item.taxAmount || 0, item.lineTotal]
        );
      }

      if (data.taxTotal > 0 && data.taxLines) {
        for (const tax of data.taxLines) {
          await client.query(
            `INSERT INTO sales_order_taxes (sales_order_id, name, rate, amount, created_at)
             VALUES ($1, $2, $3, $4, NOW())`,
            [order.id, tax.name, tax.rate, tax.amount]
          );
        }
      }

      await client.query('COMMIT');
      return order;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async updateStatus(id, organizationId, status) {
    const result = await db.query(
      `UPDATE sales_orders SET status = $1, updated_at = NOW()
       WHERE id = $2 AND organization_id = $3 AND deleted_at IS NULL
       RETURNING *`,
      [status, id, organizationId]
    );
    if (result.rowCount === 0) throw new NotFoundError('Order not found');
    return result.rows[0];
  }

  async updateField(id, organizationId, field, value) {
    const result = await db.query(
      `UPDATE sales_orders SET ${field} = $1, updated_at = NOW()
       WHERE id = $2 AND organization_id = $3 AND deleted_at IS NULL
       RETURNING *`,
      [value, id, organizationId]
    );
    return result.rows[0];
  }

  async recordPayment(orderId, data, userId) {
    const result = await db.query(
      `INSERT INTO sales_order_payments (sales_order_id, amount, payment_method, reference_number, notes, created_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [orderId, data.amount, data.paymentMethod || null, data.referenceNumber || null, data.notes || null, userId]
    );
    return result.rows[0];
  }

  async findOrdersByCustomerId(customerId, organizationId, { limit, offset }) {
    const result = await db.query(
      `SELECT o.* FROM sales_orders o
       WHERE o.customer_id = $1 AND o.organization_id = $2 AND o.deleted_at IS NULL
       ORDER BY o.created_at DESC
       LIMIT $3 OFFSET $4`,
      [customerId, organizationId, limit, offset]
    );
    const countResult = await db.query(
      `SELECT COUNT(*) FROM sales_orders
       WHERE customer_id = $1 AND organization_id = $2 AND deleted_at IS NULL`,
      [customerId, organizationId]
    );
    return { data: result.rows, total: parseInt(countResult.rows[0].count, 10) };
  }

  async findTimeline(id, organizationId) {
    return [
      { event: 'Order created', date: null },
    ];
  }
}

module.exports = new OrderRepository();
