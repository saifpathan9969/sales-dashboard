const express = require('express');
const { queryAll, queryOne } = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/dashboard/kpis
router.get('/kpis', authenticate, (req, res) => {
  try {
    const { date_from, date_to, category } = req.query;
    let where = '1=1';
    const params = [];
    if (date_from) { where += ' AND order_date >= ?'; params.push(date_from); }
    if (date_to) { where += ' AND order_date <= ?'; params.push(date_to); }
    if (category) { where += ' AND category = ?'; params.push(category); }

    const stats = queryOne(`
      SELECT COUNT(*) as total_orders, COALESCE(SUM(order_value), 0) as total_revenue,
             COALESCE(AVG(order_value), 0) as avg_order_value, COUNT(DISTINCT customer_name) as unique_customers
      FROM orders WHERE ${where}
    `, params);

    const allDates = queryAll(`SELECT order_value FROM orders WHERE ${where} ORDER BY order_date`, params);
    let growth = 0;
    if (allDates.length >= 2) {
      const mid = Math.floor(allDates.length / 2);
      const firstHalf = allDates.slice(0, mid).reduce((s, r) => s + r.order_value, 0);
      const secondHalf = allDates.slice(mid).reduce((s, r) => s + r.order_value, 0);
      if (firstHalf > 0) growth = ((secondHalf - firstHalf) / firstHalf) * 100;
    }

    res.json({
      total_revenue: stats.total_revenue,
      total_orders: stats.total_orders,
      avg_order_value: stats.avg_order_value,
      growth_percentage: Math.round(growth * 10) / 10,
      unique_customers: stats.unique_customers
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// GET /api/dashboard/revenue-over-time
router.get('/revenue-over-time', authenticate, (req, res) => {
  try {
    const { date_from, date_to, category } = req.query;
    let where = '1=1';
    const params = [];
    if (date_from) { where += ' AND order_date >= ?'; params.push(date_from); }
    if (date_to) { where += ' AND order_date <= ?'; params.push(date_to); }
    if (category) { where += ' AND category = ?'; params.push(category); }

    const rows = queryAll(`
      SELECT strftime('%Y-%m', order_date) as month, SUM(order_value) as revenue, COUNT(*) as orders
      FROM orders WHERE ${where} GROUP BY month ORDER BY month
    `, params);
    res.json({ data: rows });
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

    const rows = queryAll(`
      SELECT category, SUM(order_value) as revenue, COUNT(*) as orders, AVG(order_value) as avg_value
      FROM orders WHERE ${where} GROUP BY category ORDER BY revenue DESC
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

    const rows = queryAll(`
      SELECT customer_name, SUM(order_value) as revenue, COUNT(*) as orders
      FROM orders WHERE ${where} GROUP BY customer_name ORDER BY revenue DESC LIMIT ?
    `, [...params, parseInt(lim)]);
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

module.exports = router;
