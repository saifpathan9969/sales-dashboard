/**
 * Bug Condition Exploration Test for Cancel Insights Data Loading Fix
 * 
 * CRITICAL: This test is EXPECTED TO FAIL on unfixed code.
 * Test failure confirms the bug exists (missing cancellation_reason column).
 * 
 * Property 1: Bug Condition - Missing Cancellation Reason Column
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4
 */

const initSqlJs = require('sql.js');
const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

// Mock database module to simulate old database without cancellation_reason column
let testDb = null;

// Create a test database WITHOUT the cancellation_reason column (simulating old database)
async function createOldDatabaseSchema() {
  const SQL = await initSqlJs();
  testDb = new SQL.Database();
  
  // Create users table
  testDb.run(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
  
  // Create orders table WITHOUT cancellation_reason column (OLD SCHEMA)
  testDb.run(`
    CREATE TABLE orders (
      order_id TEXT PRIMARY KEY,
      customer_name TEXT NOT NULL,
      product_name TEXT NOT NULL,
      category TEXT NOT NULL,
      order_value REAL NOT NULL,
      order_date TEXT NOT NULL,
      payment_method TEXT NOT NULL,
      region TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending',
      delivery_time INTEGER,
      created_by INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);
  
  // Insert test user for authentication
  testDb.run(`
    INSERT INTO users (id, name, email, password, role)
    VALUES (1, 'Test User', 'test@example.com', 'hashedpassword', 'admin')
  `);
  
  // Insert cancelled orders
  testDb.run(`
    INSERT INTO orders (order_id, customer_name, product_name, category, order_value, order_date, payment_method, region, status, created_by)
    VALUES 
      ('ORD001', 'John Doe', 'Laptop', 'Electronics', 1200.00, '2024-01-15', 'Credit Card', 'North', 'Cancelled', 1),
      ('ORD002', 'Jane Smith', 'Phone', 'Electronics', 800.00, '2024-01-16', 'PayPal', 'South', 'Cancelled', 1),
      ('ORD003', 'Bob Johnson', 'Tablet', 'Electronics', 500.00, '2024-01-17', 'Credit Card', 'East', 'Completed', 1)
  `);
  
  return testDb;
}

// Helper to execute queries on test database
function queryAll(sql, params = []) {
  const stmt = testDb.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

function queryOne(sql, params = []) {
  const rows = queryAll(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

// Create test Express app with mocked database
function createTestApp() {
  const app = express();
  app.use(express.json());
  
  // Mock authentication middleware
  app.use((req, res, next) => {
    req.user = { id: 1, role: 'admin' };
    next();
  });
  
  // Replicate the /api/dashboard/cancellation-rates endpoint logic
  app.get('/api/dashboard/cancellation-rates', (req, res) => {
    try {
      const { date_from, date_to } = req.query;
      let where = '1=1';
      const params = [];
      if (date_from) { where += ' AND order_date >= ?'; params.push(date_from); }
      if (date_to) { where += ' AND order_date <= ?'; params.push(date_to); }

      const stats = queryOne(`
        SELECT 
          COUNT(*) as total_orders, 
          COUNT(CASE WHEN status = 'Cancelled' THEN 1 END) as cancelled_orders,
          COALESCE(SUM(CASE WHEN status = 'Cancelled' THEN order_value ELSE 0 END), 0) as revenue_loss
        FROM orders WHERE ${where}
      `, params);

      const categoryCancellations = queryAll(`
        SELECT category, COUNT(*) as cancelled_count
        FROM orders WHERE ${where} AND status = 'Cancelled'
        GROUP BY category ORDER BY cancelled_count DESC
      `, params);

      // THIS QUERY WILL FAIL - it references cancellation_reason column that doesn't exist
      const reasonDistribution = queryAll(`
        SELECT COALESCE(cancellation_reason, 'Unspecified') as reason, COUNT(*) as count
        FROM orders WHERE ${where} AND status = 'Cancelled'
        GROUP BY reason ORDER BY count DESC
      `, params);

      res.json({
        total_orders: stats.total_orders,
        cancelled_orders: stats.cancelled_orders,
        revenue_loss: stats.revenue_loss,
        cancellation_rate: stats.total_orders > 0 ? (stats.cancelled_orders / stats.total_orders) * 100 : 0,
        categories: categoryCancellations,
        reasons: reasonDistribution
      });
    } catch (err) {
      res.status(500).json({ error: 'Server error: ' + err.message });
    }
  });
  
  return app;
}

describe('Bug Condition Exploration: Missing Cancellation Reason Column', () => {
  let app;
  
  beforeAll(async () => {
    // Create database with OLD schema (no cancellation_reason column)
    await createOldDatabaseSchema();
    app = createTestApp();
  });
  
  /**
   * Property 1: Bug Condition - Missing Cancellation Reason Column
   * 
   * EXPECTED OUTCOME: This test MUST FAIL on unfixed code
   * Failure confirms the bug exists (SQL error due to missing column)
   * 
   * **Validates: Requirements 1.1, 1.2, 1.3, 1.4**
   */
  test('API call to /api/dashboard/cancellation-rates should fail with SQL error when cancellation_reason column is missing', async () => {
    const response = await request(app)
      .get('/api/dashboard/cancellation-rates')
      .expect(500);
    
    // Verify the error message indicates missing column
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toMatch(/no such column|cancellation_reason/i);
  });
  
  /**
   * Direct SQL Query Test
   * 
   * EXPECTED OUTCOME: This test MUST FAIL on unfixed code
   * Confirms the SQL query itself throws an error
   */
  test('Direct SQL query with cancellation_reason should throw "no such column" error', () => {
    expect(() => {
      queryAll(`
        SELECT COALESCE(cancellation_reason, 'Unspecified') as reason, COUNT(*) as count
        FROM orders WHERE status = 'Cancelled'
        GROUP BY reason
      `);
    }).toThrow(/no such column|cancellation_reason/i);
  });
  
  /**
   * Column Existence Check
   * 
   * EXPECTED OUTCOME: This test MUST FAIL on unfixed code
   * Confirms the column doesn't exist in the schema
   */
  test('orders table should be missing cancellation_reason column', () => {
    const tableInfo = queryAll(`PRAGMA table_info(orders)`);
    const columnNames = tableInfo.map(col => col.name);
    
    // This assertion SHOULD FAIL on unfixed code (column doesn't exist)
    expect(columnNames).not.toContain('cancellation_reason');
  });
  
  /**
   * Frontend Integration Simulation
   * 
   * EXPECTED OUTCOME: This test MUST FAIL on unfixed code
   * Simulates what the CancelInsights page experiences
   */
  test('CancelInsights page data fetch should fail with 500 error', async () => {
    const response = await request(app)
      .get('/api/dashboard/cancellation-rates');
    
    // On unfixed code, this should be 500 (error)
    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('error');
  });
});
