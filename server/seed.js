const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { initDb, queryOne, execute } = require('./db');

async function seed() {
  console.log('🌱 Seeding database...');
  await initDb();

  // Create default users
  const adminExists = queryOne("SELECT id FROM users WHERE email = 'admin@edos.com'");
  if (!adminExists) {
    const adminHash = bcrypt.hashSync('admin123', 10);
    execute('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', ['Admin User', 'admin@edos.com', adminHash, 'admin']);
    console.log('  ✓ Admin user created (admin@edos.com / admin123)');
  }

  const userExists = queryOne("SELECT id FROM users WHERE email = 'user@edos.com'");
  if (!userExists) {
    const userHash = bcrypt.hashSync('user123', 10);
    execute('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', ['Demo User', 'user@edos.com', userHash, 'user']);
    console.log('  ✓ Demo user created (user@edos.com / user123)');
  }

  // Import CSV data from synthetic dashboard datasets
  const syntheticPath = path.join(__dirname, '..', 'synthetic_dashboard_datasets', '01_sales_orders.csv');
  const fallbackPath = path.join(__dirname, '..', 'cleaned_sales_orders.csv');
  const csvPath = fs.existsSync(syntheticPath) ? syntheticPath : fallbackPath;
  if (!fs.existsSync(csvPath)) {
    console.log('  ⚠ CSV file not found, skipping data import');
    return;
  }
  console.log(`  📂 Loading data from: ${path.basename(path.dirname(csvPath))}/${path.basename(csvPath)}`);

  const orderCount = queryOne('SELECT COUNT(*) as count FROM orders');
  if (orderCount.count > 0) {
    console.log(`  ✓ Orders table already has ${orderCount.count} records, skipping import`);
    return;
  }

  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());

  let imported = 0;
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = line.split(',');
    const row = {};
    headers.forEach((h, idx) => { row[h] = values[idx] ? values[idx].trim() : ''; });

    try {
      execute(
        `INSERT OR IGNORE INTO orders (order_id, customer_name, product_name, category, order_value, order_date, payment_method, region, status, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [row.order_id, row.customer_name, row.product_name, row.category, parseFloat(row.order_value), row.order_date, row.payment_method, row.region, row.status, parseInt(row.created_by) || 1]
      );
      imported++;
    } catch (e) {
      // skip duplicate
    }
  }

  console.log(`  ✓ Imported ${imported} orders from CSV`);
  console.log('✅ Database seeded successfully!');
}

seed().catch(console.error);
