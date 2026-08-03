export enum UserRole {
  MANAGER = 'Manager',
  CASHIER = 'Cashier'
}

export enum StockMovementType {
  STOCK_IN = 'StockIn',
  STOCK_OUT = 'StockOut',
  ADJUSTMENT = 'Adjustment',
  DAMAGED = 'Damaged',
  EXPIRED = 'Expired'
}

export enum PaymentMethod {
  CASH = 'Cash',
  CARD = 'Card',
  MOBILE_MONEY = 'MobileMoney',
  OTHER = 'Other'
}

export enum SaleStatus {
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled',
  HOLD = 'Hold'
}

export interface User {
  id: string;
  fullName: string;
  username: string;
  role: UserRole;
  phone?: string;
  address?: string;
  isActive?: boolean;
  lastLoginAt?: string;
  createdAt?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface Unit {
  id: string;
  name: string;
  abbreviation: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  phone: string;
  email?: string;
  address?: string;
  isActive: boolean;
}

export interface Product {
  id: string;
  name: string;
  barcode: string;
  sku: string;
  categoryId: string;
  supplierId?: string;
  buyingPrice: number;
  sellingPrice: number;
  currentStock: number;
  minStock: number;
  maxStock?: number;
  unitId: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  discount: number; // line discount
}

export interface StockMovement {
  id: string;
  productId: string;
  type: StockMovementType;
  quantityChange: number;
  quantityAbsolute: number;
  reason?: string;
  reference?: string;
  createdByUserId: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  totalSpent?: number;
  totalPurchasesCount?: number;
  totalAmountSpent?: number;
  createdAt?: string;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  cashierId: string;
  cashierName?: string;
  customerId?: string;
  customerName?: string;
  subTotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  change: number;
  status: SaleStatus;
  notes?: string;
  createdAt: string;
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  productName: string;
  unitName: string;
  quantity: number;
  buyingPriceSnapshot: number;
  sellingPrice: number;
  discount: number;
  total: number;
}

export interface CashierActivity {
  id: string;
  userId: string;
  userName?: string;
  action: string;
  details?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  userName?: string;
  performedByName?: string;
  action: string;
  entity: string;
  entityName?: string;
  entityId: string;
  details?: string;
  oldValues?: string;
  newValues?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface DashboardSummary {
  totalRevenue: number;
  todayRevenue: number;
  todaySalesCount: number;
  totalTransactions: number;
  netProfit: number;
  activeCashiersCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalProductsCount: number;
}

export interface RevenueTrendPoint {
  date: string;
  revenue: number;
  profit: number;
  transactions: number;
}

export interface TopProduct {
  id: string;
  name: string;
  quantity: number;
  revenue: number;
}
