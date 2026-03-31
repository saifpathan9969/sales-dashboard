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
      // Import and run seed directly
      const bcrypt = require('bcryptjs');
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
