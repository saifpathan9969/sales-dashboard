const express = require('express');
const { queryAll } = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/diagnostics/schema - Check database schema
router.get('/schema', authenticate, (req, res) => {
  try {
    const ordersSchema = queryAll('PRAGMA table_info(orders)');
    const columnNames = ordersSchema.map(col => col.name);
    
    res.json({
      success: true,
      columns: columnNames,
      hasCancellationReason: columnNames.includes('cancellation_reason'),
      fullSchema: ordersSchema
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// GET /api/diagnostics/test-query - Test the cancellation query
router.get('/test-query', authenticate, (req, res) => {
  try {
    // Test direct query
    const directQuery = queryAll(`
      SELECT COALESCE(cancellation_reason, 'Unspecified') as reason, COUNT(*) as count
      FROM orders WHERE status = 'Cancelled'
      GROUP BY reason ORDER BY count DESC LIMIT 5
    `);
    
    res.json({
      success: true,
      message: 'Query executed successfully',
      results: directQuery
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      error: err.message,
      message: 'Query failed - this indicates the column is missing or there is a SQL error'
    });
  }
});

// GET /api/diagnostics/orders-count - Check if there are any orders
router.get('/orders-count', authenticate, (req, res) => {
  try {
    const stats = queryAll(`
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status = 'Cancelled' THEN 1 END) as cancelled_orders
      FROM orders
    `);
    
    res.json({
      success: true,
      stats: stats[0]
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

module.exports = router;
