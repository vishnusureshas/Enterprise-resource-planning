const db = require('../../config/db');
const { NotFoundError } = require('../../shared/errors');

class PurchaseOrderRepository {
  async findAll(organizationId, { limit, offset, sortBy, sortOrder, search, status, vendorId, fromDate, toDate }) {
    const conditions = ['po.organization_id = $1', 'po.deleted_at IS NULL'];
    const params = [organizationId];
    let paramIndex = 2;

    if (search) {
      conditions.push(`(
        LOWER(po.po_number) LIKE LOWER($${paramIndex}) OR
        LOWER(v.name) LIKE LOWER($${paramIndex})
      )`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (status) {
      conditions.push(`po.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (vendorId) {
      conditions.push(`po.vendor_id = $${paramIndex}`);
      params.push(vendorId);
      paramIndex++;
    }

    if (fromDate) {
      conditions.push(`po.order_date >= $${paramIndex}`);
      params.push(fromDate);
      paramIndex++;
    }

    if (toDate) {
      conditions.push(`po.order_date <= $${paramIndex}`);
      params.push(toDate);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');
    const allowedSort = ['po_number', 'order_date', 'status', 'grand_total', 'created_at'];
    const sortColumn = allowedSort.includes(sortBy) ? sortBy : 'created_at';
    const order = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    const countResult = await db.query(
      `SELECT COUNT(*) FROM purchase_orders po
       JOIN vendors v ON v.id = po.vendor_id
       WHERE ${whereClause}`, params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const dataResult = await db.query(
      `SELECT po.*,
              jsonb_build_object('id', v.id, 'name', v.name, 'code', v.code) AS vendor
       FROM purchase_orders po
       JOIN vendors v ON v.id = po.vendor_id
       WHERE ${whereClause}
       ORDER BY po.${sortColumn} ${order}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    return { data: dataResult.rows, total };
  }

  async findById(id, organizationId) {
    const result = await db.query(
      `SELECT po.*,
              jsonb_build_object('id', v.id, 'name', v.name, 'code', v.code, 'email', v.email, 'phone', v.phone) AS vendor
       FROM purchase_orders po
       JOIN vendors v ON v.id = po.vendor_id
       WHERE po.id = $1 AND po.organization_id = $2 AND po.deleted_at IS NULL`,
      [id, organizationId]
    );
    return result.rows[0];
  }

  async findItemsByOrderId(purchaseOrderId) {
    const result = await db.query(
      `SELECT poi.*,
              jsonb_build_object('id', p.id, 'sku', p.sku, 'name', p.name) AS product
       FROM purchase_order_items poi
       JOIN products p ON p.id = poi.product_id
       WHERE poi.purchase_order_id = $1
       ORDER BY poi.created_at ASC`,
      [purchaseOrderId]
    );
    return result.rows;
  }

  async findTaxesByOrderId(purchaseOrderId) {
    const result = await db.query(
      `SELECT * FROM purchase_order_taxes WHERE purchase_order_id = $1 ORDER BY created_at ASC`,
      [purchaseOrderId]
    );
    return result.rows;
  }

  async findReceiptsByOrderId(purchaseOrderId) {
    const result = await db.query(
      `SELECT gr.*,
              jsonb_build_object('id', u.id, 'name', CONCAT(u.first_name, ' ', u.last_name)) AS created_by_user
       FROM goods_receipts gr
       LEFT JOIN users u ON u.id = gr.created_by
       WHERE gr.purchase_order_id = $1
       ORDER BY gr.created_at DESC`,
      [purchaseOrderId]
    );
    return result.rows;
  }

  async findReceiptItemsByReceiptId(receiptId) {
    const result = await db.query(
      `SELECT gri.* FROM goods_receipt_items gri WHERE gri.goods_receipt_id = $1`,
      [receiptId]
    );
    return result.rows;
  }

  async findMaxPoNumber(organizationId) {
    const result = await db.query(
      `SELECT po_number FROM purchase_orders
       WHERE organization_id = $1
       ORDER BY created_at DESC LIMIT 1`,
      [organizationId]
    );
    return result.rows[0];
  }

  async create(data, items, organizationId, userId) {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      const orderResult = await client.query(
        `INSERT INTO purchase_orders (organization_id, po_number, vendor_id, order_date, expected_date, status,
                currency_code, exchange_rate, subtotal, discount_total, tax_total,
                shipping_total, grand_total, notes, shipping_address, billing_address, created_by, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, 'draft', $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())
         RETURNING *`,
        [organizationId, data.poNumber, data.vendorId, data.orderDate, data.expectedDate || null,
         data.currencyCode || 'USD', data.exchangeRate || 1,
         data.subtotal, data.discountTotal, data.taxTotal,
         data.shippingTotal || 0, data.grandTotal, data.notes || null,
         data.shippingAddress || null, data.billingAddress || null, userId]
      );
      const order = orderResult.rows[0];

      for (const item of items) {
        await client.query(
          `INSERT INTO purchase_order_items (purchase_order_id, product_id, variant_id, product_code,
                  product_name, quantity, unit_price, discount_percent, discount_amount,
                  tax_percent, tax_amount, received_quantity, line_total, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 0, $12, NOW())`,
          [order.id, item.productId, item.variantId || null, item.productCode || null,
           item.productName, item.quantity, item.unitPrice, item.discountPercent || 0,
           item.discountAmount || 0, item.taxPercent || 0, item.taxAmount || 0, item.lineTotal]
        );
      }

      if (data.taxTotal > 0 && data.taxLines) {
        for (const tax of data.taxLines) {
          await client.query(
            `INSERT INTO purchase_order_taxes (purchase_order_id, name, rate, amount, created_at)
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
      `UPDATE purchase_orders SET status = $1, updated_at = NOW()
       WHERE id = $2 AND organization_id = $3 AND deleted_at IS NULL
       RETURNING *`,
      [status, id, organizationId]
    );
    if (result.rowCount === 0) throw new NotFoundError('Purchase order not found');
    return result.rows[0];
  }

  async updateField(id, organizationId, field, value) {
    const result = await db.query(
      `UPDATE purchase_orders SET ${field} = $1, updated_at = NOW()
       WHERE id = $2 AND organization_id = $3 AND deleted_at IS NULL
       RETURNING *`,
      [value, id, organizationId]
    );
    return result.rows[0];
  }

  async receiveGoods(purchaseOrderId, receiptItems, data, userId) {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      const receiptResult = await client.query(
        `INSERT INTO goods_receipts (purchase_order_id, receipt_number, received_date, notes, created_by, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         RETURNING *`,
        [purchaseOrderId, data.receiptNumber, data.receivedDate, data.notes || null, userId]
      );
      const receipt = receiptResult.rows[0];

      for (const ri of receiptItems) {
        await client.query(
          `INSERT INTO goods_receipt_items (goods_receipt_id, purchase_order_item_id, product_id, quantity, created_at)
           VALUES ($1, $2, $3, $4, NOW())`,
          [receipt.id, ri.purchaseOrderItemId, ri.productId, ri.quantity]
        );

        await client.query(
          `UPDATE purchase_order_items
           SET received_quantity = received_quantity + $1
           WHERE id = $2`,
          [ri.quantity, ri.purchaseOrderItemId]
        );
      }

      await client.query('COMMIT');
      return receipt;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async findTimeline(id, organizationId) {
    return [
      { event: 'Purchase order created', date: null },
    ];
  }

  async returnToVendor(purchaseOrderId, returnItems, data, userId) {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      const returnResult = await client.query(
        `INSERT INTO goods_receipts (purchase_order_id, receipt_number, received_date, notes, created_by, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         RETURNING *`,
        [purchaseOrderId, data.returnNumber, data.returnDate, `RETURN: ${data.notes || ''}`, userId]
      );
      const ret = returnResult.rows[0];

      for (const ri of returnItems) {
        await client.query(
          `INSERT INTO goods_receipt_items (goods_receipt_id, purchase_order_item_id, product_id, quantity, created_at)
           VALUES ($1, $2, $3, $4, NOW())`,
          [ret.id, ri.purchaseOrderItemId, ri.productId, -ri.quantity]
        );

        await client.query(
          `UPDATE purchase_order_items
           SET received_quantity = received_quantity - $1
           WHERE id = $2`,
          [ri.quantity, ri.purchaseOrderItemId]
        );
      }

      await client.query('COMMIT');
      return ret;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = new PurchaseOrderRepository();
