import { Router, Response } from 'express';
import { db } from '../db';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware';
import { UserRole } from '../types';

const router = Router();

// GET /api/reports/sales
router.get('/sales', authenticateToken, requireRole(UserRole.MANAGER), (req: AuthenticatedRequest, res: Response) => {
  const { from, to, cashierId } = req.query;
  let sales = db.getSales();

  if (cashierId) sales = sales.filter(s => s.cashierId === cashierId);
  if (from) {
    const f = new Date(from as string).getTime();
    sales = sales.filter(s => new Date(s.createdAt).getTime() >= f);
  }
  if (to) {
    const t = new Date(to as string).getTime();
    sales = sales.filter(s => new Date(s.createdAt).getTime() <= t);
  }

  const reportItems = sales.map(s => {
    const { items } = db.getSaleById(s.id) || { items: [] };
    let totalCost = 0;
    items.forEach(it => totalCost += (it.buyingPriceSnapshot * it.quantity));
    const profit = s.totalAmount - totalCost;

    return {
      invoiceNumber: s.invoiceNumber,
      date: s.createdAt,
      cashierName: s.cashierName,
      customerName: s.customerName,
      subTotal: s.subTotal,
      discount: s.discountAmount,
      tax: s.taxAmount,
      totalAmount: s.totalAmount,
      costOfGoods: Number(totalCost.toFixed(2)),
      profit: Number(profit.toFixed(2)),
      paymentMethod: s.paymentMethod
    };
  });

  return res.json(reportItems);
});

// GET /api/reports/profit
router.get('/profit', authenticateToken, requireRole(UserRole.MANAGER), (_req: AuthenticatedRequest, res: Response) => {
  const sales = db.getSales();
  let totalRevenue = 0;
  let totalCost = 0;
  let totalDiscounts = 0;

  sales.forEach(s => {
    totalRevenue += s.totalAmount;
    totalDiscounts += s.discountAmount;
    const { items } = db.getSaleById(s.id) || { items: [] };
    items.forEach(it => {
      totalCost += (it.buyingPriceSnapshot * it.quantity);
    });
  });

  const grossProfit = totalRevenue - totalCost;
  const marginPercentage = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  return res.json({
    totalRevenue: Number(totalRevenue.toFixed(2)),
    totalCostOfGoods: Number(totalCost.toFixed(2)),
    totalDiscounts: Number(totalDiscounts.toFixed(2)),
    grossProfit: Number(grossProfit.toFixed(2)),
    marginPercentage: Number(marginPercentage.toFixed(1))
  });
});

// GET /api/reports/cashier
router.get('/cashier', authenticateToken, requireRole(UserRole.MANAGER), (_req: AuthenticatedRequest, res: Response) => {
  const cashiers = db.getUsers().filter(u => u.role === UserRole.CASHIER);
  const sales = db.getSales();

  const report = cashiers.map(c => {
    const cashierSales = sales.filter(s => s.cashierId === c.id);
    const totalRev = cashierSales.reduce((acc, s) => acc + s.totalAmount, 0);
    const totalTransactions = cashierSales.length;
    const avgTicket = totalTransactions > 0 ? totalRev / totalTransactions : 0;

    return {
      cashierId: c.id,
      cashierName: c.fullName,
      username: c.username,
      totalTransactions,
      totalRevenue: Number(totalRev.toFixed(2)),
      averageTicketSize: Number(avgTicket.toFixed(2)),
      lastLoginAt: c.lastLoginAt
    };
  });

  return res.json(report);
});

export default router;
