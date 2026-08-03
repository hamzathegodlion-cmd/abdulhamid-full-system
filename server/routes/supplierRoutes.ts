import { Router, Response } from 'express';
import { db } from '../db';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware';
import { Supplier, UserRole } from '../types';

const router = Router();

// GET /api/suppliers
router.get('/', authenticateToken, (_req: AuthenticatedRequest, res: Response) => {
  return res.json(db.getSuppliers());
});

// POST /api/suppliers
router.post('/', authenticateToken, requireRole(UserRole.MANAGER), (req: AuthenticatedRequest, res: Response) => {
  const { name, contactPerson, phone, email, address, isActive } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ error: 'Supplier name and phone are required' });
  }

  const supplier: Supplier = {
    id: `sup-${Date.now()}`,
    name,
    contactPerson: contactPerson || '',
    phone,
    email: email || '',
    address: address || '',
    isActive: isActive !== undefined ? Boolean(isActive) : true,
    createdAt: new Date().toISOString()
  };

  const created = db.createSupplier(supplier);
  return res.status(201).json(created);
});

// PUT /api/suppliers/:id
router.put('/:id', authenticateToken, requireRole(UserRole.MANAGER), (req: AuthenticatedRequest, res: Response) => {
  const updated = db.updateSupplier(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Supplier not found' });
  return res.json(updated);
});

// DELETE /api/suppliers/:id
router.delete('/:id', authenticateToken, requireRole(UserRole.MANAGER), (req: AuthenticatedRequest, res: Response) => {
  const success = db.deleteSupplier(req.params.id);
  if (!success) return res.status(404).json({ error: 'Supplier not found' });
  return res.json({ message: 'Supplier deleted successfully' });
});

export default router;
