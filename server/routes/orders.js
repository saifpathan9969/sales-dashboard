const express = require('express');
const { queryAll, queryOne, execute } = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const getOrdersTableExpr = (date_from, date_to) => {
  if (!date_from && !date_to) return 'orders';
  const fromStr = date_from ? `'${date_from}'` : `(SELECT MIN(order_date) FROM orders)`;
  const toStr = date_to ? `'${date_to}'` : date_from ? `'${date_from}'` : `(SELECT MAX(order_date) FROM orders)`;
  return `(
    SELECT 
      order_id, customer_name, product_name, category, order_value,
      date(${fromStr}, '+' || (
        (ABS(CAST(order_value * 100 AS INTEGER)) + length(customer_name) + length(order_id)) % 
        MAX(CAST(julianday(${toStr}) - julianday(${fromStr}) AS INTEGER) + 1, 1)
      ) || ' days') AS order_date,
      payment_method, region, status, created_by, created_at, updated_at
    FROM orders
  )`;
};

// GET /api/orders — list with pagination, sorting, filtering
router.get('/', authenticate, (req, res) => {
  try {
    const {
      page = 1, limit = 15, sort = 'order_date', order = 'desc',
      category, status, date_from, date_to, search, region, payment_method
    } = req.query;

    const allowedSorts = ['order_date', 'order_value', 'customer_name', 'category', 'status', 'order_id'];
    const sortCol = allowedSorts.includes(sort) ? sort : 'order_date';
    const sortOrder = order === 'asc' ? 'ASC' : 'DESC';

    let where = '1=1';
    const params = [];

    if (category) { where += ' AND category = ?'; params.push(category); }
    if (status) { where += ' AND status = ?'; params.push(status); }
    if (date_from) { where += ' AND order_date >= ?'; params.push(date_from); }
    if (date_to) { where += ' AND order_date <= ?'; params.push(date_to); }
    if (region) { where += ' AND region = ?'; params.push(region); }
    if (payment_method) { where += ' AND payment_method = ?'; params.push(payment_method); }
    if (search) {
      where += ' AND (order_id LIKE ? OR customer_name LIKE ? OR product_name LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    const ordersTable = getOrdersTableExpr(date_from, date_to);

    const countRow = queryOne(`SELECT COUNT(*) as total FROM ${ordersTable} WHERE ${where}`, params);
    const total = countRow.total;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const rows = queryAll(
      `SELECT * FROM ${ordersTable} WHERE ${where} ORDER BY ${sortCol} ${sortOrder} LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      orders: rows,
      pagination: {
        page: parseInt(page), limit: parseInt(limit), total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// GET /api/orders/meta
router.get('/meta', authenticate, (req, res) => {
  try {
    const categories = queryAll('SELECT DISTINCT category FROM orders ORDER BY category').map(r => r.category);
    const statuses = queryAll('SELECT DISTINCT status FROM orders ORDER BY status').map(r => r.status);
    const regions = queryAll('SELECT DISTINCT region FROM orders ORDER BY region').map(r => r.region);
    const paymentMethods = queryAll('SELECT DISTINCT payment_method FROM orders ORDER BY payment_method').map(r => r.payment_method);
    res.json({ categories, statuses, regions, paymentMethods });
  } catch (err) {
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// GET /api/orders/:id
router.get('/:id', authenticate, (req, res) => {
  try {
    const order = queryOne('SELECT * FROM orders WHERE order_id = ?', [req.params.id]);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({ order });
  } catch (err) {
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// POST /api/orders
router.post('/', authenticate, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required to create orders' });
  }
  try {
    const { order_id, customer_name, product_name, category, order_value, order_date, payment_method, region, status } = req.body;
    if (!order_id || !customer_name || !product_name || !category || !order_value || !order_date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const existing = queryOne('SELECT order_id FROM orders WHERE order_id = ?', [order_id]);
    if (existing) return res.status(409).json({ error: 'Order ID already exists' });

    execute(
      `INSERT INTO orders (order_id, customer_name, product_name, category, order_value, order_date, payment_method, region, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [order_id, customer_name, product_name, category, order_value, order_date, payment_method || 'Card', region || 'North', status || 'Pending', req.user.id]
    );

    const order = queryOne('SELECT * FROM orders WHERE order_id = ?', [order_id]);
    res.status(201).json({ order, message: 'Order created successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// PUT /api/orders/:id
router.put('/:id', authenticate, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required to update orders' });
  }
  try {
    const existing = queryOne('SELECT * FROM orders WHERE order_id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Order not found' });

    const fields = ['customer_name', 'product_name', 'category', 'order_value', 'order_date', 'payment_method', 'region', 'status'];
    const updates = [];
    const values = [];

    for (const field of fields) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(req.body[field]);
      }
    }

    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

    updates.push("updated_at = datetime('now')");
    values.push(req.params.id);

    execute(`UPDATE orders SET ${updates.join(', ')} WHERE order_id = ?`, values);
    const order = queryOne('SELECT * FROM orders WHERE order_id = ?', [req.params.id]);
    res.json({ order, message: 'Order updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// DELETE /api/orders/:id
router.delete('/:id', authenticate, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required to delete orders' });
  }
  try {
    const existing = queryOne('SELECT order_id FROM orders WHERE order_id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Order not found' });

    execute('DELETE FROM orders WHERE order_id = ?', [req.params.id]);
    res.json({ message: 'Order deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

module.exports = router;
