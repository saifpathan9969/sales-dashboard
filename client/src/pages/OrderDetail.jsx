import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

const formatCurrency = (v) => `$${Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setLoading(true);
    api.getOrder(id)
      .then(data => { setOrder(data.order); setForm(data.order); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.updateOrder(id, {
        customer_name: form.customer_name,
        product_name: form.product_name,
        category: form.category,
        order_value: parseFloat(form.order_value),
        order_date: form.order_date,
        payment_method: form.payment_method,
        region: form.region,
        status: form.status,
      });
      setOrder(res.order);
      setEditing(false);
      setSuccess('Order updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this order?')) return;
    try {
      await api.deleteOrder(id);
      navigate('/orders');
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="state-container">
        <div className="spinner" />
        <div className="state-title">Loading order details...</div>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="state-container">
        <div className="state-icon">❌</div>
        <div className="state-title">Order not found</div>
        <div className="state-description">{error}</div>
        <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/orders')}>← Back to Orders</button>
      </div>
    );
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/orders')}>← Back</button>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>{order.order_id}</h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Order Details</span>
          </div>
        </div>
        {isAdmin && (
          <div style={{ display: 'flex', gap: 10 }}>
            {editing ? (
              <>
                <button className="btn btn-secondary" onClick={() => { setEditing(false); setForm(order); }}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
              </>
            ) : (
              <>
                <button className="btn btn-primary btn-sm" onClick={() => setEditing(true)}>✏️ Edit</button>
                <button className="btn btn-danger btn-sm" onClick={handleDelete}>🗑️ Delete</button>
              </>
            )}
          </div>
        )}
      </div>

      {success && <div className="alert alert-success">✓ {success}</div>}
      {error && <div className="alert alert-error">⚠ {error}</div>}

      <div className="glass-card">
        {editing ? (
          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Customer Name</label>
              <input className="form-input" value={form.customer_name || ''} onChange={e => setForm(p => ({ ...p, customer_name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Product Name</label>
              <input className="form-input" value={form.product_name || ''} onChange={e => setForm(p => ({ ...p, product_name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" value={form.category || ''} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                {['Accessories', 'Electronics', 'Fashion', 'Fitness', 'Home', 'Stationery'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Order Value ($)</label>
              <input type="number" step="0.01" className="form-input" value={form.order_value || ''} onChange={e => setForm(p => ({ ...p, order_value: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Order Date</label>
              <input type="date" className="form-input" value={form.order_date || ''} onChange={e => setForm(p => ({ ...p, order_date: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Payment Method</label>
              <select className="form-select" value={form.payment_method || ''} onChange={e => setForm(p => ({ ...p, payment_method: e.target.value }))}>
                <option>Card</option><option>Bank Transfer</option><option>Paypal</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Region</label>
              <select className="form-select" value={form.region || ''} onChange={e => setForm(p => ({ ...p, region: e.target.value }))}>
                <option>North</option><option>South</option><option>East</option><option>West</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status || ''} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                <option>Pending</option><option>Completed</option><option>Cancelled</option>
              </select>
            </div>
          </div>
        ) : (
          <div className="detail-grid">
            <div className="detail-item">
              <div className="detail-item-label">Customer</div>
              <div className="detail-item-value">{order.customer_name}</div>
            </div>
            <div className="detail-item">
              <div className="detail-item-label">Product</div>
              <div className="detail-item-value">{order.product_name}</div>
            </div>
            <div className="detail-item">
              <div className="detail-item-label">Category</div>
              <div className="detail-item-value">{order.category}</div>
            </div>
            <div className="detail-item">
              <div className="detail-item-label">Order Value</div>
              <div className="detail-item-value" style={{ color: 'var(--accent-emerald)' }}>{formatCurrency(order.order_value)}</div>
            </div>
            <div className="detail-item">
              <div className="detail-item-label">Order Date</div>
              <div className="detail-item-value">{order.order_date}</div>
            </div>
            <div className="detail-item">
              <div className="detail-item-label">Payment Method</div>
              <div className="detail-item-value">{order.payment_method}</div>
            </div>
            <div className="detail-item">
              <div className="detail-item-label">Region</div>
              <div className="detail-item-value">{order.region}</div>
            </div>
            <div className="detail-item">
              <div className="detail-item-label">Status</div>
              <div className="detail-item-value">
                <span className={`badge badge-${order.status.toLowerCase()}`}>{order.status}</span>
              </div>
            </div>
            <div className="detail-item">
              <div className="detail-item-label">Created At</div>
              <div className="detail-item-value" style={{ fontSize: '0.85rem' }}>{order.created_at || 'N/A'}</div>
            </div>
            <div className="detail-item">
              <div className="detail-item-label">Last Updated</div>
              <div className="detail-item-value" style={{ fontSize: '0.85rem' }}>{order.updated_at || 'N/A'}</div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
