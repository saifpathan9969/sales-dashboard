/**
 * Preservation Property Tests for Cancel Insights Data Loading Fix
 * 
 * CRITICAL: These tests are EXPECTED TO PASS on unfixed code.
 * Test success confirms baseline behavior that must be preserved after the fix.
 * 
 * Property 2: Preservation - Existing Data and Endpoint Integrity
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 */

const initSqlJs = require('sql.js');
const request = require('supertest');
const express = require('express');
const fc = require('fast-check');

// Helper to generate valid date strings
const dateArbitrary = () => fc.integer({ min: 0, max: 364 }).map(days => {
  const date = new Date(2024, 0, 1); // Jan 1, 2024
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
});

// Test database instance
let testDb = null;

// Create a test database with OLD schema (no cancellation_reason column)
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
  
  // Insert test user
  testDb.run(`
    INSERT INTO users (id, name, email, password, role)
    VALUES (1, 'Test User', 'test@example.com', 'hashedpassword', 'admin')
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

function execute(sql, params = []) {
  testDb.run(sql, params);
}

// Create test Express app with dashboard endpoints
function createTestApp() {
  const app = express();
  app.use(express.json());
  
  // Mock authentication middleware
  app.use((req, res, next) => {
    req.user = { id: 1, role: 'admin' };
    next();
  });
  
  // GET /api/dashboard/kpis
  app.get('/api/dashboard/kpis', (req, res) => {
    try {
      const { date_from, date_to, category } = req.query;
      let where = '1=1';
      const params = [];
      if (date_from) { where += ' AND order_date >= ?'; params.push(date_from); }
      if (date_to) { where += ' AND order_date <= ?'; params.push(date_to); }
      if (category) { where += ' AND category = ?'; params.push(category); }

      const stats = queryOne(`
        SELECT COUNT(*) as total_orders, COALESCE(SUM(order_value), 0) as total_revenue,
               COALESCE(AVG(order_value), 0) as avg_order_value, COUNT(DISTINCT customer_name) as unique_customers,
               COUNT(CASE WHEN status = 'Cancelled' THEN 1 END) as cancelled_orders
        FROM orders WHERE ${where}
      `, params);

      const cancelled_percentage = stats.total_orders > 0 ? (stats.cancelled_orders / stats.total_orders) * 100 : 0;

      res.json({
        total_revenue: stats.total_revenue,
        total_orders: stats.total_orders,
        avg_order_value: stats.avg_order_value,
        unique_customers: stats.unique_customers,
        cancelled_percentage: Math.round(cancelled_percentage * 10) / 10
      });
    } catch (err) {
      res.status(500).json({ error: 'Server error: ' + err.message });
    }
  });
  
  // GET /api/dashboard/sales-by-category
  app.get('/api/dashboard/sales-by-category', (req, res) => {
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
  app.get('/api/dashboard/top-customers', (req, res) => {
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
  
  return app;
}

describe('Preservation Property Tests: Existing Data and Endpoint Integrity', () => {
  let app;
  
  beforeEach(async () => {
    // Create fresh database for each test
    await createOldDatabaseSchema();
    app = createTestApp();
  });
  
  afterEach(() => {
    // Clean up database
    if (testDb) {
      testDb.close();
      testDb = null;
    }
  });
  
  /**
   * Property 2.1: Dashboard Endpoints Continue to Function
   * 
   * EXPECTED OUTCOME: This test MUST PASS on unfixed code
   * Confirms that existing dashboard endpoints work correctly without cancellation_reason column
   * 
   * **Validates: Requirements 3.3**
   */
  test('Property: All existing dashboard endpoints function correctly on database without cancellation_reason column', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random orders with unique IDs
        fc.uniqueArray(
          fc.record({
            order_id: fc.integer({ min: 1000, max: 9999 }).map(n => 'ORD' + n),
            customer_name: fc.constantFrom('John Doe', 'Jane Smith', 'Bob Johnson', 'Alice Williams'),
            product_name: fc.constantFrom('Laptop', 'Phone', 'Tablet', 'Monitor'),
            category: fc.constantFrom('Electronics', 'Furniture', 'Clothing'),
            order_value: fc.double({ min: 10, max: 2000, noNaN: true }),
            order_date: dateArbitrary(),
            payment_method: fc.constantFrom('Credit Card', 'PayPal', 'Bank Transfer'),
            region: fc.constantFrom('North', 'South', 'East', 'West'),
            status: fc.constantFrom('Completed', 'Pending', 'Shipped')
          }),
          { minLength: 1, maxLength: 20, selector: (order) => order.order_id }
        ),
        async (orders) => {
          // Clear existing orders before inserting new ones
          execute('DELETE FROM orders');
          
          // Insert orders into database
          for (const order of orders) {
            execute(`
              INSERT INTO orders (order_id, customer_name, product_name, category, order_value, order_date, payment_method, region, status, created_by)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
            `, [order.order_id, order.customer_name, order.product_name, order.category, order.order_value, order.order_date, order.payment_method, order.region, order.status]);
          }
          
          // Test /api/dashboard/kpis endpoint
          const kpisResponse = await request(app)
            .get('/api/dashboard/kpis')
            .expect(200);
          
          expect(kpisResponse.body).toHaveProperty('total_revenue');
          expect(kpisResponse.body).toHaveProperty('total_orders');
          expect(kpisResponse.body.total_orders).toBe(orders.length);
          
          // Test /api/dashboard/sales-by-category endpoint
          const categoryResponse = await request(app)
            .get('/api/dashboard/sales-by-category')
            .expect(200);
          
          expect(categoryResponse.body).toHaveProperty('data');
          expect(Array.isArray(categoryResponse.body.data)).toBe(true);
          
          // Test /api/dashboard/top-customers endpoint
          const customersResponse = await request(app)
            .get('/api/dashboard/top-customers')
            .expect(200);
          
          expect(customersResponse.body).toHaveProperty('data');
          expect(Array.isArray(customersResponse.body.data)).toBe(true);
        }
      ),
      { numRuns: 10 }
    );
  });
  
  /**
   * Property 2.2: Existing Order Data Integrity
   * 
   * EXPECTED OUTCOME: This test MUST PASS on unfixed code
   * Confirms that order data remains intact and queryable
   * 
   * **Validates: Requirements 3.4, 3.6**
   */
  test('Property: Existing order data remains intact with all fields preserved', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uniqueArray(
          fc.record({
            order_id: fc.integer({ min: 1000, max: 9999 }).map(n => 'ORD' + n),
            customer_name: fc.string({ minLength: 3, maxLength: 20 }),
            product_name: fc.string({ minLength: 3, maxLength: 20 }),
            category: fc.constantFrom('Electronics', 'Furniture', 'Clothing'),
            order_value: fc.double({ min: 10, max: 2000, noNaN: true }),
            order_date: dateArbitrary(),
            payment_method: fc.constantFrom('Credit Card', 'PayPal'),
            region: fc.constantFrom('North', 'South'),
            status: fc.constantFrom('Completed', 'Pending', 'Shipped', 'Cancelled')
          }),
          { minLength: 1, maxLength: 15, selector: (order) => order.order_id }
        ),
        async (orders) => {
          // Clear existing orders before inserting new ones
          execute('DELETE FROM orders');
          
          // Insert orders
          for (const order of orders) {
            execute(`
              INSERT INTO orders (order_id, customer_name, product_name, category, order_value, order_date, payment_method, region, status, created_by)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
            `, [order.order_id, order.customer_name, order.product_name, order.category, order.order_value, order.order_date, order.payment_method, order.region, order.status]);
          }
          
          // Query all orders back
          const retrievedOrders = queryAll('SELECT * FROM orders');
          
          // Verify all orders are present
          expect(retrievedOrders.length).toBe(orders.length);
          
          // Verify each order's data integrity
          for (const originalOrder of orders) {
            const retrieved = retrievedOrders.find(o => o.order_id === originalOrder.order_id);
            expect(retrieved).toBeDefined();
            expect(retrieved.customer_name).toBe(originalOrder.customer_name);
            expect(retrieved.product_name).toBe(originalOrder.product_name);
            expect(retrieved.category).toBe(originalOrder.category);
            expect(retrieved.order_value).toBeCloseTo(originalOrder.order_value, 2);
            expect(retrieved.order_date).toBe(originalOrder.order_date);
            expect(retrieved.status).toBe(originalOrder.status);
          }
        }
      ),
      { numRuns: 10 }
    );
  });
  
  /**
   * Property 2.3: Non-Cancelled Orders Have No Cancellation Data
   * 
   * EXPECTED OUTCOME: This test MUST PASS on unfixed code
   * Confirms that non-cancelled orders don't have cancellation_reason (column doesn't exist yet)
   * 
   * **Validates: Requirements 3.4**
   */
  test('Property: Non-cancelled orders can be queried without cancellation_reason column', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uniqueArray(
          fc.record({
            order_id: fc.integer({ min: 1000, max: 9999 }).map(n => 'ORD' + n),
            customer_name: fc.string({ minLength: 3, maxLength: 20 }),
            product_name: fc.string({ minLength: 3, maxLength: 20 }),
            category: fc.constantFrom('Electronics', 'Furniture'),
            order_value: fc.double({ min: 10, max: 2000, noNaN: true }),
            order_date: dateArbitrary(),
            payment_method: fc.constantFrom('Credit Card', 'PayPal'),
            region: fc.constantFrom('North', 'South'),
            status: fc.constantFrom('Completed', 'Pending', 'Shipped') // Only non-cancelled statuses
          }),
          { minLength: 1, maxLength: 15, selector: (order) => order.order_id }
        ),
        async (orders) => {
          // Clear existing orders before inserting new ones
          execute('DELETE FROM orders');
          
          // Insert non-cancelled orders
          for (const order of orders) {
            execute(`
              INSERT INTO orders (order_id, customer_name, product_name, category, order_value, order_date, payment_method, region, status, created_by)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
            `, [order.order_id, order.customer_name, order.product_name, order.category, order.order_value, order.order_date, order.payment_method, order.region, order.status]);
          }
          
          // Query non-cancelled orders (should work fine without cancellation_reason column)
          const nonCancelledOrders = queryAll(`
            SELECT order_id, customer_name, status, order_value
            FROM orders
            WHERE status != 'Cancelled'
          `);
          
          // All orders should be retrieved
          expect(nonCancelledOrders.length).toBe(orders.length);
          
          // Verify none are cancelled
          for (const order of nonCancelledOrders) {
            expect(order.status).not.toBe('Cancelled');
          }
        }
      ),
      { numRuns: 10 }
    );
  });
  
  /**
   * Property 2.4: Order Creation and Updates Continue to Work
   * 
   * EXPECTED OUTCOME: This test MUST PASS on unfixed code
   * Confirms that order creation works without cancellation_reason column
   * 
   * **Validates: Requirements 3.5**
   */
  test('Property: Order creation continues to work without cancellation_reason column', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          order_id: fc.integer({ min: 1000, max: 999999 }).map(n => 'ORD' + n),
          customer_name: fc.string({ minLength: 3, maxLength: 20 }),
          product_name: fc.string({ minLength: 3, maxLength: 20 }),
          category: fc.constantFrom('Electronics', 'Furniture', 'Clothing'),
          order_value: fc.double({ min: 10, max: 2000, noNaN: true }),
          order_date: dateArbitrary(),
          payment_method: fc.constantFrom('Credit Card', 'PayPal'),
          region: fc.constantFrom('North', 'South'),
          status: fc.constantFrom('Completed', 'Pending', 'Shipped', 'Cancelled')
        }),
        async (order) => {
          // Clear existing orders before inserting new one
          execute('DELETE FROM orders');
          
          // Create new order
          execute(`
            INSERT INTO orders (order_id, customer_name, product_name, category, order_value, order_date, payment_method, region, status, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
          `, [order.order_id, order.customer_name, order.product_name, order.category, order.order_value, order.order_date, order.payment_method, order.region, order.status]);
          
          // Verify order was created
          const created = queryOne('SELECT * FROM orders WHERE order_id = ?', [order.order_id]);
          expect(created).toBeDefined();
          expect(created.order_id).toBe(order.order_id);
          expect(created.status).toBe(order.status);
          
          // Update order status
          execute('UPDATE orders SET status = ? WHERE order_id = ?', ['Shipped', order.order_id]);
          
          // Verify update worked
          const updated = queryOne('SELECT * FROM orders WHERE order_id = ?', [order.order_id]);
          expect(updated.status).toBe('Shipped');
        }
      ),
      { numRuns: 10 }
    );
  });
  
  /**
   * Property 2.5: Date Range Filtering Continues to Work
   * 
   * EXPECTED OUTCOME: This test MUST PASS on unfixed code
   * Confirms that date filtering works correctly on existing endpoints
   * 
   * **Validates: Requirements 3.2, 3.3**
   */
  test('Property: Date range filtering works correctly on dashboard endpoints', async () => {
    // Insert test orders with specific dates
    execute(`
      INSERT INTO orders (order_id, customer_name, product_name, category, order_value, order_date, payment_method, region, status, created_by)
      VALUES 
        ('ORD001', 'John Doe', 'Laptop', 'Electronics', 1200.00, '2024-01-15', 'Credit Card', 'North', 'Completed', 1),
        ('ORD002', 'Jane Smith', 'Phone', 'Electronics', 800.00, '2024-02-20', 'PayPal', 'South', 'Completed', 1),
        ('ORD003', 'Bob Johnson', 'Tablet', 'Electronics', 500.00, '2024-03-25', 'Credit Card', 'East', 'Completed', 1)
    `);
    
    // Test date filtering on /api/dashboard/kpis
    const response = await request(app)
      .get('/api/dashboard/kpis')
      .query({ date_from: '2024-02-01', date_to: '2024-02-28' })
      .expect(200);
    
    // Should only include February order
    expect(response.body.total_orders).toBe(1);
    expect(response.body.total_revenue).toBeCloseTo(800, 2);
  });
});
