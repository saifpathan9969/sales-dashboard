const express = require('express');
const cors = require('cors');
const { initDb } = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/behavior', require('./routes/behavior'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend in production
const path = require('path');
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

// Initialize DB then start server
initDb().then(async () => {
  // Run seed in production
  if (process.env.NODE_ENV === 'production') {
    console.log('🌱 Running database seed...');
    try {
      const bcrypt = require('bcryptjs');
      const fs = require('fs');
      const { queryOne, execute } = require('./db');
      
      // Create admin user
      const adminExists = queryOne("SELECT id FROM users WHERE email = 'admin@edos.com'");
      if (!adminExists) {
        const adminHash = bcrypt.hashSync('admin123', 10);
        execute('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', 
          ['Admin User', 'admin@edos.com', adminHash, 'admin']);
        console.log('  ✓ Admin user created (admin@edos.com / admin123)');
      } else {
        console.log('  ✓ Admin user already exists');
      }
      
      // Create demo user
      const userExists = queryOne("SELECT id FROM users WHERE email = 'user@edos.com'");
      if (!userExists) {
        const userHash = bcrypt.hashSync('user123', 10);
        execute('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', 
          ['Demo User', 'user@edos.com', userHash, 'user']);
        console.log('  ✓ Demo user created (user@edos.com / user123)');
      } else {
        console.log('  ✓ Demo user already exists');
      }
      
      // Import CSV data
      const orderCount = queryOne('SELECT COUNT(*) as count FROM orders');
      if (orderCount.count === 0) {
        console.log('  📂 Importing sales data...');
        const csvPath = path.join(__dirname, '..', 'cleaned_sales_orders.csv');
        
        if (fs.existsSync(csvPath)) {
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
              // skip errors
            }
          }
          console.log(`  ✓ Imported ${imported} orders from CSV`);
        } else {
          console.log('  ⚠ CSV file not found, skipping data import');
        }
      } else {
        console.log(`  ✓ Orders table already has ${orderCount.count} records`);
      }
      
      console.log('✅ Database seeded successfully!');
    } catch (err) {
      console.error('Failed to seed database:', err);
    }
  }
  
  app.listen(PORT, () => {
    console.log(`\n🚀 EDOS API Server running on http://localhost:${PORT}`);
    console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
