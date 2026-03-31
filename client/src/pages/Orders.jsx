import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

const formatCurrency = (v) => `$${Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('order_date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filters, setFilters] = useState({ category: '', status: '', date_from: '', date_to: '' });
  const [meta, setMeta] = useState({ categories: [], statuses: [] });
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [success, setSuccess] = useState('');
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: 15, sort, order: sortOrder };
      if (search) params.search = search;
      if (filters.category) params.category = filters.category;
      if (filters.status) params.status = filters.status;
      if (filters.date_from) params.date_from = filters.date_from;
      if (filters.date_to) params.date_to = filters.date_to;

      const [ordersRes, metaRes] = await Promise.all([
        api.getOrders(params),
        meta.categories.length ? Promise.resolve(meta) : api.getOrdersMeta()
      ]);
      setOrders(ordersRes.orders);
      setPagination(ordersRes.pagination);
      if (!meta.categories.length) setMeta(metaRes);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, sort, sortOrder, search, filters]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleSort = (col) => {
    if (sort === col) setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
    else { setSort(col); setSortOrder('desc'); }
  };

  const handleDelete = async (orderId) => {
    try {
      await api.deleteOrder(orderId);
      setDeleteConfirm(null);
      setSuccess('Order deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
      fetchOrders();
    } catch (err) {
      setError(err.message);
    }
  };

  const sortIcon = (col) => {
    if (sort !== col) return '↕';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  return (
    <>
      {success && <div className="alert alert-success">✓ {success}</div>}

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="form-group" style={{ flex: 2, minWidth: 200 }}>
          <label className="form-label">Search</label>
          <input type="text" className="form-input" placeholder="Search by order ID, customer, product..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <div className="form-group">
          <label className="form-label">Category</label>
          <select className="form-select" value={filters.category}
            onChange={e => { setFilters(p => ({ ...p, category: e.target.value })); setPage(1); }}>
            <option value="">All</option>
            {meta.categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Status</label>
          <select className="form-select" value={filters.status}
            onChange={e => { setFilters(p => ({ ...p, status: e.target.value })); setPage(1); }}>
            <option value="">All</option>
            {meta.statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">From</label>
          <input type="date" className="form-input" value={filters.date_from}
            onChange={e => { setFilters(p => ({ ...p, date_from: e.target.value })); setPage(1); }} />
        </div>
        <div className="form-group">
          <label className="form-label">To</label>
          <input type="date" className="form-input" value={filters.date_to}
            onChange={e => { setFilters(p => ({ ...p, date_to: e.target.value })); setPage(1); }} />
        </div>
        {isAdmin && (
          <div className="form-group" style={{ justifyContent: 'flex-end' }}>
            <label className="form-label">&nbsp;</label>
            <button className="btn btn-primary btn-sm" onClick={() => setShowCreateModal(true)}>+ New Order</button>
          </div>
        )}
      </div>

      {error && <div className="alert alert-error">⚠ {error}</div>}

      {/* Table */}
      <div className="table-container">
        <div className="table-header">
          <h3>📦 All Orders</h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{pagination.total} total orders</span>
        </div>

        <div className="table-wrapper">
          {loading ? (
            <div style={{ padding: 24 }}>
              {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton" style={{ height: 44, marginBottom: 8 }} />)}
            </div>
          ) : orders.length === 0 ? (
            <div className="state-container" style={{ padding: '60px' }}>
              <div className="state-icon">📭</div>
              <div className="state-title">No orders found</div>
              <div className="state-description">Try adjusting your search or filters</div>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th className={sort === 'order_id' ? 'sorted' : ''} onClick={() => handleSort('order_id')}>Order ID {sortIcon('order_id')}</th>
                  <th className={sort === 'customer_name' ? 'sorted' : ''} onClick={() => handleSort('customer_name')}>Customer {sortIcon('customer_name')}</th>
                  <th>Product</th>
                  <th className={sort === 'category' ? 'sorted' : ''} onClick={() => handleSort('category')}>Category {sortIcon('category')}</th>
                  <th className={sort === 'order_value' ? 'sorted' : ''} onClick={() => handleSort('order_value')}>Value {sortIcon('order_value')}</th>
                  <th className={sort === 'order_date' ? 'sorted' : ''} onClick={() => handleSort('order_date')}>Date {sortIcon('order_date')}</th>
                  <th className={sort === 'status' ? 'sorted' : ''} onClick={() => handleSort('status')}>Status {sortIcon('status')}</th>
                  {isAdmin && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.order_id}>
                    <td>
                      <span style={{ color: 'var(--accent-cyan)', fontWeight: 600, cursor: 'pointer' }}
                        onClick={() => navigate(`/orders/${o.order_id}`)}>{o.order_id}</span>
                    </td>
                    <td style={{ color: 'var(--text-primary)' }}>{o.customer_name}</td>
                    <td>{o.product_name}</td>
                    <td>{o.category}</td>
                    <td style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>{formatCurrency(o.order_value)}</td>
                    <td>{o.order_date}</td>
                    <td><span className={`badge badge-${o.status.toLowerCase()}`}>{o.status}</span></td>
                    {isAdmin && (
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/orders/${o.order_id}`)}>✏️</button>
                          <button className="btn btn-danger btn-sm" onClick={() => setDeleteConfirm(o.order_id)}>🗑️</button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="table-pagination">
            <span>Page {pagination.page} of {pagination.pages} ({pagination.total} orders)</span>
            <div className="pagination-buttons">
              <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
              {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => {
                const p = Math.max(1, pagination.page - 2) + i;
                if (p > pagination.pages) return null;
                return (
                  <button key={p} className={`btn btn-sm ${p === pagination.page ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setPage(p)}>{p}</button>
                );
              })}
              <button className="btn btn-secondary btn-sm" disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>⚠️ Delete Order</h3>
              <button className="modal-close" onClick={() => setDeleteConfirm(null)}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-secondary)' }}>
                Are you sure you want to delete order <strong style={{ color: 'var(--accent-cyan)' }}>{deleteConfirm}</strong>? This action cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm)}>Delete Order</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Order Modal */}
      {showCreateModal && <CreateOrderModal onClose={() => setShowCreateModal(false)} onCreated={() => { setShowCreateModal(false); setSuccess('Order created!'); setTimeout(() => setSuccess(''), 3000); fetchOrders(); }} meta={meta} />}
    </>
  );
}

function CreateOrderModal({ onClose, onCreated, meta }) {
  const [form, setForm] = useState({
    order_id: `ORD-${Date.now().toString().slice(-4)}`,
    customer_name: '', product_name: '', category: 'Accessories',
    order_value: '', order_date: new Date().toISOString().split('T')[0],
    payment_method: 'Card', region: 'North', status: 'Pending'
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.customer_name || !form.product_name || !form.order_value) {
      setError('Please fill in all required fields'); return;
    }
    setSubmitting(true);
    try {
      await api.createOrder({ ...form, order_value: parseFloat(form.order_value) });
      onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>➕ Create New Order</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-error">⚠ {error}</div>}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Order ID *</label>
                <input className="form-input" value={form.order_id} onChange={e => setForm(p => ({ ...p, order_id: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Customer Name *</label>
                <input className="form-input" value={form.customer_name} onChange={e => setForm(p => ({ ...p, customer_name: e.target.value }))} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Product *</label>
                <input className="form-input" value={form.product_name} onChange={e => setForm(p => ({ ...p, product_name: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-select" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                  {meta.categories.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Order Value ($) *</label>
                <input type="number" step="0.01" min="0" className="form-input" value={form.order_value} onChange={e => setForm(p => ({ ...p, order_value: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Order Date</label>
                <input type="date" className="form-input" value={form.order_date} onChange={e => setForm(p => ({ ...p, order_date: e.target.value }))} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Payment Method</label>
                <select className="form-select" value={form.payment_method} onChange={e => setForm(p => ({ ...p, payment_method: e.target.value }))}>
                  <option>Card</option><option>Bank Transfer</option><option>Paypal</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Region</label>
                <select className="form-select" value={form.region} onChange={e => setForm(p => ({ ...p, region: e.target.value }))}>
                  <option>North</option><option>South</option><option>East</option><option>West</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                <option>Pending</option><option>Completed</option><option>Cancelled</option>
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Creating...' : 'Create Order'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
