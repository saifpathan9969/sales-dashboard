import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { user, logout } = useAuth();
  const [theme] = useState('dark');

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Settings</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Manage your account and preferences</p>
      </div>

      {/* Profile Section */}
      <div className="glass-card" style={{ marginBottom: 24 }}>
        <div className="settings-section">
          <h3>👤 Profile</h3>
          <div className="detail-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="detail-item">
              <div className="detail-item-label">Name</div>
              <div className="detail-item-value">{user?.name}</div>
            </div>
            <div className="detail-item">
              <div className="detail-item-label">Email</div>
              <div className="detail-item-value">{user?.email}</div>
            </div>
            <div className="detail-item">
              <div className="detail-item-label">Role</div>
              <div className="detail-item-value">
                <span className={`badge ${user?.role === 'admin' ? 'badge-admin' : 'badge-user'}`}>{user?.role}</span>
              </div>
            </div>
            <div className="detail-item">
              <div className="detail-item-label">Account Created</div>
              <div className="detail-item-value" style={{ fontSize: '0.85rem' }}>
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="glass-card" style={{ marginBottom: 24 }}>
        <div className="settings-section">
          <h3>🎨 Preferences</h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
            <div>
              <div style={{ fontWeight: 500, marginBottom: 4 }}>Theme</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Choose your preferred appearance</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className={`btn btn-sm ${theme === 'dark' ? 'btn-primary' : 'btn-secondary'}`}>🌙 Dark</button>
              <button className="btn btn-secondary btn-sm" disabled style={{ opacity: 0.4 }}>☀️ Light</button>
            </div>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="glass-card" style={{ marginBottom: 24 }}>
        <div className="settings-section">
          <h3>ℹ️ About</h3>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.8 }}>
            <p><strong style={{ color: 'var(--text-primary)' }}>EDOS</strong> — E-Commerce Data & Operations Suite</p>
            <p>Sales Analytics Dashboard v1.0</p>
            <p>Team: Cyber Guard | Mentor: Anwar Nizami</p>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="glass-card" style={{ borderColor: 'rgba(244, 63, 94, 0.2)' }}>
        <div className="settings-section" style={{ marginBottom: 0 }}>
          <h3 style={{ color: 'var(--accent-rose)' }}>⚠️ Danger Zone</h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
            <div>
              <div style={{ fontWeight: 500, marginBottom: 4 }}>Sign Out</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>End your current session</div>
            </div>
            <button className="btn btn-danger" onClick={logout}>Sign Out</button>
          </div>
        </div>
      </div>
    </>
  );
}
