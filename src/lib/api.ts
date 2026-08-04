import { User, Product, Category, Unit, Supplier, Customer, Sale, StockMovement, DashboardSummary, RevenueTrendPoint, TopProduct, CashierActivity, AuditLog, PaymentMethod } from '../types';

const API_BASE = '/api';

function getStoredAccessToken(): string | null {
  return localStorage.getItem('smartpos_access_token');
}

function getStoredRefreshToken(): string | null {
  return localStorage.getItem('smartpos_refresh_token');
}

export function setStoredTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem('smartpos_access_token', accessToken);
  localStorage.setItem('smartpos_refresh_token', refreshToken);
}

export function clearStoredTokens() {
  localStorage.removeItem('smartpos_access_token');
  localStorage.removeItem('smartpos_refresh_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  let token = getStoredAccessToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  // Attempt refresh token if 401
  if (res.status === 401) {
    const refreshToken = getStoredRefreshToken();
    if (refreshToken) {
      try {
        const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken })
        });

        if (refreshRes.ok) {
          const data = await refreshRes.json();
          setStoredTokens(data.accessToken, data.refreshToken);
          headers['Authorization'] = `Bearer ${data.accessToken}`;

          // Retry original request
          res = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers
          });
        } else {
          clearStoredTokens();
          window.dispatchEvent(new Event('smartpos_logout'));
        }
      } catch {
        clearStoredTokens();
        window.dispatchEvent(new Event('smartpos_logout'));
      }
    } else {
      clearStoredTokens();
      window.dispatchEvent(new Event('smartpos_logout'));
    }
  }

  const responseData = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(responseData.error || `Request failed with status ${res.status}`);
  }

  return responseData as T;
}

export const api = {
  // Auth
  login: (username: string, password: string) =>
    request<{ accessToken: string; refreshToken: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    }),

  getMe: () => request<{ user: User }>('/auth/me'),

  getProfile: () => request<User>('/users/profile'),

  updateProfile: (data: { fullName?: string; username?: string; phone?: string; address?: string }) =>
    request<{ user?: User; id?: string; fullName?: string; username?: string; phone?: string; address?: string }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  updateUserProfile: (id: string, data: { fullName?: string; username?: string; phone?: string; address?: string }) =>
    request<User>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  logout: () => request('/auth/logout', { method: 'POST' }),

  changePassword: (currentPassword: string, newPassword: string) =>
    request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword })
    }),

  // Dashboard
  getDashboardSummary: () => request<DashboardSummary>('/dashboard/summary'),
  getRevenueTrend: () => request<RevenueTrendPoint[]>('/dashboard/revenue-trend'),
  getTopSellingProducts: () => request<TopProduct[]>('/dashboard/top-selling'),
  getInventoryStatus: () => request<Array<{ name: string; value: number; color: string }>>('/dashboard/inventory-status'),
  getCashierSummary: () => request<{ todayTotal: number; todayCount: number; avgOrder: number; allTimeSalesCount: number }>('/dashboard/cashier-summary'),

  // Products
  getProducts: (params?: { query?: string; categoryId?: string; supplierId?: string; status?: string }) => {
    const qp = new URLSearchParams();
    if (params?.query) qp.set('query', params.query);
    if (params?.categoryId) qp.set('categoryId', params.categoryId);
    if (params?.supplierId) qp.set('supplierId', params.supplierId);
    if (params?.status) qp.set('status', params.status);
    const str = qp.toString();
    return request<Product[]>(`/products${str ? '?' + str : ''}`);
  },

  getProductByBarcode: (barcode: string) => request<Product>(`/products/search/barcode/${barcode}`),

  createProduct: (data: Partial<Product>) => request<Product>('/products', { method: 'POST', body: JSON.stringify(data) }),

  updateProduct: (id: string, data: Partial<Product>) => request<Product>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteProduct: (id: string) => request(`/products/${id}`, { method: 'DELETE' }),

  uploadProductImage: async (file: File): Promise<{ imageUrl: string }> => {
    const formData = new FormData();
    formData.append('image', file);
    const token = getStoredAccessToken();

    const res = await fetch(`${API_BASE}/products/upload-image`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to upload image');
    return data;
  },

  // Categories & Units
  getCategories: () => request<Category[]>('/categories'),
  getUnits: () => request<Unit[]>('/categories/units'),
  createCategory: (data: { name: string; description?: string }) => request<Category>('/categories', { method: 'POST', body: JSON.stringify(data) }),
  deleteCategory: (id: string) => request(`/categories/${id}`, { method: 'DELETE' }),

  // Suppliers
  getSuppliers: () => request<Supplier[]>('/suppliers'),
  createSupplier: (data: Partial<Supplier>) => request<Supplier>('/suppliers', { method: 'POST', body: JSON.stringify(data) }),
  updateSupplier: (id: string, data: Partial<Supplier>) => request<Supplier>(`/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSupplier: (id: string) => request(`/suppliers/${id}`, { method: 'DELETE' }),

  // Inventory
  getInventorySummary: () => request<any[]>('/inventory'),
  getStockHistory: (params?: { productId?: string; type?: string; from?: string; to?: string }) => {
    const qp = new URLSearchParams();
    if (params?.productId) qp.set('productId', params.productId);
    if (params?.type) qp.set('type', params.type);
    if (params?.from) qp.set('from', params.from);
    if (params?.to) qp.set('to', params.to);
    return request<StockMovement[]>(`/inventory/history?${qp.toString()}`);
  },
  stockIn: (data: { productId: string; quantity: number; reason?: string; reference?: string }) =>
    request('/inventory/stock-in', { method: 'POST', body: JSON.stringify(data) }),
  stockAdjustment: (data: { productId: string; quantity: number; isAddition: boolean; reason?: string; reference?: string }) =>
    request('/inventory/stock-adjustment', { method: 'POST', body: JSON.stringify(data) }),
  damagedStock: (data: { productId: string; quantity: number; reason?: string; reference?: string }) =>
    request('/inventory/damaged', { method: 'POST', body: JSON.stringify(data) }),
  expiredStock: (data: { productId: string; quantity: number; reason?: string; reference?: string }) =>
    request('/inventory/expired', { method: 'POST', body: JSON.stringify(data) }),

  // Sales & POS
  createSale: (data: {
    customerId?: string;
    items: Array<{ productId: string; quantity: number; discount: number }>;
    discountAmount?: number;
    orderDiscount?: number;
    taxAmount?: number;
    taxRate?: number;
    paymentMethod: PaymentMethod;
    amountPaid: number;
    notes?: string;
  }) => request<{ sale: Sale; items: any[] }>('/sales', { method: 'POST', body: JSON.stringify(data) }),

  processSale: (data: {
    customerId?: string;
    items: Array<{ productId: string; quantity: number; discount: number }>;
    discountAmount?: number;
    orderDiscount?: number;
    taxAmount?: number;
    taxRate?: number;
    paymentMethod: PaymentMethod;
    amountPaid: number;
    notes?: string;
  }) => request<{ sale: Sale; items: any[] }>('/sales', { method: 'POST', body: JSON.stringify(data) }),

  getSales: (params?: { cashierId?: string; from?: string; to?: string; invoiceNumber?: string; search?: string }) => {
    const qp = new URLSearchParams();
    if (params?.cashierId) qp.set('cashierId', params.cashierId);
    if (params?.from) qp.set('from', params.from);
    if (params?.to) qp.set('to', params.to);
    if (params?.invoiceNumber) qp.set('invoiceNumber', params.invoiceNumber);
    if (params?.search) qp.set('search', params.search);
    return request<Sale[]>(`/sales?${qp.toString()}`);
  },

  getSaleByInvoice: (invoiceNumber: string) => request<{ sale: Sale; items: any[] }>(`/sales/invoice/${invoiceNumber}`),
  deleteSale: (id: string) => request(`/sales/${id}`, { method: 'DELETE' }),

  // Customers
  getCustomers: (search?: string) => request<Customer[]>(`/customers${search ? '?search=' + encodeURIComponent(search) : ''}`),
  createCustomer: (data: Partial<Customer>) => request<Customer>('/customers', { method: 'POST', body: JSON.stringify(data) }),
  getCustomerHistory: (id: string) => request<{ customer: Customer; sales: Sale[] }>(`/customers/${id}/history`),
  deleteCustomer: (id: string) => request(`/customers/${id}`, { method: 'DELETE' }),

  // Cashiers (Manager)
  getCashiers: () => request<User[]>('/cashiers'),
  createCashier: (data: { fullName: string; username: string; password: string; phone?: string; address?: string }) =>
    request<User>('/cashiers', { method: 'POST', body: JSON.stringify(data) }),
  updateCashier: (id: string, data: Partial<User>) => request<User>(`/cashiers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  toggleCashierStatus: (id: string) => request<{ message: string; isActive: boolean }>(`/cashiers/${id}/toggle-status`, { method: 'PATCH' }),
  resetCashierPassword: (id: string, newPassword: string) => request(`/cashiers/${id}/reset-password`, { method: 'POST', body: JSON.stringify({ newPassword }) }),
  getCashierActivities: (id: string) => request<CashierActivity[]>(`/cashiers/${id}/activities`),
  deleteCashier: (id: string) => request(`/cashiers/${id}`, { method: 'DELETE' }),

  // Reports
  getSalesReport: (from?: string, to?: string, cashierId?: string) => {
    const qp = new URLSearchParams();
    if (from) qp.set('from', from);
    if (to) qp.set('to', to);
    if (cashierId) qp.set('cashierId', cashierId);
    return request<any>(`/reports/sales?${qp.toString()}`);
  },
  getProfitReport: () => request<{ totalRevenue: number; totalCostOfGoods: number; totalDiscounts: number; grossProfit: number; marginPercentage: number }>('/reports/profit'),
  getInventoryValuationReport: () => request<{ totalWholesaleValue: number; totalRetailValue: number; potentialProfit: number }>('/reports/profit'),
  getCashierPerformanceReport: (from?: string, to?: string) => {
    const qp = new URLSearchParams();
    if (from) qp.set('from', from);
    if (to) qp.set('to', to);
    return request<any[]>(`/reports/cashier?${qp.toString()}`);
  },

  // Audit Logs
  getAuditLogs: () => request<AuditLog[]>('/audit/logs'),
  getActivities: (userId?: string) => request<CashierActivity[]>(`/audit/activities${userId ? '?userId=' + userId : ''}`),
  resetSystemData: () => request<{ message: string }>('/audit/reset-system', { method: 'POST' })
};
