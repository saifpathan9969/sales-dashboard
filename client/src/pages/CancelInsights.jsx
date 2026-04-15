import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const COLORS = ['#fca311', '#e56b6f', '#eac435', '#3f88c5', '#032b43', '#8ac926', '#2a9d8f'];

export default function CancelInsights() {
  const { api } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/dashboard/cancellation-rates');
      setData(res);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  if (loading) return <div className="state-container"><div className="spinner" /></div>;
  if (!data) return <div className="state-container"><p className="state-title text-danger">Failed to load data</p></div>;

  return (
    <div className="fade-in">
      <header className="page-header">
        <div>
          <h1 className="page-title">Cancellation Insights</h1>
          <p className="page-subtitle">Behavioral analysis of order cancellations and revenue impact.</p>
        </div>
      </header>
      
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
             <button onClick={() => window.open('http://localhost:5174', '_blank')} className="btn btn-primary">
               Launch Simulator
             </button>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-md">
        {/* Reasons Chart */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', fontWeight: 600 }}>Reasons for Cancellation</h2>
          {data.reasons.length > 0 ? (
            <div style={{ flex: 1, minHeight: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.reasons}
                    dataKey="count"
                    nameKey="reason"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {data.reasons.map((entry, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#18191b', border: '1px solid #2c2c30', borderRadius: '8px' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="state-container"><p className="state-title text-muted">No cancellation data available.</p></div>
          )}
        </div>

        {/* Categories Chart */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', fontWeight: 600 }}>Cancellations by Category</h2>
          {data.categories.length > 0 ? (
            <div style={{ flex: 1, minHeight: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.categories} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2c2c30" horizontal={false} />
                  <XAxis type="number" stroke="#8e8e93" />
                  <YAxis dataKey="category" type="category" stroke="#8e8e93" width={100} />
                  <RechartsTooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#18191b', border: '1px solid #2c2c30', borderRadius: '8px' }} />
                  <Bar dataKey="cancelled_count" fill="#e56b6f" radius={[0, 4, 4, 0]}>
                    {data.categories.map((entry, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="state-container"><p className="state-title text-muted">No cancellation data available.</p></div>
          )}
        </div>
      </div>
    </div>
  );
}
