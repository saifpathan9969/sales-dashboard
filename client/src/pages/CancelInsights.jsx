import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const COLORS = ['#fca311', '#e56b6f', '#eac435', '#3f88c5', '#032b43', '#8ac926', '#2a9d8f'];

export default function CancelInsights() {
  const { api } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    date_from: '',
    date_to: '',
    category: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async (currentFilters = filters) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (currentFilters.date_from) params.append('date_from', currentFilters.date_from);
      if (currentFilters.date_to) params.append('date_to', currentFilters.date_to);
      if (currentFilters.category) params.append('category', currentFilters.category);
      
      const res = await api.get(`/dashboard/cancellation-rates?${params.toString()}`);
      setData(res);
    } catch (err) {
      console.error('CancelInsights error:', err);
    }
    setLoading(false);
  };

  const applyFilters = () => {
    fetchData(filters);
  };

  const resetFilters = () => {
    const emptyFilters = { date_from: '', date_to: '', category: '' };
    setFilters(emptyFilters);
    fetchData(emptyFilters);
  };

  if (loading) return <div className="state-container"><div className="spinner" /></div>;
  if (!data) return <div className="state-container"><p className="state-title text-danger">Failed to load data</p></div>;

  const hasRealReasons = data.reasons && data.reasons.length > 0;
  const hasCategories = data.categories && data.categories.length > 0;

  return (
    <div className="fade-in">
      <header className="page-header">
        <div>
          <h1 className="page-title">Cancellation Insights</h1>
          <p className="page-subtitle">Behavioral analysis of order cancellations and revenue impact.</p>
        </div>
      </header>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="form-group">
          <label className="form-label">From Date</label>
          <input 
            type="date" 
            className="form-input" 
            value={filters.date_from}
            onChange={(e) => setFilters(f => ({ ...f, date_from: e.target.value }))}
          />
        </div>
        <div className="form-group">
          <label className="form-label">To Date</label>
          <input 
            type="date" 
            className="form-input"
            value={filters.date_to}
            onChange={(e) => setFilters(f => ({ ...f, date_to: e.target.value }))}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Category</label>
          <select 
            className="form-select"
            value={filters.category}
            onChange={(e) => setFilters(f => ({ ...f, category: e.target.value }))}
          >
            <option value="">All Categories</option>
            <option value="Electronics">Electronics</option>
            <option value="Clothing">Clothing</option>
            <option value="Home & Garden">Home & Garden</option>
            <option value="Books">Books</option>
            <option value="Sports">Sports</option>
          </select>
        </div>
        <button className="btn btn-primary" onClick={applyFilters}>Apply Filters</button>
        <button className="btn btn-secondary" onClick={resetFilters}>Reset</button>
      </div>
      
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-md" style={{ marginBottom: '2rem' }}>
        <div className="card">
          <p className="card-lbl">Cancellation Rate</p>
          <div className="card-val" style={{ color: '#e56b6f' }}>{data.cancellation_rate.toFixed(1)}%</div>
          <p className="card-trend">{data.cancelled_orders} out of {data.total_orders} orders</p>
        </div>
        <div className="card">
          <p className="card-lbl">Revenue Loss</p>
          <div className="card-val" style={{ color: '#e56b6f' }}>${data.revenue_loss.toLocaleString()}</div>
          <p className="card-trend">Direct impact of cancellations</p>
        </div>
        <div className="card">
           <div style={{ display:'flex', height:'100%', alignItems:'center', justifyContent:'center' }}>
             <button onClick={() => window.location.href = '/simulator'} className="btn btn-primary">
               Launch Simulator
             </button>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-md">
        {/* Reasons Chart */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', minHeight: '400px' }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', fontWeight: 600 }}>Reasons for Cancellation</h2>
          {hasRealReasons ? (
            <div style={{ flex: 1 }}>
              {data.reasons.map((item, index) => {
                const total = data.reasons.reduce((sum, r) => sum + r.count, 0);
                const percentage = ((item.count / total) * 100).toFixed(1);
                return (
                  <div key={index} style={{ marginBottom: '18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{item.reason}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{item.count} ({percentage}%)</span>
                    </div>
                    <div style={{ width: '100%', height: '24px', background: 'rgba(148, 163, 184, 0.1)', borderRadius: '12px', overflow: 'hidden' }}>
                      <div style={{ 
                        width: `${percentage}%`, 
                        height: '100%', 
                        background: COLORS[index % COLORS.length],
                        transition: 'width 0.5s ease',
                        borderRadius: '12px'
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '3rem', opacity: 0.3 }}>📊</div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No cancellation reason data available</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Run the simulator to generate sample data</p>
            </div>
          )}
        </div>

        {/* Categories Chart */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', minHeight: '400px' }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', fontWeight: 600 }}>Cancellations by Category</h2>
          {hasCategories ? (
            <div style={{ flex: 1 }}>
              {data.categories.map((item, index) => {
                const maxCount = Math.max(...data.categories.map(c => c.cancelled_count));
                const percentage = ((item.cancelled_count / maxCount) * 100).toFixed(1);
                return (
                  <div key={index} style={{ marginBottom: '18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{item.category}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{item.cancelled_count} cancelled</span>
                    </div>
                    <div style={{ width: '100%', height: '24px', background: 'rgba(148, 163, 184, 0.1)', borderRadius: '12px', overflow: 'hidden' }}>
                      <div style={{ 
                        width: `${percentage}%`, 
                        height: '100%', 
                        background: COLORS[index % COLORS.length],
                        transition: 'width 0.5s ease',
                        borderRadius: '12px'
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '3rem', opacity: 0.3 }}>📊</div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No category cancellation data available</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Run the simulator to generate sample data</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
