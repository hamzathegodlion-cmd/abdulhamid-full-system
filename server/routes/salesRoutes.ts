import { Router, Response } from 'express';
import { db } from '../db';
import { authenticateToken, AuthenticatedRequest } from '../middleware';
import { PaymentMethod, SaleStatus, UserRole } from '../types';

const router = Router();

function generateInvoiceNumber(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `INV-${yyyy}${mm}${dd}-${hh}${mi}${ss}-${rand}`;
}

// POST /api/sales
router.post('/', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { customerId, items, discountAmount, taxAmount, paymentMethod, amountPaid, notes } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'At least one sale item is required' });
    }

    if (!paymentMethod || !Object.values(PaymentMethod).includes(paymentMethod)) {
      return res.status(400).json({ error: 'Valid payment method is required (Cash, Card, MobileMoney, Other)' });
    }

    // Calculate subtotal
    let subTotal = 0;
    const itemsData = items.map((i: any) => {
      const prod = db.getProductById(i.productId);
      if (!prod) throw new Error(`Product not found: ${i.productId}`);
      const qty = Number(i.quantity) || 1;
      const discount = Number(i.discount) || 0;
      const lineTotal = Math.max(0, (prod.sellingPrice * qty) - discount);
      subTotal += lineTotal;
      return {
        productId: prod.id,
        quantity: qty,
        discount
      };
    });

    const discountVal = Number(discountAmount) || 0;
    const taxVal = Number(taxAmount) || 0;
    const totalAmount = Math.max(0, subTotal - discountVal + taxVal);
    const paidVal = Number(amountPaid) || totalAmount;
    const changeVal = Math.max(0, paidVal - totalAmount);

    let customerName = 'Walk-in Customer';
    if (customerId) {
      const cust = db.getCustomerById(customerId);
      if (cust) customerName = cust.name;
    }

    const cashier = db.getUserById(req.user!.userId);
    const cashierName = cashier ? cashier.fullName : req.user!.username;

    const invoiceNumber = generateInvoiceNumber();

    const { sale, items: createdItems } = db.createSaleTransaction(
      {
        invoiceNumber,
        cashierId: req.user!.userId,
        cashierName,
        customerId: customerId || undefined,
        customerName,
        subTotal: Number(subTotal.toFixed(2)),
        discountAmount: Number(discountVal.toFixed(2)),
        taxAmount: Number(taxVal.toFixed(2)),
        totalAmount: Number(totalAmount.toFixed(2)),
        paymentMethod,
        amountPaid: Number(paidVal.toFixed(2)),
        change: Number(changeVal.toFixed(2)),
        status: SaleStatus.COMPLETED,
        notes: notes || ''
      },
      itemsData
    );

    return res.status(201).json({ sale, items: createdItems });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to complete sale' });
  }
});

// GET /api/sales
router.get('/', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  let sales = db.getSales();
  const { cashierId, from, to, invoiceNumber, search } = req.query;

  // Cashier restriction: non-managers can only query their own sales unless explicitly allowed
  if (req.user?.role === UserRole.CASHIER) {
    sales = sales.filter(s => s.cashierId === req.user?.userId);
  } else if (cashierId) {
    sales = sales.filter(s => s.cashierId === cashierId);
  }

  if (invoiceNumber) {
    sales = sales.filter(s => s.invoiceNumber.toLowerCase().includes((invoiceNumber as string).toLowerCase()));
  }

  if (search) {
    const q = (search as string).toLowerCase();
    sales = sales.filter(s =>
      s.invoiceNumber.toLowerCase().includes(q) ||
      (s.customerName && s.customerName.toLowerCase().includes(q)) ||
      (s.cashierName && s.cashierName.toLowerCase().includes(q))
    );
  }

  if (from) {
    const fromTime = new Date(from as string).getTime();
    sales = sales.filter(s => new Date(s.createdAt).getTime() >= fromTime);
  }

  if (to) {
    const toTime = new Date(to as string).getTime();
    sales = sales.filter(s => new Date(s.createdAt).getTime() <= toTime);
  }

  return res.json(sales);
});

// GET /api/sales/invoice/:invoiceNumber
router.get('/invoice/:invoiceNumber', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const result = db.getSaleByInvoiceNumber(req.params.invoiceNumber);
  if (!result) return res.status(404).json({ error: 'Invoice not found' });
  return res.json(result);
});

// GET /api/sales/:id
router.get('/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const result = db.getSaleById(req.params.id);
  if (!result) return res.status(404).json({ error: 'Sale record not found' });
  return res.json(result);
});

// DELETE /api/sales/:id
router.delete('/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const success = db.deleteSale(req.params.id);
  if (!success) return res.status(404).json({ error: 'Sale record not found' });

  db.addAuditLog({
    userId: req.user?.userId,
    userName: req.user?.fullName,
    action: 'VoidDeleteSale',
    entity: 'Sale',
    entityId: req.params.id,
    ipAddress: req.ip
  });

  return res.json({ message: 'Sale record deleted successfully' });
});

export default router;
