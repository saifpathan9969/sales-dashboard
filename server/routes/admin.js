const express = require('express');
const bcrypt = require('bcryptjs');
const { queryAll, queryOne, execute } = require('../db');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate, requireAdmin);

// GET /api/admin/users
router.get('/users', (req, res) => {
  try {
    const users = queryAll('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC');
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// PUT /api/admin/users/:id/role
router.put('/users/:id/role', (req, res) => {
  try {
    const { role } = req.body;
    if (!role || !['admin', 'user'].includes(role)) {
      return res.status(400).json({ error: 'Role must be admin or user' });
    }

    const user = queryOne('SELECT id, role FROM users WHERE id = ?', [parseInt(req.params.id)]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (role === 'user' && user.role === 'admin') {
      const adminCount = queryOne("SELECT COUNT(*) as count FROM users WHERE role = 'admin'");
      if (adminCount.count <= 1) {
        return res.status(400).json({ error: 'Cannot remove the last admin' });
      }
    }

    execute('UPDATE users SET role = ? WHERE id = ?', [role, parseInt(req.params.id)]);
    const updated = queryOne('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [parseInt(req.params.id)]);
    res.json({ user: updated, message: 'Role updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const user = queryOne('SELECT role FROM users WHERE id = ?', [userId]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.role === 'admin') {
      const adminCount = queryOne("SELECT COUNT(*) as count FROM users WHERE role = 'admin'");
      if (adminCount.count <= 1) {
        return res.status(400).json({ error: 'Cannot delete the last admin' });
      }
    }

    execute('DELETE FROM users WHERE id = ?', [userId]);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// POST /api/admin/users
router.post('/users', (req, res) => {
  try {
    const { name, email, password, role = 'user' } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existing = queryOne('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = execute('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', [name, email, hashedPassword, role]);
    const user = queryOne('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json({ user, message: 'User created successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

module.exports = router;
