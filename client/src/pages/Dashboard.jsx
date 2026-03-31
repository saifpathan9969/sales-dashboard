import { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

const formatCurrency = (v) => `$${Number(v).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const formatNumber = (v) => Number(v).toLocaleString();

const CustomTooltip = ({ active, payload, label, isCurrency }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(17, 22, 56, 0.95)', border: '1px solid rgba(148,163,184,0.2)',
      borderRadius: '8px', padding: '10px 14px', fontSize: '0.8rem'
    }}>
      <div style={{ color: '#94a3b8', marginBottom: '4px' }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontWeight: 600 }}>
          {p.name}: {isCurrency ? formatCurrency(p.value) : formatNumber(p.value)}
        </div>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const [kpis, setKpis] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ date_from: '', date_to: '', category: '' });
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (filters.date_from) params.date_from = filters.date_from;
      if (filters.date_to) params.date_to = filters.date_to;
      if (filters.category) params.category = filters.category;

      const [kpiRes, revRes, catRes, ordersRes, metaRes] = await Promise.all([
        api.getKPIs(params),
        api.getRevenueOverTime(params),
        api.getSalesByCategory(params),
        api.getOrders({ limit: 8, sort: 'order_date', order: 'desc' }),
        api.getOrdersMeta()
      ]);

      setKpis(kpiRes);
      setRevenueData(revRes.data.map(d => ({
        ...d,
        month: d.month,
        revenue: Math.round(d.revenue * 100) / 100
      })));
      setCategoryData(catRes.data.map(d => ({
        ...d,
        revenue: Math.round(d.revenue * 100) / 100
      })));
      setRecentOrders(ordersRes.orders);
      setCategories(metaRes.categories);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (error) {
    return (
      <div className="state-container">
        <div className="state-icon">❌</div>
        <div className="state-title">Failed to load dashboard</div>
        <div className="state-description">{error}</div>
        <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={fetchData}>Retry</button>
      </div>
    );
  }

  return (
    <>
      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="form-group">
          <label className="form-label">From Date</label>
          <input type="date" className="form-input" value={filters.date_from}
            onChange={e => setFilters(p => ({ ...p, date_from: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="form-label">To Date</label>
          <input type="date" className="form-input" value={filters.date_to}
            onChange={e => setFilters(p => ({ ...p, date_to: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="form-label">Category</label>
          <select className="form-select" value={filters.category}
            onChange={e => setFilters(p => ({ ...p, category: e.target.value }))}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="form-group" style={{ justifyContent: 'flex-end' }}>
          <label className="form-label">&nbsp;</label>
          <button className="btn btn-secondary btn-sm" onClick={() => setFilters({ date_from: '', date_to: '', category: '' })}>
            Reset
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {loading ? (
        <div className="kpi-grid">
          {[1,2,3,4].map(i => (
            <div key={i} className="kpi-card"><div className="skeleton" style={{ height: 80 }} /></div>
          ))}
        </div>
      ) : kpis && (
        <div className="kpi-grid">
          <div className="kpi-card cyan">
            <div className="kpi-header">
              <span className="kpi-label">Total Revenue</span>
              <div className="kpi-icon cyan">💰</div>
            </div>
            <div className="kpi-value">{formatCurrency(kpis.total_revenue)}</div>
            <div className={`kpi-change ${kpis.growth_percentage >= 0 ? 'positive' : 'negative'}`}>
              {kpis.growth_percentage >= 0 ? '↑' : '↓'} {Math.abs(kpis.growth_percentage)}%
            </div>
          </div>

          <div className="kpi-card purple">
            <div className="kpi-header">
              <span className="kpi-label">Total Orders</span>
              <div className="kpi-icon purple">📦</div>
            </div>
            <div className="kpi-value">{formatNumber(kpis.total_orders)}</div>
          </div>

          <div className="kpi-card emerald">
            <div className="kpi-header">
              <span className="kpi-label">Avg Order Value</span>
              <div className="kpi-icon emerald">📈</div>
            </div>
            <div className="kpi-value">{formatCurrency(kpis.avg_order_value)}</div>
          </div>

          <div className="kpi-card amber">
            <div className="kpi-header">
              <span className="kpi-label">Growth %</span>
              <div className="kpi-icon amber">🚀</div>
            </div>
            <div className="kpi-value">{kpis.growth_percentage}%</div>
            <div className={`kpi-change ${kpis.growth_percentage >= 0 ? 'positive' : 'negative'}`}>
              {kpis.growth_percentage >= 0 ? 'Growing' : 'Declining'}
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      {loading ? (
        <div className="charts-grid">
          <div className="chart-card"><div className="skeleton" style={{ height: 300 }} /></div>
          <div className="chart-card"><div className="skeleton" style={{ height: 300 }} /></div>
        </div>
      ) : (
        <div className="charts-grid">
          <div className="chart-card">
            <h3>📈 Revenue Over Time</h3>
            {revenueData.length === 0 ? (
              <div className="state-container" style={{ padding: '40px 0' }}>
                <div className="state-icon">📉</div>
                <div className="state-description">No revenue data for selected period</div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#00d4ff" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip isCurrency />} />
                  <Area type="monotone" dataKey="revenue" stroke="#00d4ff" strokeWidth={2.5} fill="url(#colorRevenue)" name="Revenue" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="chart-card">
            <h3>📊 Sales by Category</h3>
            {categoryData.length === 0 ? (
              <div className="state-container" style={{ padding: '40px 0' }}>
                <div className="state-icon">📉</div>
                <div className="state-description">No category data for selected period</div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                  <XAxis type="number" stroke="#64748b" fontSize={12} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="category" stroke="#64748b" fontSize={12} tickLine={false} width={80} />
                  <Tooltip content={<CustomTooltip isCurrency />} />
                  <Bar dataKey="revenue" fill="#7c3aed" radius={[0, 6, 6, 0]} name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {/* Recent Orders Table */}
      <div className="table-container">
        <div className="table-header">
          <h3>📋 Recent Orders</h3>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/orders')}>View All →</button>
        </div>
        <div className="table-wrapper">
          {loading ? (
            <div style={{ padding: 24 }}>
              {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 44, marginBottom: 8 }} />)}
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="state-container" style={{ padding: '40px' }}>
              <div className="state-icon">📭</div>
              <div className="state-title">No orders found</div>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Value</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(order => (
                  <tr key={order.order_id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/orders/${order.order_id}`)}>
                    <td style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>{order.order_id}</td>
                    <td style={{ color: 'var(--text-primary)' }}>{order.customer_name}</td>
                    <td>{order.product_name}</td>
                    <td>{order.category}</td>
                    <td style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>{formatCurrency(order.order_value)}</td>
                    <td>{order.order_date}</td>
                    <td>
                      <span className={`badge badge-${order.status.toLowerCase()}`}>{order.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
