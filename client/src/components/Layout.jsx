import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/orders', label: 'Orders', icon: '📦' },
];

const adminItems = [
  { path: '/admin', label: 'Admin Panel', icon: '🛡️' },
];

const bottomItems = [
  { path: '/settings', label: 'Settings', icon: '⚙️' },
];

const pageNames = {
  '/dashboard': 'Dashboard Overview',
  '/orders': 'Orders Management',
  '/admin': 'Admin Panel',
  '/settings': 'Settings',
};

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const currentPage = pageNames[location.pathname] || 'EDOS Dashboard';
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '??';

  return (
    <div className="app-layout">
      {sidebarOpen && <div className="modal-overlay" style={{ zIndex: 99 }} onClick={() => setSidebarOpen(false)} />}
      
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">E</div>
          <div>
            <h1>EDOS</h1>
            <span>Sales Analytics</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Main</div>
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="sidebar-link-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}

          {isAdmin && (
            <>
              <div className="sidebar-section-label">Administration</div>
              {adminItems.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className="sidebar-link-icon">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </>
          )}

          <div style={{ flex: 1 }} />
          
          <div className="sidebar-section-label">Account</div>
          {bottomItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="sidebar-link-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-user">
          <div className="sidebar-user-info">
            <div className="sidebar-user-avatar">{initials}</div>
            <div className="sidebar-user-details">
              <div className="sidebar-user-name">{user?.name}</div>
              <div className="sidebar-user-role">{user?.role}</div>
            </div>
            <button className="sidebar-logout-btn" onClick={logout} title="Logout">⏻</button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
            <h2 className="header-title">{currentPage}</h2>
          </div>
          <div className="header-right">
            <span className={`badge ${user?.role === 'admin' ? 'badge-admin' : 'badge-user'}`}>
              {user?.role}
            </span>
          </div>
        </header>

        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
