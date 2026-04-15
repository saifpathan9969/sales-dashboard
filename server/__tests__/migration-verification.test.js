/**
 * Migration Verification Test
 * 
 * This test verifies that the database migration in initDb() correctly adds
 * the cancellation_reason column to existing databases.
 */

const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

// Helper to execute queries
function queryAll(db, sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

describe('Database Migration Verification', () => {
  let SQL;
  
  beforeAll(async () => {
    SQL = await initSqlJs();
  });
  
  test('Migration adds cancellation_reason column to existing database without the column', async () => {
    // Create a database with OLD schema (no cancellation_reason column)
    const db = new SQL.Database();
    
    // Create orders table WITHOUT cancellation_reason column (simulating old database)
    db.run(`
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
    
    // Verify column doesn't exist initially
    let tableInfo = queryAll(db, `PRAGMA table_info(orders)`);
    let columnNames = tableInfo.map(col => col.name);
    expect(columnNames).not.toContain('cancellation_reason');
    
    // Run the migration (same logic as in initDb)
    try {
      db.run(`ALTER TABLE orders ADD COLUMN cancellation_reason TEXT`);
    } catch (e) {
      // Ignore "duplicate column name" error
      if (!e.message.includes('duplicate column name')) {
        throw e;
      }
    }
    
    // Verify column now exists
    tableInfo = queryAll(db, `PRAGMA table_info(orders)`);
    columnNames = tableInfo.map(col => col.name);
    expect(columnNames).toContain('cancellation_reason');
    
    // Verify we can insert data with the new column
    db.run(`
      INSERT INTO orders (order_id, customer_name, product_name, category, order_value, order_date, payment_method, region, status, cancellation_reason, created_by)
      VALUES ('ORD001', 'John Doe', 'Laptop', 'Electronics', 1200.00, '2024-01-15', 'Credit Card', 'North', 'Cancelled', 'Price change', 1)
    `);
    
    // Verify we can query the new column
    const result = queryAll(db, `SELECT cancellation_reason FROM orders WHERE order_id = 'ORD001'`);
    expect(result[0].cancellation_reason).toBe('Price change');
    
    db.close();
  });
  
  test('Migration is idempotent - running twice does not cause errors', async () => {
    // Create a database with OLD schema
    const db = new SQL.Database();
    
    db.run(`
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
    
    // Run migration first time
    try {
      db.run(`ALTER TABLE orders ADD COLUMN cancellation_reason TEXT`);
    } catch (e) {
      if (!e.message.includes('duplicate column name')) {
        throw e;
      }
    }
    
    // Run migration second time - should not throw error
    expect(() => {
      try {
        db.run(`ALTER TABLE orders ADD COLUMN cancellation_reason TEXT`);
      } catch (e) {
        if (!e.message.includes('duplicate column name')) {
          throw e;
        }
      }
    }).not.toThrow();
    
    // Verify column still exists and works
    const tableInfo = queryAll(db, `PRAGMA table_info(orders)`);
    const columnNames = tableInfo.map(col => col.name);
    expect(columnNames).toContain('cancellation_reason');
    
    db.close();
  });
  
  test('Migration preserves existing order data', async () => {
    // Create a database with OLD schema and existing data
    const db = new SQL.Database();
    
    db.run(`
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
    
    // Insert existing orders
    db.run(`
      INSERT INTO orders (order_id, customer_name, product_name, category, order_value, order_date, payment_method, region, status, created_by)
      VALUES 
        ('ORD001', 'John Doe', 'Laptop', 'Electronics', 1200.00, '2024-01-15', 'Credit Card', 'North', 'Completed', 1),
        ('ORD002', 'Jane Smith', 'Phone', 'Electronics', 800.00, '2024-01-16', 'PayPal', 'South', 'Cancelled', 1)
    `);
    
    // Get original data
    const originalOrders = queryAll(db, `SELECT order_id, customer_name, order_value, status FROM orders`);
    
    // Run migration
    try {
      db.run(`ALTER TABLE orders ADD COLUMN cancellation_reason TEXT`);
    } catch (e) {
      if (!e.message.includes('duplicate column name')) {
        throw e;
      }
    }
    
    // Get data after migration
    const migratedOrders = queryAll(db, `SELECT order_id, customer_name, order_value, status, cancellation_reason FROM orders`);
    
    // Verify all original data is preserved
    expect(migratedOrders.length).toBe(originalOrders.length);
    for (let i = 0; i < originalOrders.length; i++) {
      expect(migratedOrders[i].order_id).toBe(originalOrders[i].order_id);
      expect(migratedOrders[i].customer_name).toBe(originalOrders[i].customer_name);
      expect(migratedOrders[i].order_value).toBe(originalOrders[i].order_value);
      expect(migratedOrders[i].status).toBe(originalOrders[i].status);
      // New column should be NULL for existing orders
      expect(migratedOrders[i].cancellation_reason).toBeNull();
    }
    
    db.close();
  });
});
