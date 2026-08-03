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

export interface BaseEntity {
  id: string;
  createdAt: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
  isDeleted?: boolean;
}

export interface User extends BaseEntity {
  fullName: string;
  username: string;
  passwordHash: string;
  phone?: string;
  address?: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt?: string;
}

export interface RefreshToken {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
  createdAt: string;
  revokedAt?: string;
  revokedByIp?: string;
  replacedByToken?: string;
}

export interface Category extends BaseEntity {
  name: string;
  description?: string;
  isActive: boolean;
}

export interface Unit extends BaseEntity {
  name: string; // e.g., pcs, kg, box, litre
  abbreviation: string;
}

export interface Supplier extends BaseEntity {
  name: string;
  contactPerson?: string;
  phone: string;
  email?: string;
  address?: string;
  isActive: boolean;
}

export interface Product extends BaseEntity {
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

export interface StockMovement extends BaseEntity {
  productId: string;
  type: StockMovementType;
  quantityChange: number; // positive or negative
  quantityAbsolute: number;
  reason?: string;
  reference?: string; // SaleId or InvoiceNo
  createdByUserId: string;
}

export interface Customer extends BaseEntity {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  totalSpent: number;
}

export interface Sale extends BaseEntity {
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
  action: string; // Login, Logout, SaleCreated, PasswordReset
  details?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  userName?: string;
  action: string;
  entity: string;
  entityId: string;
  oldValues?: string;
  newValues?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface JWTPayload {
  userId: string;
  username: string;
  fullName: string;
  role: UserRole;
}
