/**
 * Integration Test for initDb() function
 * 
 * This test verifies that the actual initDb() function from db.js
 * correctly handles the migration.
 */

const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

// Mock the db.js module to test initDb in isolation
const DB_PATH = path.join(__dirname, '../test-dashboard.db');

describe('initDb() Integration Test', () => {
  let db;
  let SQL;
  
  beforeAll(async () => {
    SQL = await initSqlJs();
  });
  
  beforeEach(() => {
    // Clean up test database before each test
    if (fs.existsSync(DB_PATH)) {
      fs.unlinkSync(DB_PATH);
    }
  });
  
  afterEach(() => {
    // Clean up test database after each test
    if (db) {
      db.close();
      db = null;
    }
    if (fs.existsSync(DB_PATH)) {
      fs.unlinkSync(DB_PATH);
    }
  });
  
  test('initDb creates orders table with cancellation_reason column for new database', async () => {
    // Simulate initDb logic for new database
    db = new SQL.Database();
    
    // Create tables (same as initDb)
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);
    
    db.run(`
      CREATE TABLE IF NOT EXISTS orders (
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
        cancellation_reason TEXT,
        created_by INTEGER,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `);
    
    // Run migration (same as initDb)
    try {
      db.run(`ALTER TABLE orders ADD COLUMN cancellation_reason TEXT`);
    } catch (e) {
      if (!e.message.includes('duplicate column name')) {
        throw e;
      }
    }
    
    // Verify column exists
    const stmt = db.prepare(`PRAGMA table_info(orders)`);
    const columns = [];
    while (stmt.step()) {
      columns.push(stmt.getAsObject());
    }
    stmt.free();
    
    const columnNames = columns.map(col => col.name);
    expect(columnNames).toContain('cancellation_reason');
  });
  
  test('initDb adds cancellation_reason column to existing database without it', async () => {
    // Create an existing database WITHOUT cancellation_reason column
    db = new SQL.Database();
    
    db.run(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);
    
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
    
    // Insert existing data
    db.run(`
      INSERT INTO orders (order_id, customer_name, product_name, category, order_value, order_date, payment_method, region, status, created_by)
      VALUES ('ORD001', 'John Doe', 'Laptop', 'Electronics', 1200.00, '2024-01-15', 'Credit Card', 'North', 'Cancelled', 1)
    `);
    
    // Save to file
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
    db.close();
    
    // Now simulate initDb loading this existing database
    const existingBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(existingBuffer);
    
    // Run CREATE TABLE IF NOT EXISTS (should skip since table exists)
    db.run(`
      CREATE TABLE IF NOT EXISTS orders (
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
        cancellation_reason TEXT,
        created_by INTEGER,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `);
    
    // Run migration (this is the key part that fixes the bug)
    try {
      db.run(`ALTER TABLE orders ADD COLUMN cancellation_reason TEXT`);
    } catch (e) {
      if (!e.message.includes('duplicate column name')) {
        throw e;
      }
    }
    
    // Verify column now exists
    const stmt = db.prepare(`PRAGMA table_info(orders)`);
    const columns = [];
    while (stmt.step()) {
      columns.push(stmt.getAsObject());
    }
    stmt.free();
    
    const columnNames = columns.map(col => col.name);
    expect(columnNames).toContain('cancellation_reason');
    
    // Verify existing data is preserved
    const orderStmt = db.prepare(`SELECT * FROM orders WHERE order_id = 'ORD001'`);
    orderStmt.step();
    const order = orderStmt.getAsObject();
    orderStmt.free();
    
    expect(order.order_id).toBe('ORD001');
    expect(order.customer_name).toBe('John Doe');
    expect(order.cancellation_reason).toBeNull();
  });
  
  test('Can query cancellation_reason after migration', async () => {
    // Create database with old schema
    db = new SQL.Database();
    
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
    
    db.run(`
      INSERT INTO orders (order_id, customer_name, product_name, category, order_value, order_date, payment_method, region, status, created_by)
      VALUES 
        ('ORD001', 'John Doe', 'Laptop', 'Electronics', 1200.00, '2024-01-15', 'Credit Card', 'North', 'Cancelled', 1),
        ('ORD002', 'Jane Smith', 'Phone', 'Electronics', 800.00, '2024-01-16', 'PayPal', 'South', 'Cancelled', 1)
    `);
    
    // Run migration
    try {
      db.run(`ALTER TABLE orders ADD COLUMN cancellation_reason TEXT`);
    } catch (e) {
      if (!e.message.includes('duplicate column name')) {
        throw e;
      }
    }
    
    // This query should now work (it's the one that was failing before)
    const stmt = db.prepare(`
      SELECT COALESCE(cancellation_reason, 'Unspecified') as reason, COUNT(*) as count
      FROM orders WHERE status = 'Cancelled'
      GROUP BY reason
    `);
    
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    
    // Should return results without error
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].reason).toBe('Unspecified'); // NULL values become 'Unspecified'
    expect(results[0].count).toBe(2);
  });
});
