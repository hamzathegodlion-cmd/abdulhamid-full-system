import { Router, Response } from 'express';
import { db } from '../db';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware';
import { Category, UserRole } from '../types';

const router = Router();

// GET /api/categories
router.get('/', authenticateToken, (_req: AuthenticatedRequest, res: Response) => {
  return res.json(db.getCategories());
});

// GET /api/units
router.get('/units', authenticateToken, (_req: AuthenticatedRequest, res: Response) => {
  return res.json(db.getUnits());
});

// POST /api/categories
router.post('/', authenticateToken, requireRole(UserRole.MANAGER), (req: AuthenticatedRequest, res: Response) => {
  const { name, description, isActive } = req.body;
  if (!name) return res.status(400).json({ error: 'Category name is required' });

  const category: Category = {
    id: `cat-${Date.now()}`,
    name,
    description: description || '',
    isActive: isActive !== undefined ? Boolean(isActive) : true,
    createdAt: new Date().toISOString()
  };

  const created = db.createCategory(category);
  return res.status(201).json(created);
});

// PUT /api/categories/:id
router.put('/:id', authenticateToken, requireRole(UserRole.MANAGER), (req: AuthenticatedRequest, res: Response) => {
  const updated = db.updateCategory(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Category not found' });
  return res.json(updated);
});

// DELETE /api/categories/:id
router.delete('/:id', authenticateToken, requireRole(UserRole.MANAGER), (req: AuthenticatedRequest, res: Response) => {
  const success = db.deleteCategory(req.params.id);
  if (!success) return res.status(404).json({ error: 'Category not found' });
  return res.json({ message: 'Category deleted successfully' });
});

export default router;
