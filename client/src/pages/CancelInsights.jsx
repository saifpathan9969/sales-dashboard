import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

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
      console.log('CancelInsights data received:', res);
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

  // Debug: Log data structure
  console.log('=== CANCEL INSIGHTS DEBUG ===');
  console.log('Data object:', data);
  console.log('Reasons array:', data.reasons);
  console.log('Categories array:', data.categories);
  console.log('Has reasons?', data.reasons && data.reasons.length > 0);
  console.log('Has categories?', data.categories && data.categories.length > 0);

  // Show charts if there are ANY reasons (including Unspecified) or categories
  const hasRealReasons = data.reasons && data.reasons.length > 0;
  const hasCategories = data.categories && data.categories.length > 0;
  
  console.log('hasRealReasons:', hasRealReasons);
  console.log('hasCategories:', hasCategories);

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

      {/* DEBUG PANEL - Remove after testing */}
      <div style={{ 
        margin: '20px 0', 
        padding: '15px', 
        background: 'rgba(255, 0, 0, 0.1)', 
        border: '2px solid red', 
        borderRadius: '8px',
        color: 'white'
      }}>
        <h3 style={{ marginBottom: '10px' }}>🔍 DEBUG INFO (Remove this after testing)</h3>
        <pre style={{ fontSize: '12px', overflow: 'auto' }}>
          {JSON.stringify({
            hasData: !!data,
            hasRealReasons,
            hasCategories,
            reasonsCount: data?.reasons?.length || 0,
            categoriesCount: data?.categories?.length || 0,
            reasons: data?.reasons || [],
            categories: data?.categories || []
          }, null, 2)}
        </pre>
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
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', minHeight: '400px', border: '3px solid yellow' }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', fontWeight: 600 }}>Reasons for Cancellation</h2>
          <div style={{ background: 'rgba(255,255,0,0.1)', padding: '10px', marginBottom: '10px' }}>
            DEBUG: hasRealReasons = {hasRealReasons ? 'TRUE' : 'FALSE'}
          </div>
          {hasRealReasons ? (
            <div style={{ flex: 1, minHeight: '300px', border: '2px solid green', background: 'rgba(0,255,0,0.05)' }}>
              <p style={{ color: 'lime' }}>CHART CONTAINER IS RENDERING</p>
              <p style={{ color: 'yellow', fontSize: '12px' }}>Data: {JSON.stringify(data.reasons)}</p>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.reasons}
                    dataKey="count"
                    nameKey="reason"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={true}
                  >
                    {data.reasons.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px', border: '2px solid red' }}>
              <p style={{ color: 'red' }}>EMPTY STATE IS RENDERING</p>
              <div style={{ fontSize: '3rem', opacity: 0.3 }}>📊</div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No cancellation reason data available</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Run the simulator to generate sample data</p>
            </div>
          )}
        </div>

        {/* Categories Chart */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', minHeight: '400px', border: '3px solid yellow' }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', fontWeight: 600 }}>Cancellations by Category</h2>
          <div style={{ background: 'rgba(255,255,0,0.1)', padding: '10px', marginBottom: '10px' }}>
            DEBUG: hasCategories = {hasCategories ? 'TRUE' : 'FALSE'}
          </div>
          {hasCategories ? (
            <div style={{ flex: 1, minHeight: '300px', border: '2px solid green', background: 'rgba(0,255,0,0.05)' }}>
              <p style={{ color: 'lime' }}>CHART CONTAINER IS RENDERING</p>
              <p style={{ color: 'yellow', fontSize: '12px' }}>Data: {JSON.stringify(data.categories)}</p>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.categories} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2c2c30" horizontal={false} />
                  <XAxis type="number" stroke="#8e8e93" />
                  <YAxis dataKey="category" type="category" stroke="#8e8e93" width={100} />
                  <RechartsTooltip />
                  <Bar dataKey="cancelled_count" fill="#e56b6f" radius={[0, 4, 4, 0]}>
                    {data.categories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px', border: '2px solid red' }}>
              <p style={{ color: 'red' }}>EMPTY STATE IS RENDERING</p>
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
