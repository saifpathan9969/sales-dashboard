const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'dashboard.db');

let db = null;
let dbReady = null;

function initDb() {
  if (dbReady) return dbReady;
  
  dbReady = initSqlJs().then((SQL) => {
    try {
      if (fs.existsSync(DB_PATH)) {
        const buffer = fs.readFileSync(DB_PATH);
        db = new SQL.Database(buffer);
      } else {
        db = new SQL.Database();
      }
    } catch (e) {
      db = new SQL.Database();
    }
    
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
      CREATE TABLE IF NOT EXISTS customers (
        customer_id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_name TEXT NOT NULL,
        user_behavior_type TEXT,
        region TEXT,
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

    db.run(`
      CREATE TABLE IF NOT EXISTS behavioral_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        action TEXT NOT NULL,
        hesitation_score REAL,
        details TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);
    
    saveDb();
    return db;
  });
  
  return dbReady;
}

function getDb() {
  return db;
}

function saveDb() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

// Helper: run a query and return all results as objects
function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

// Helper: run a query and return first result
function queryOne(sql, params = []) {
  const rows = queryAll(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

// Helper: run a statement (INSERT/UPDATE/DELETE)
function execute(sql, params = []) {
  db.run(sql, params);
  saveDb();
  const changes = db.getRowsModified();
  // Get last insert id
  const lastId = queryOne('SELECT last_insert_rowid() as id');
  return { changes, lastInsertRowid: lastId ? lastId.id : 0 };
}

module.exports = { initDb, getDb, saveDb, queryAll, queryOne, execute };
