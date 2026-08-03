import { Router, Response } from 'express';
import { db } from '../db';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware';
import { StockMovement, StockMovementType, UserRole } from '../types';

const router = Router();

// GET /api/inventory/history
router.get('/history', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { productId, type, from, to } = req.query;
  let movements = db.getStockMovements();

  if (productId) {
    movements = movements.filter(m => m.productId === productId);
  }

  if (type) {
    movements = movements.filter(m => m.type === type);
  }

  if (from) {
    const fromDate = new Date(from as string).getTime();
    movements = movements.filter(m => new Date(m.createdAt).getTime() >= fromDate);
  }

  if (to) {
    const toDate = new Date(to as string).getTime();
    movements = movements.filter(m => new Date(m.createdAt).getTime() <= toDate);
  }

  return res.json(movements);
});

// GET /api/inventory (current stock status summary)
router.get('/', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const products = db.getProducts();
  const summary = products.map(p => {
    let status = 'in_stock';
    if (p.currentStock <= 0) status = 'out_of_stock';
    else if (p.currentStock <= p.minStock) status = 'low_stock';

    return {
      id: p.id,
      name: p.name,
      barcode: p.barcode,
      sku: p.sku,
      currentStock: p.currentStock,
      minStock: p.minStock,
      maxStock: p.maxStock,
      status,
      unitId: p.unitId,
      buyingPrice: p.buyingPrice,
      sellingPrice: p.sellingPrice,
      totalValue: p.currentStock * p.buyingPrice
    };
  });

  return res.json(summary);
});

// Helper stock movement function
function handleStockChange(
  req: AuthenticatedRequest,
  res: Response,
  type: StockMovementType,
  quantityChange: number,
  quantityAbsolute: number,
  reason?: string,
  reference?: string
) {
  const { productId } = req.body;
  if (!productId) {
    return res.status(400).json({ error: 'Product ID is required' });
  }

  const product = db.getProductById(productId);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const isoNow = new Date().toISOString();
  const movement: StockMovement = {
    id: `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    productId,
    type,
    quantityChange,
    quantityAbsolute: Math.abs(quantityAbsolute),
    reason: reason || type,
    reference: reference || '',
    createdByUserId: req.user!.userId,
    createdAt: isoNow
  };

  const updatedProduct = db.recordStockMovement(movement);

  db.addAuditLog({
    userId: req.user?.userId,
    userName: req.user?.fullName,
    action: `StockMovement_${type}`,
    entity: 'Product',
    entityId: productId,
    newValues: JSON.stringify({ type, quantityChange, newStock: updatedProduct?.currentStock }),
    ipAddress: req.ip
  });

  return res.json({
    message: 'Stock updated successfully',
    product: updatedProduct,
    movement
  });
}

// POST /api/inventory/stock-in
router.post('/stock-in', authenticateToken, requireRole(UserRole.MANAGER), (req: AuthenticatedRequest, res: Response) => {
  const { quantity, reason, reference } = req.body;
  const qty = Number(quantity);
  if (isNaN(qty) || qty <= 0) {
    return res.status(400).json({ error: 'Quantity must be a positive number' });
  }
  return handleStockChange(req, res, StockMovementType.STOCK_IN, qty, qty, reason, reference);
});

// POST /api/inventory/stock-adjustment
router.post('/stock-adjustment', authenticateToken, requireRole(UserRole.MANAGER), (req: AuthenticatedRequest, res: Response) => {
  const { quantity, isAddition, reason, reference } = req.body;
  const qty = Number(quantity);
  if (isNaN(qty) || qty <= 0) {
    return res.status(400).json({ error: 'Quantity must be a positive number' });
  }
  const change = isAddition ? qty : -qty;
  return handleStockChange(req, res, StockMovementType.ADJUSTMENT, change, qty, reason, reference);
});

// POST /api/inventory/damaged
router.post('/damaged', authenticateToken, requireRole(UserRole.MANAGER), (req: AuthenticatedRequest, res: Response) => {
  const { quantity, reason, reference } = req.body;
  const qty = Number(quantity);
  if (isNaN(qty) || qty <= 0) {
    return res.status(400).json({ error: 'Quantity must be a positive number' });
  }
  return handleStockChange(req, res, StockMovementType.DAMAGED, -qty, qty, reason, reference);
});

// POST /api/inventory/expired
router.post('/expired', authenticateToken, requireRole(UserRole.MANAGER), (req: AuthenticatedRequest, res: Response) => {
  const { quantity, reason, reference } = req.body;
  const qty = Number(quantity);
  if (isNaN(qty) || qty <= 0) {
    return res.status(400).json({ error: 'Quantity must be a positive number' });
  }
  return handleStockChange(req, res, StockMovementType.EXPIRED, -qty, qty, reason, reference);
});

export default router;
