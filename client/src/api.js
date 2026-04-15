const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  const res = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Something went wrong');
  }
  return data;
}

export const api = {
  // Auth
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  signup: (name, email, password) => request('/auth/signup', { method: 'POST', body: JSON.stringify({ name, email, password }) }),
  getMe: () => request('/auth/me'),

  // Dashboard
  getKPIs: (params) => request(`/dashboard/kpis?${new URLSearchParams(params)}`),
  getRevenueOverTime: (params) => request(`/dashboard/revenue-over-time?${new URLSearchParams(params)}`),
  getSalesByCategory: (params) => request(`/dashboard/sales-by-category?${new URLSearchParams(params)}`),
  getTopCustomers: (params) => request(`/dashboard/top-customers?${new URLSearchParams(params)}`),

  // Orders
  getOrders: (params) => request(`/orders?${new URLSearchParams(params)}`),
  getOrdersMeta: () => request('/orders/meta'),
  getOrder: (id) => request(`/orders/${id}`),
  createOrder: (data) => request('/orders', { method: 'POST', body: JSON.stringify(data) }),
  updateOrder: (id, data) => request(`/orders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteOrder: (id) => request(`/orders/${id}`, { method: 'DELETE' }),

  // Admin
  getUsers: () => request('/admin/users'),
  updateUserRole: (id, role) => request(`/admin/users/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),
  deleteUser: (id) => request(`/admin/users/${id}`, { method: 'DELETE' }),
  createUser: (data) => request('/admin/users', { method: 'POST', body: JSON.stringify(data) }),

  // Diagnostics
  getDiagnosticsSchema: () => request('/diagnostics/schema'),
  getDiagnosticsTestQuery: () => request('/diagnostics/test-query'),
  getDiagnosticsOrdersCount: () => request('/diagnostics/orders-count'),
  
  // Generic get method for flexibility
  get: (endpoint) => request(endpoint),
};
