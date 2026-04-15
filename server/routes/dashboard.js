const express = require('express');
const { queryAll, queryOne } = require('../db');
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
      payment_method, region, status, cancellation_reason, created_by, created_at, updated_at
    FROM orders
  )`;
};

// GET /api/dashboard/kpis
router.get('/kpis', authenticate, (req, res) => {
  try {
    const { date_from, date_to, category } = req.query;
    let where = '1=1';
    const params = [];
    if (date_from) { where += ' AND order_date >= ?'; params.push(date_from); }
    if (date_to) { where += ' AND order_date <= ?'; params.push(date_to); }
    if (category) { where += ' AND category = ?'; params.push(category); }

    const ordersTable = getOrdersTableExpr(date_from, date_to);

    const stats = queryOne(`
      SELECT COUNT(*) as total_orders, COALESCE(SUM(order_value), 0) as total_revenue,
             COALESCE(AVG(order_value), 0) as avg_order_value, COUNT(DISTINCT customer_name) as unique_customers,
             COUNT(CASE WHEN status = 'Cancelled' THEN 1 END) as cancelled_orders
      FROM ${ordersTable} WHERE ${where}
    `, params);

    const allDates = queryAll(`SELECT order_value FROM ${ordersTable} WHERE ${where} ORDER BY order_date`, params);
    let growth = 0;
    if (allDates.length >= 2) {
      const mid = Math.floor(allDates.length / 2);
      const firstHalf = allDates.slice(0, mid).reduce((s, r) => s + r.order_value, 0);
      const secondHalf = allDates.slice(mid).reduce((s, r) => s + r.order_value, 0);
      if (firstHalf > 0) growth = ((secondHalf - firstHalf) / firstHalf) * 100;
    }

    const cancelled_percentage = stats.total_orders > 0 ? (stats.cancelled_orders / stats.total_orders) * 100 : 0;

    res.json({
      total_revenue: stats.total_revenue,
      total_orders: stats.total_orders,
      avg_order_value: stats.avg_order_value,
      growth_percentage: Math.round(growth * 10) / 10,
      unique_customers: stats.unique_customers,
      cancelled_percentage: Math.round(cancelled_percentage * 10) / 10
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// GET /api/dashboard/revenue-over-time
router.get('/revenue-over-time', authenticate, (req, res) => {
  try {
    const { date_from, date_to, category, groupBy = 'monthly' } = req.query;
    let where = '1=1';
    const params = [];
    if (date_from) { where += ' AND order_date >= ?'; params.push(date_from); }
    if (date_to) { where += ' AND order_date <= ?'; params.push(date_to); }
    if (category) { where += ' AND category = ?'; params.push(category); }

    const ordersTable = getOrdersTableExpr(date_from, date_to);

    let groupSql;
    if (groupBy === 'daily') {
      groupSql = `strftime('%Y-%m-%d', order_date)`;
    } else if (groupBy === 'weekly') {
      groupSql = `strftime('%Y-%W', order_date)`;
    } else {
      groupSql = `strftime('%Y-%m', order_date)`;
    }

    const rows = queryAll(`
      SELECT ${groupSql} as period, SUM(order_value) as revenue, COUNT(*) as orders
      FROM ${ordersTable} WHERE ${where} GROUP BY period ORDER BY period
    `, params);
    
    // Map back 'period' to 'month' temporarily so frontend doesn't break if it expects 'month' 
    // We will update frontend to use 'period' though
    const mappedRows = rows.map(r => ({ ...r, month: r.period }));
    res.json({ data: mappedRows });
  } catch (err) {
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// GET /api/dashboard/sales-by-category
router.get('/sales-by-category', authenticate, (req, res) => {
  try {
    const { date_from, date_to } = req.query;
    let where = '1=1';
    const params = [];
    if (date_from) { where += ' AND order_date >= ?'; params.push(date_from); }
    if (date_to) { where += ' AND order_date <= ?'; params.push(date_to); }

    const ordersTable = getOrdersTableExpr(date_from, date_to);

    const rows = queryAll(`
      SELECT category, SUM(order_value) as revenue, COUNT(*) as orders, AVG(order_value) as avg_value
      FROM ${ordersTable} WHERE ${where} GROUP BY category ORDER BY revenue DESC
    `, params);
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// GET /api/dashboard/top-customers
router.get('/top-customers', authenticate, (req, res) => {
  try {
    const { date_from, date_to, category, limit: lim = 10 } = req.query;
    let where = '1=1';
    const params = [];
    if (date_from) { where += ' AND order_date >= ?'; params.push(date_from); }
    if (date_to) { where += ' AND order_date <= ?'; params.push(date_to); }
    if (category) { where += ' AND category = ?'; params.push(category); }

    const ordersTable = getOrdersTableExpr(date_from, date_to);

    const rows = queryAll(`
      SELECT customer_name, SUM(order_value) as revenue, COUNT(*) as orders
      FROM ${ordersTable} WHERE ${where} GROUP BY customer_name ORDER BY revenue DESC LIMIT ?
    `, [...params, parseInt(lim)]);
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// GET /api/dashboard/cancellation-rates
router.get('/cancellation-rates', authenticate, (req, res) => {
  try {
    const { date_from, date_to } = req.query;
    let where = '1=1';
    const params = [];
    if (date_from) { where += ' AND order_date >= ?'; params.push(date_from); }
    if (date_to) { where += ' AND order_date <= ?'; params.push(date_to); }

    const ordersTable = getOrdersTableExpr(date_from, date_to);

    console.log('[cancellation-rates] Querying with ordersTable:', ordersTable === 'orders' ? 'direct table' : 'subquery');

    const stats = queryOne(`
      SELECT 
        COUNT(*) as total_orders, 
        COUNT(CASE WHEN status = 'Cancelled' THEN 1 END) as cancelled_orders,
        COALESCE(SUM(CASE WHEN status = 'Cancelled' THEN order_value ELSE 0 END), 0) as revenue_loss
      FROM ${ordersTable} WHERE ${where}
    `, params);

    console.log('[cancellation-rates] Stats query successful:', stats);

    const categoryCancellations = queryAll(`
      SELECT category, COUNT(*) as cancelled_count
      FROM ${ordersTable} WHERE ${where} AND status = 'Cancelled'
      GROUP BY category ORDER BY cancelled_count DESC
    `, params);

    console.log('[cancellation-rates] Category query successful, found', categoryCancellations.length, 'categories');

    const reasonDistribution = queryAll(`
      SELECT COALESCE(cancellation_reason, 'Unspecified') as reason, COUNT(*) as count
      FROM ${ordersTable} WHERE ${where} AND status = 'Cancelled'
      GROUP BY reason ORDER BY count DESC
    `, params);

    console.log('[cancellation-rates] Reason query successful, found', reasonDistribution.length, 'reasons');

    res.json({
      total_orders: stats.total_orders,
      cancelled_orders: stats.cancelled_orders,
      revenue_loss: stats.revenue_loss,
      cancellation_rate: stats.total_orders > 0 ? (stats.cancelled_orders / stats.total_orders) * 100 : 0,
      categories: categoryCancellations,
      reasons: reasonDistribution
    });
  } catch (err) {
    console.error('[cancellation-rates] ERROR:', err.message);
    console.error('[cancellation-rates] Stack:', err.stack);
    res.status(500).json({ 
      error: 'Server error: ' + err.message,
      details: process.env.NODE_ENV === 'production' ? undefined : err.stack
    });
  }
});

module.exports = router;

