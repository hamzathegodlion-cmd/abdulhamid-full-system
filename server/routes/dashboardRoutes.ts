import { Router, Response } from 'express';
import { db } from '../db';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware';
import { UserRole } from '../types';

const router = Router();

// GET /api/dashboard/summary (Manager)
router.get('/summary', authenticateToken, requireRole(UserRole.MANAGER), (_req: AuthenticatedRequest, res: Response) => {
  const sales = db.getSales();
  const products = db.getProducts();
  const cashiers = db.getUsers().filter(u => u.role === UserRole.CASHIER && u.isActive);

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  let totalRevenue = 0;
  let todayRevenue = 0;
  let todaySalesCount = 0;

  sales.forEach(s => {
    totalRevenue += s.totalAmount;
    const saleTime = new Date(s.createdAt).getTime();
    if (saleTime >= startOfToday) {
      todayRevenue += s.totalAmount;
      todaySalesCount++;
    }
  });

  // Calculate Net Profit across all sale items
  let totalCost = 0;
  sales.forEach(s => {
    const { items } = db.getSaleById(s.id) || { items: [] };
    items.forEach(item => {
      totalCost += (item.buyingPriceSnapshot * item.quantity);
    });
  });

  const netProfit = totalRevenue - totalCost;

  const lowStockCount = products.filter(p => p.currentStock <= p.minStock && p.currentStock > 0).length;
  const outOfStockCount = products.filter(p => p.currentStock <= 0).length;

  return res.json({
    totalRevenue: Number(totalRevenue.toFixed(2)),
    todayRevenue: Number(todayRevenue.toFixed(2)),
    todaySalesCount,
    totalTransactions: sales.length,
    netProfit: Number(netProfit.toFixed(2)),
    activeCashiersCount: cashiers.length,
    lowStockCount,
    outOfStockCount,
    totalProductsCount: products.length
  });
});

// GET /api/dashboard/revenue-trend
router.get('/revenue-trend', authenticateToken, requireRole(UserRole.MANAGER), (_req: AuthenticatedRequest, res: Response) => {
  const sales = db.getSales();
  // Group sales by date for last 14 days
  const dailyMap: { [date: string]: { revenue: number; transactions: number; profit: number } } = {};

  const now = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    dailyMap[dateStr] = { revenue: 0, transactions: 0, profit: 0 };
  }

  sales.forEach(s => {
    const dateStr = s.createdAt.split('T')[0];
    if (dailyMap[dateStr]) {
      dailyMap[dateStr].revenue += s.totalAmount;
      dailyMap[dateStr].transactions += 1;

      const { items } = db.getSaleById(s.id) || { items: [] };
      let cost = 0;
      items.forEach(it => cost += (it.buyingPriceSnapshot * it.quantity));
      dailyMap[dateStr].profit += (s.totalAmount - cost);
    }
  });

  const result = Object.keys(dailyMap).map(date => ({
    date,
    revenue: Number(dailyMap[date].revenue.toFixed(2)),
    profit: Number(dailyMap[date].profit.toFixed(2)),
    transactions: dailyMap[date].transactions
  }));

  return res.json(result);
});

// GET /api/dashboard/top-selling
router.get('/top-selling', authenticateToken, requireRole(UserRole.MANAGER), (_req: AuthenticatedRequest, res: Response) => {
  const sales = db.getSales();
  const productMap: { [id: string]: { id: string; name: string; quantity: number; revenue: number } } = {};

  sales.forEach(s => {
    const { items } = db.getSaleById(s.id) || { items: [] };
    items.forEach(it => {
      if (!productMap[it.productId]) {
        productMap[it.productId] = {
          id: it.productId,
          name: it.productName,
          quantity: 0,
          revenue: 0
        };
      }
      productMap[it.productId].quantity += it.quantity;
      productMap[it.productId].revenue += it.total;
    });
  });

  const list = Object.values(productMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  return res.json(list);
});

// GET /api/dashboard/inventory-status
router.get('/inventory-status', authenticateToken, requireRole(UserRole.MANAGER), (_req: AuthenticatedRequest, res: Response) => {
  const products = db.getProducts();
  let inStock = 0;
  let lowStock = 0;
  let outOfStock = 0;

  products.forEach(p => {
    if (p.currentStock <= 0) outOfStock++;
    else if (p.currentStock <= p.minStock) lowStock++;
    else inStock++;
  });

  return res.json([
    { name: 'Healthy Stock', value: inStock, color: '#10B981' },
    { name: 'Low Stock Alert', value: lowStock, color: '#F59E0B' },
    { name: 'Out of Stock', value: outOfStock, color: '#EF4444' }
  ]);
});

// GET /api/cashier/dashboard/summary
router.get('/cashier-summary', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const sales = db.getSales().filter(s => s.cashierId === userId);

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  let todayTotal = 0;
  let todayCount = 0;

  sales.forEach(s => {
    const t = new Date(s.createdAt).getTime();
    if (t >= startOfToday) {
      todayTotal += s.totalAmount;
      todayCount++;
    }
  });

  const avgOrder = todayCount > 0 ? todayTotal / todayCount : 0;

  return res.json({
    todayTotal: Number(todayTotal.toFixed(2)),
    todayCount,
    avgOrder: Number(avgOrder.toFixed(2)),
    allTimeSalesCount: sales.length
  });
});

export default router;
