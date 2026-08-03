import { Router, Response } from 'express';
import { db } from '../db';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware';
import { hashPassword } from '../auth';
import { User, UserRole } from '../types';

const router = Router();

// GET /api/cashiers (Manager only)
router.get('/', authenticateToken, requireRole(UserRole.MANAGER), (_req: AuthenticatedRequest, res: Response) => {
  const users = db.getUsers().filter(u => u.role === UserRole.CASHIER);
  const result = users.map(u => ({
    id: u.id,
    fullName: u.fullName,
    username: u.username,
    phone: u.phone,
    address: u.address,
    isActive: u.isActive,
    lastLoginAt: u.lastLoginAt,
    createdAt: u.createdAt
  }));
  return res.json(result);
});

// POST /api/cashiers (Manager creates cashier account)
router.post('/', authenticateToken, requireRole(UserRole.MANAGER), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { fullName, username, password, phone, address } = req.body;

    if (!fullName || !username || !password) {
      return res.status(400).json({ error: 'Full name, username, and password are required' });
    }

    if (db.getUserByUsername(username)) {
      return res.status(400).json({ error: `Username "${username}" is already taken` });
    }

    const passwordHash = await hashPassword(password);
    const isoNow = new Date().toISOString();

    const newCashier: User = {
      id: `usr-cashier-${Date.now()}`,
      fullName,
      username: username.toLowerCase().trim(),
      passwordHash,
      phone: phone || '',
      address: address || '',
      role: UserRole.CASHIER,
      isActive: true,
      createdAt: isoNow,
      createdBy: req.user?.userId
    };

    const created = db.createUser(newCashier);

    db.addAuditLog({
      userId: req.user?.userId,
      userName: req.user?.fullName,
      action: 'CreateCashierAccount',
      entity: 'User',
      entityId: created.id,
      newValues: JSON.stringify({ username: created.username, fullName: created.fullName }),
      ipAddress: req.ip
    });

    return res.status(201).json({
      id: created.id,
      fullName: created.fullName,
      username: created.username,
      phone: created.phone,
      address: created.address,
      isActive: created.isActive,
      createdAt: created.createdAt
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// PUT /api/cashiers/:id
router.put('/:id', authenticateToken, requireRole(UserRole.MANAGER), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const existing = db.getUserById(id);
  if (!existing || existing.role !== UserRole.CASHIER) {
    return res.status(404).json({ error: 'Cashier not found' });
  }

  const { fullName, phone, address } = req.body;
  const updated = db.updateUser(id, {
    fullName: fullName || existing.fullName,
    phone: phone !== undefined ? phone : existing.phone,
    address: address !== undefined ? address : existing.address,
    updatedBy: req.user?.userId
  });

  return res.json(updated);
});

// PATCH /api/cashiers/:id/toggle-status
router.patch('/:id/toggle-status', authenticateToken, requireRole(UserRole.MANAGER), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const existing = db.getUserById(id);
  if (!existing || existing.role !== UserRole.CASHIER) {
    return res.status(404).json({ error: 'Cashier not found' });
  }

  const updated = db.updateUser(id, { isActive: !existing.isActive });

  db.addAuditLog({
    userId: req.user?.userId,
    userName: req.user?.fullName,
    action: 'ToggleCashierStatus',
    entity: 'User',
    entityId: id,
    newValues: JSON.stringify({ isActive: updated?.isActive }),
    ipAddress: req.ip
  });

  return res.json({ message: `Cashier ${updated?.isActive ? 'activated' : 'deactivated'}`, isActive: updated?.isActive });
});

// POST /api/cashiers/:id/reset-password
router.post('/:id/reset-password', authenticateToken, requireRole(UserRole.MANAGER), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    const existing = db.getUserById(id);
    if (!existing || existing.role !== UserRole.CASHIER) {
      return res.status(404).json({ error: 'Cashier not found' });
    }

    const newHash = await hashPassword(newPassword);
    db.updateUser(id, { passwordHash: newHash });

    db.addAuditLog({
      userId: req.user?.userId,
      userName: req.user?.fullName,
      action: 'ResetCashierPassword',
      entity: 'User',
      entityId: id,
      ipAddress: req.ip
    });

    return res.json({ message: `Password for ${existing.fullName} updated successfully` });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/cashiers/:id/activities
router.get('/:id/activities', authenticateToken, requireRole(UserRole.MANAGER), (req: AuthenticatedRequest, res: Response) => {
  const activities = db.getCashierActivities(req.params.id);
  return res.json(activities);
});

// DELETE /api/cashiers/:id
router.delete('/:id', authenticateToken, requireRole(UserRole.MANAGER), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const existing = db.getUserById(id);
  if (!existing || existing.role !== UserRole.CASHIER) {
    return res.status(404).json({ error: 'Cashier not found' });
  }

  db.deleteUser(id);

  db.addAuditLog({
    userId: req.user?.userId,
    userName: req.user?.fullName,
    action: 'DeleteCashier',
    entity: 'User',
    entityId: id,
    oldValues: JSON.stringify({ username: existing.username, fullName: existing.fullName }),
    ipAddress: req.ip
  });

  return res.json({ message: 'Cashier account deleted successfully' });
});

export default router;
