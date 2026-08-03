import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  User, UserRole, Category, Unit, Supplier, Product, StockMovement,
  StockMovementType, Customer, Sale, SaleItem, CashierActivity, AuditLog, RefreshToken,
  PaymentMethod, SaleStatus
} from './types';

const DB_FILE = path.join(process.cwd(), '.smartpos_db.json');

interface DatabaseSchema {
  users: User[];
  refreshTokens: RefreshToken[];
  categories: Category[];
  units: Unit[];
  suppliers: Supplier[];
  products: Product[];
  stockMovements: StockMovement[];
  customers: Customer[];
  sales: Sale[];
  saleItems: SaleItem[];
  cashierActivities: CashierActivity[];
  auditLogs: AuditLog[];
}

class Database {
  private data: DatabaseSchema = {
    users: [],
    refreshTokens: [],
    categories: [],
    units: [],
    suppliers: [],
    products: [],
    stockMovements: [],
    customers: [],
    sales: [],
    saleItems: [],
    cashierActivities: [],
    auditLogs: []
  };

  constructor() {
    this.init();
  }

  private init() {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        // Ensure default accounts exist if missing
        this.ensureDefaults();
      } catch (err) {
        console.error('Failed to parse existing DB file, re-initializing', err);
        this.seed();
      }
    } else {
      this.seed();
    }
  }

  private save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write database file', err);
    }
  }

  private ensureDefaults() {
    const adminExists = this.data.users.some(u => u.username === 'admin' && !u.isDeleted);
    if (!adminExists) {
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync('Admin@123', salt);
      this.data.users.unshift({
        id: 'usr-admin-001',
        fullName: 'Store Manager',
        username: 'admin',
        passwordHash: hash,
        phone: '+1 555-0199',
        role: UserRole.MANAGER,
        isActive: true,
        createdAt: new Date().toISOString()
      });
      this.save();
    }
  }

  private seed() {
    const now = new Date();
    const isoNow = now.toISOString();
    const salt = bcrypt.genSaltSync(10);
    const adminHash = bcrypt.hashSync('Admin@123', salt);
    const cashierHash = bcrypt.hashSync('Cashier@123', salt);

    // 1. Users
    const adminUser: User = {
      id: 'usr-admin-001',
      fullName: 'Chief Manager',
      username: 'admin',
      passwordHash: adminHash,
      phone: '+1 555-0100',
      address: '100 Executive Blvd, Suite 400',
      role: UserRole.MANAGER,
      isActive: true,
      createdAt: isoNow
    };

    const cashierUser: User = {
      id: 'usr-cashier-001',
      fullName: 'Sarah Connor',
      username: 'cashier1',
      passwordHash: cashierHash,
      phone: '+1 555-0144',
      address: '42 Retail St, Apt 2B',
      role: UserRole.CASHIER,
      isActive: true,
      createdAt: isoNow
    };

    // 2. Units
    const units: Unit[] = [
      { id: 'unit-pcs', name: 'Pieces', abbreviation: 'pcs', createdAt: isoNow },
      { id: 'unit-kg', name: 'Kilograms', abbreviation: 'kg', createdAt: isoNow },
      { id: 'unit-box', name: 'Box', abbreviation: 'box', createdAt: isoNow },
      { id: 'unit-litre', name: 'Litre', abbreviation: 'L', createdAt: isoNow },
      { id: 'unit-pack', name: 'Packet', abbreviation: 'pack', createdAt: isoNow },
    ];

    // 3. Categories
    const categories: Category[] = [
      { id: 'cat-bev', name: 'Beverages', description: 'Soft drinks, cold brews, juices and water', isActive: true, createdAt: isoNow },
      { id: 'cat-snack', name: 'Snacks & Bakery', description: 'Chips, cookies, pastries, chocolates', isActive: true, createdAt: isoNow },
      { id: 'cat-elec', name: 'Electronics & Accessories', description: 'Gadgets, chargers, earphones, cables', isActive: true, createdAt: isoNow },
      { id: 'cat-groc', name: 'Groceries & Pantry', description: 'Staples, oils, spices, canned goods', isActive: true, createdAt: isoNow },
      { id: 'cat-care', name: 'Personal Care & Hygiene', description: 'Soaps, shampoos, oral care', isActive: true, createdAt: isoNow },
    ];

    // 4. Suppliers
    const suppliers: Supplier[] = [
      { id: 'sup-001', name: 'Global Beverage Wholesale Co.', contactPerson: 'Michael Chang', phone: '+1 800-555-0111', email: 'orders@globalbev.com', address: '12 Logistics Way, Chicago, IL', isActive: true, createdAt: isoNow },
      { id: 'sup-002', name: 'Fresh Farm Agri Suppliers', contactPerson: 'Elena Rostova', phone: '+1 800-555-0222', email: 'supply@freshfarm.org', address: '88 Harvest Lane, Fresno, CA', isActive: true, createdAt: isoNow },
      { id: 'sup-003', name: 'TechDirect Electronics Distribution', contactPerson: 'David Chen', phone: '+1 800-555-0333', email: 'sales@techdirect.io', address: '500 Innovation Park, San Jose, CA', isActive: true, createdAt: isoNow },
      { id: 'sup-004', name: 'Apex Goods & Commodities', contactPerson: 'Rachel Adams', phone: '+1 800-555-0444', email: 'contact@apexgoods.com', address: '210 Freight Rd, Dallas, TX', isActive: true, createdAt: isoNow }
    ];

    // 5. Products
    const products: Product[] = [
      {
        id: 'prod-001',
        name: 'Organic Espresso Beans 1kg',
        barcode: '890103982001',
        sku: 'BEV-COF-001',
        categoryId: 'cat-bev',
        supplierId: 'sup-001',
        buyingPrice: 12.50,
        sellingPrice: 24.99,
        currentStock: 45,
        minStock: 10,
        unitId: 'unit-kg',
        description: 'Single-origin Arabica dark roast whole coffee beans',
        imageUrl: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=400&q=80',
        isActive: true,
        createdAt: isoNow
      },
      {
        id: 'prod-002',
        name: 'Cold Pressed Orange Juice 1L',
        barcode: '890103982002',
        sku: 'BEV-JUC-002',
        categoryId: 'cat-bev',
        supplierId: 'sup-001',
        buyingPrice: 2.10,
        sellingPrice: 4.50,
        currentStock: 28,
        minStock: 15,
        unitId: 'unit-litre',
        description: '100% pure fresh squeezed orange juice, no added sugar',
        imageUrl: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=400&q=80',
        isActive: true,
        createdAt: isoNow
      },
      {
        id: 'prod-003',
        name: 'Artisanal Dark Chocolate Bar 85%',
        barcode: '890103982003',
        sku: 'SNK-CHO-003',
        categoryId: 'cat-snack',
        supplierId: 'sup-004',
        buyingPrice: 1.80,
        sellingPrice: 3.99,
        currentStock: 60,
        minStock: 20,
        unitId: 'unit-pcs',
        description: 'Rich Belgian cocoa bar with sea salt flakes',
        imageUrl: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=400&q=80',
        isActive: true,
        createdAt: isoNow
      },
      {
        id: 'prod-004',
        name: 'Wireless Ergonomic Bluetooth Mouse',
        barcode: '890103982004',
        sku: 'ELC-MOU-004',
        categoryId: 'cat-elec',
        supplierId: 'sup-003',
        buyingPrice: 14.00,
        sellingPrice: 29.99,
        currentStock: 12,
        minStock: 5,
        unitId: 'unit-pcs',
        description: 'Dual-mode silent click wireless mouse with rechargeable battery',
        imageUrl: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=400&q=80',
        isActive: true,
        createdAt: isoNow
      },
      {
        id: 'prod-005',
        name: 'USB-C Braided Fast Charge Cable 2m',
        barcode: '890103982005',
        sku: 'ELC-CBL-005',
        categoryId: 'cat-elec',
        supplierId: 'sup-003',
        buyingPrice: 3.50,
        sellingPrice: 11.99,
        currentStock: 4, // Low stock indicator test
        minStock: 10,
        unitId: 'unit-pcs',
        description: '100W PD nylon braided fast charging cable',
        imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80',
        isActive: true,
        createdAt: isoNow
      },
      {
        id: 'prod-006',
        name: 'Extra Virgin Italian Olive Oil 750ml',
        barcode: '890103982006',
        sku: 'GRO-OIL-006',
        categoryId: 'cat-groc',
        supplierId: 'sup-002',
        buyingPrice: 7.20,
        sellingPrice: 15.49,
        currentStock: 35,
        minStock: 8,
        unitId: 'unit-litre',
        description: 'First cold pressed extra virgin olive oil imported from Tuscany',
        imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=400&q=80',
        isActive: true,
        createdAt: isoNow
      },
      {
        id: 'prod-007',
        name: 'Organic Whole Grain Granola 500g',
        barcode: '890103982007',
        sku: 'SNK-GRA-007',
        categoryId: 'cat-snack',
        supplierId: 'sup-004',
        buyingPrice: 2.80,
        sellingPrice: 6.75,
        currentStock: 0, // Out of stock indicator test
        minStock: 12,
        unitId: 'unit-pack',
        description: 'Honey roasted granola with almonds, seeds, and dried cranberries',
        imageUrl: 'https://images.unsplash.com/photo-1517093728432-a0440f8d45af?auto=format&fit=crop&w=400&q=80',
        isActive: true,
        createdAt: isoNow
      },
      {
        id: 'prod-008',
        name: 'Gentle Hydrating Herbal Shampoo 400ml',
        barcode: '890103982008',
        sku: 'CAR-SHA-008',
        categoryId: 'cat-care',
        supplierId: 'sup-004',
        buyingPrice: 3.40,
        sellingPrice: 8.99,
        currentStock: 22,
        minStock: 8,
        unitId: 'unit-pcs',
        description: 'Sulfate-free botanical shampoo enriched with aloe vera and tea tree oil',
        imageUrl: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=400&q=80',
        isActive: true,
        createdAt: isoNow
      }
    ];

    // 6. Customers
    const customers: Customer[] = [
      { id: 'cust-001', name: 'Walk-in Customer', phone: '', email: '', totalSpent: 128.50, createdAt: isoNow },
      { id: 'cust-002', name: 'Jane Doe', phone: '+1 555-0988', email: 'jane.doe@example.com', address: '450 Oak Avenue', totalSpent: 342.10, createdAt: isoNow },
      { id: 'cust-003', name: 'John Smith', phone: '+1 555-0711', email: 'john.smith@example.com', address: '12 River Road', totalSpent: 89.95, createdAt: isoNow }
    ];

    // 7. Initial Sales and Items to seed realistic reporting
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();

    const sampleSales: Sale[] = [
      {
        id: 'sale-001',
        invoiceNumber: 'INV-20260801-1014-4821',
        cashierId: cashierUser.id,
        cashierName: cashierUser.fullName,
        customerId: customers[1].id,
        customerName: customers[1].name,
        subTotal: 54.98,
        discountAmount: 5.00,
        taxAmount: 0.00,
        totalAmount: 49.98,
        paymentMethod: PaymentMethod.CASH,
        amountPaid: 60.00,
        change: 10.02,
        status: SaleStatus.COMPLETED,
        notes: 'Regular customer discount applied',
        createdAt: twoDaysAgo
      },
      {
        id: 'sale-002',
        invoiceNumber: 'INV-20260802-1430-9102',
        cashierId: cashierUser.id,
        cashierName: cashierUser.fullName,
        customerId: customers[0].id,
        customerName: customers[0].name,
        subTotal: 41.98,
        discountAmount: 0.00,
        taxAmount: 0.00,
        totalAmount: 41.98,
        paymentMethod: PaymentMethod.CARD,
        amountPaid: 41.98,
        change: 0.00,
        status: SaleStatus.COMPLETED,
        notes: '',
        createdAt: yesterday
      },
      {
        id: 'sale-003',
        invoiceNumber: 'INV-20260802-1845-3319',
        cashierId: adminUser.id,
        cashierName: adminUser.fullName,
        customerId: customers[2].id,
        customerName: customers[2].name,
        subTotal: 89.95,
        discountAmount: 10.00,
        taxAmount: 0.00,
        totalAmount: 79.95,
        paymentMethod: PaymentMethod.MOBILE_MONEY,
        amountPaid: 79.95,
        change: 0.00,
        status: SaleStatus.COMPLETED,
        notes: 'Store promotion',
        createdAt: isoNow
      }
    ];

    const sampleSaleItems: SaleItem[] = [
      { id: 'item-001', saleId: 'sale-001', productId: 'prod-001', productName: products[0].name, unitName: 'kg', quantity: 1, buyingPriceSnapshot: 12.50, sellingPrice: 24.99, discount: 0, total: 24.99 },
      { id: 'item-002', saleId: 'sale-001', productId: 'prod-004', productName: products[3].name, unitName: 'pcs', quantity: 1, buyingPriceSnapshot: 14.00, sellingPrice: 29.99, discount: 5.00, total: 24.99 },
      { id: 'item-003', saleId: 'sale-002', productId: 'prod-002', productName: products[1].name, unitName: 'L', quantity: 2, buyingPriceSnapshot: 2.10, sellingPrice: 4.50, discount: 0, total: 9.00 },
      { id: 'item-004', saleId: 'sale-002', productId: 'prod-006', productName: products[5].name, unitName: 'L', quantity: 2, buyingPriceSnapshot: 7.20, sellingPrice: 15.49, discount: 0, total: 30.98 },
      { id: 'item-005', saleId: 'sale-003', productId: 'prod-001', productName: products[0].name, unitName: 'kg', quantity: 2, buyingPriceSnapshot: 12.50, sellingPrice: 24.99, discount: 5.00, total: 44.98 },
      { id: 'item-006', saleId: 'sale-003', productId: 'prod-005', productName: products[4].name, unitName: 'pcs', quantity: 3, buyingPriceSnapshot: 3.50, sellingPrice: 11.99, discount: 5.00, total: 30.97 }
    ];

    // 8. Stock Movements
    const sampleMovements: StockMovement[] = [
      { id: 'mov-001', productId: 'prod-001', type: StockMovementType.STOCK_IN, quantityChange: 50, quantityAbsolute: 50, reason: 'Initial inventory stock purchase', reference: 'PO-2026-001', createdByUserId: adminUser.id, createdAt: twoDaysAgo },
      { id: 'mov-002', productId: 'prod-001', type: StockMovementType.STOCK_OUT, quantityChange: -1, quantityAbsolute: 1, reason: 'Sale completed', reference: 'INV-20260801-1014-4821', createdByUserId: cashierUser.id, createdAt: twoDaysAgo },
      { id: 'mov-003', productId: 'prod-004', type: StockMovementType.STOCK_OUT, quantityChange: -1, quantityAbsolute: 1, reason: 'Sale completed', reference: 'INV-20260801-1014-4821', createdByUserId: cashierUser.id, createdAt: twoDaysAgo },
      { id: 'mov-004', productId: 'prod-007', type: StockMovementType.DAMAGED, quantityChange: -2, quantityAbsolute: 2, reason: 'Water leakage in store shelf', reference: 'ADJ-WATER-01', createdByUserId: adminUser.id, createdAt: yesterday }
    ];

    this.data = {
      users: [adminUser, cashierUser],
      refreshTokens: [],
      categories,
      units,
      suppliers,
      products,
      stockMovements: sampleMovements,
      customers,
      sales: sampleSales,
      saleItems: sampleSaleItems,
      cashierActivities: [
        { id: 'act-001', userId: cashierUser.id, userName: cashierUser.fullName, action: 'Login', details: 'Successful Cashier Login', ipAddress: '127.0.0.1', createdAt: yesterday },
        { id: 'act-002', userId: cashierUser.id, userName: cashierUser.fullName, action: 'SaleCreated', details: 'Completed Sale INV-20260802-1430-9102', ipAddress: '127.0.0.1', createdAt: yesterday }
      ],
      auditLogs: [
        { id: 'aud-001', userId: adminUser.id, userName: adminUser.fullName, action: 'SystemInitialized', entity: 'System', entityId: 'sys-1', newValues: JSON.stringify({ version: '1.0.0' }), ipAddress: '127.0.0.1', createdAt: isoNow }
      ]
    };

    this.save();
  }

  // --- GETTERS & QUERIES ---

  public getUsers(): User[] {
    return this.data.users.filter(u => !u.isDeleted);
  }

  public getUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id && !u.isDeleted);
  }

  public getUserByUsername(username: string): User | undefined {
    return this.data.users.find(u => u.username.toLowerCase() === username.toLowerCase() && !u.isDeleted);
  }

  public createUser(user: User): User {
    this.data.users.push(user);
    this.save();
    return user;
  }

  public updateUser(id: string, updates: Partial<User>): User | null {
    const idx = this.data.users.findIndex(u => u.id === id && !u.isDeleted);
    if (idx === -1) return null;
    this.data.users[idx] = { ...this.data.users[idx], ...updates, updatedAt: new Date().toISOString() };
    this.save();
    return this.data.users[idx];
  }

  // Categories
  public getCategories(): Category[] {
    return this.data.categories.filter(c => !c.isDeleted);
  }

  public createCategory(cat: Category): Category {
    this.data.categories.push(cat);
    this.save();
    return cat;
  }

  public updateCategory(id: string, updates: Partial<Category>): Category | null {
    const idx = this.data.categories.findIndex(c => c.id === id);
    if (idx === -1) return null;
    this.data.categories[idx] = { ...this.data.categories[idx], ...updates, updatedAt: new Date().toISOString() };
    this.save();
    return this.data.categories[idx];
  }

  public deleteCategory(id: string): boolean {
    const idx = this.data.categories.findIndex(c => c.id === id);
    if (idx === -1) return false;
    this.data.categories[idx].isDeleted = true;
    this.save();
    return true;
  }

  // Units
  public getUnits(): Unit[] {
    return this.data.units.filter(u => !u.isDeleted);
  }

  public createUnit(unit: Unit): Unit {
    this.data.units.push(unit);
    this.save();
    return unit;
  }

  // Suppliers
  public getSuppliers(): Supplier[] {
    return this.data.suppliers.filter(s => !s.isDeleted);
  }

  public createSupplier(sup: Supplier): Supplier {
    this.data.suppliers.push(sup);
    this.save();
    return sup;
  }

  public updateSupplier(id: string, updates: Partial<Supplier>): Supplier | null {
    const idx = this.data.suppliers.findIndex(s => s.id === id);
    if (idx === -1) return null;
    this.data.suppliers[idx] = { ...this.data.suppliers[idx], ...updates, updatedAt: new Date().toISOString() };
    this.save();
    return this.data.suppliers[idx];
  }

  public deleteSupplier(id: string): boolean {
    const idx = this.data.suppliers.findIndex(s => s.id === id);
    if (idx === -1) return false;
    this.data.suppliers[idx].isDeleted = true;
    this.save();
    return true;
  }

  // Products
  public getProducts(): Product[] {
    return this.data.products.filter(p => !p.isDeleted);
  }

  public getProductById(id: string): Product | undefined {
    return this.data.products.find(p => p.id === id && !p.isDeleted);
  }

  public getProductByBarcode(barcode: string): Product | undefined {
    return this.data.products.find(p => p.barcode === barcode && !p.isDeleted);
  }

  public getProductBySKU(sku: string): Product | undefined {
    return this.data.products.find(p => p.sku.toLowerCase() === sku.toLowerCase() && !p.isDeleted);
  }

  public createProduct(prod: Product): Product {
    this.data.products.push(prod);
    this.save();
    return prod;
  }

  public updateProduct(id: string, updates: Partial<Product>): Product | null {
    const idx = this.data.products.findIndex(p => p.id === id && !p.isDeleted);
    if (idx === -1) return null;
    this.data.products[idx] = { ...this.data.products[idx], ...updates, updatedAt: new Date().toISOString() };
    this.save();
    return this.data.products[idx];
  }

  public deleteProduct(id: string): boolean {
    const idx = this.data.products.findIndex(p => p.id === id);
    if (idx === -1) return false;
    this.data.products[idx].isDeleted = true;
    this.save();
    return true;
  }

  // Inventory & Stock Movements
  public getStockMovements(): StockMovement[] {
    return this.data.stockMovements;
  }

  public recordStockMovement(movement: StockMovement): Product | null {
    const prod = this.getProductById(movement.productId);
    if (!prod) return null;

    prod.currentStock = Math.max(0, prod.currentStock + movement.quantityChange);
    prod.updatedAt = new Date().toISOString();

    this.data.stockMovements.unshift(movement);
    this.save();
    return prod;
  }

  // Customers
  public getCustomers(): Customer[] {
    return this.data.customers.filter(c => !c.isDeleted);
  }

  public getCustomerById(id: string): Customer | undefined {
    return this.data.customers.find(c => c.id === id && !c.isDeleted);
  }

  public createCustomer(cust: Customer): Customer {
    this.data.customers.push(cust);
    this.save();
    return cust;
  }

  // Sales Engine with Transaction safety
  public getSales(): Sale[] {
    return this.data.sales.filter(s => !s.isDeleted);
  }

  public getSaleById(id: string): { sale: Sale; items: SaleItem[] } | null {
    const sale = this.data.sales.find(s => s.id === id && !s.isDeleted);
    if (!sale) return null;
    const items = this.data.saleItems.filter(i => i.saleId === sale.id);
    return { sale, items };
  }

  public getSaleByInvoiceNumber(invoiceNumber: string): { sale: Sale; items: SaleItem[] } | null {
    const sale = this.data.sales.find(s => s.invoiceNumber === invoiceNumber && !s.isDeleted);
    if (!sale) return null;
    const items = this.data.saleItems.filter(i => i.saleId === sale.id);
    return { sale, items };
  }

  public createSaleTransaction(
    saleData: Omit<Sale, 'id' | 'createdAt'>,
    itemsData: Array<{ productId: string; quantity: number; discount: number }>
  ): { sale: Sale; items: SaleItem[] } {
    // 1. Validate all items and stock
    for (const item of itemsData) {
      const prod = this.getProductById(item.productId);
      if (!prod) throw new Error(`Product not found: ${item.productId}`);
      if (prod.currentStock < item.quantity) {
        throw new Error(`Insufficient stock for product "${prod.name}". Available: ${prod.currentStock}, Requested: ${item.quantity}`);
      }
    }

    const isoNow = new Date().toISOString();
    const saleId = `sale-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const sale: Sale = {
      ...saleData,
      id: saleId,
      createdAt: isoNow
    };

    const createdItems: SaleItem[] = [];

    // 2. Process each item: update stock, create StockMovement, create SaleItem
    for (const item of itemsData) {
      const prod = this.getProductById(item.productId)!;
      const unit = this.data.units.find(u => u.id === prod.unitId);
      const unitName = unit ? unit.abbreviation : 'pcs';

      const itemTotal = Math.max(0, (prod.sellingPrice * item.quantity) - item.discount);

      const saleItem: SaleItem = {
        id: `sitem-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        saleId,
        productId: prod.id,
        productName: prod.name,
        unitName,
        quantity: item.quantity,
        buyingPriceSnapshot: prod.buyingPrice,
        sellingPrice: prod.sellingPrice,
        discount: item.discount,
        total: Number(itemTotal.toFixed(2))
      };

      createdItems.push(saleItem);

      // Decrement stock
      prod.currentStock = Math.max(0, prod.currentStock - item.quantity);
      prod.updatedAt = isoNow;

      // Record StockMovement (StockOut)
      this.data.stockMovements.unshift({
        id: `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        productId: prod.id,
        type: StockMovementType.STOCK_OUT,
        quantityChange: -item.quantity,
        quantityAbsolute: item.quantity,
        reason: 'Sale Completed',
        reference: sale.invoiceNumber,
        createdByUserId: sale.cashierId,
        createdAt: isoNow
      });
    }

    // Update customer total spent if applicable
    if (sale.customerId) {
      const cust = this.getCustomerById(sale.customerId);
      if (cust) {
        cust.totalSpent = Number((cust.totalSpent + sale.totalAmount).toFixed(2));
      }
    }

    this.data.sales.unshift(sale);
    this.data.saleItems.push(...createdItems);

    // Record Cashier Activity
    this.data.cashierActivities.unshift({
      id: `act-${Date.now()}`,
      userId: sale.cashierId,
      userName: sale.cashierName || 'Cashier',
      action: 'SaleCreated',
      details: `Sale ${sale.invoiceNumber} created with total $${sale.totalAmount.toFixed(2)}`,
      createdAt: isoNow
    });

    this.save();
    return { sale, items: createdItems };
  }

  // Audit Logs & Refresh Tokens
  public addAuditLog(log: Omit<AuditLog, 'id' | 'createdAt'>) {
    this.data.auditLogs.unshift({
      ...log,
      id: `aud-${Date.now()}`,
      createdAt: new Date().toISOString()
    });
    this.save();
  }

  public getAuditLogs(): AuditLog[] {
    return this.data.auditLogs;
  }

  public addCashierActivity(activity: Omit<CashierActivity, 'id' | 'createdAt'>) {
    this.data.cashierActivities.unshift({
      ...activity,
      id: `act-${Date.now()}`,
      createdAt: new Date().toISOString()
    });
    this.save();
  }

  public getCashierActivities(userId?: string): CashierActivity[] {
    if (userId) {
      return this.data.cashierActivities.filter(a => a.userId === userId);
    }
    return this.data.cashierActivities;
  }
}

export const db = new Database();
