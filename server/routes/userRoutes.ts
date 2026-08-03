import { Router, Response } from 'express';
import { db } from '../db';
import { authenticateToken, AuthenticatedRequest } from '../middleware';

const router = Router();

// GET /api/users/profile (Get authenticated user's profile)
router.get('/profile', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const user = db.getUserById(req.user.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  return res.json({
    id: user.id,
    fullName: user.fullName,
    username: user.username,
    role: user.role,
    phone: user.phone || '',
    address: user.address || '',
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt
  });
});

// PUT /api/users/profile (Update authenticated user's profile)
router.put('/profile', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const userId = req.user.userId;
  const user = db.getUserById(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { fullName, username, phone, address } = req.body;

  if (username && username.toLowerCase().trim() !== user.username.toLowerCase()) {
    const existing = db.getUsers().find(
      u => u.username.toLowerCase() === username.toLowerCase().trim() && u.id !== userId
    );
    if (existing) {
      return res.status(400).json({ error: `Username "${username}" is already taken.` });
    }
  }

  const updated = db.updateUser(userId, {
    fullName: fullName !== undefined ? fullName.trim() : user.fullName,
    username: username !== undefined ? username.toLowerCase().trim() : user.username,
    phone: phone !== undefined ? phone.trim() : user.phone,
    address: address !== undefined ? address.trim() : user.address,
    updatedBy: userId
  });

  db.addAuditLog({
    userId,
    userName: updated?.fullName || user.fullName,
    action: 'UpdateProfile',
    entity: 'User',
    entityId: userId,
    newValues: JSON.stringify({ fullName: updated?.fullName, username: updated?.username, phone: updated?.phone, address: updated?.address }),
    ipAddress: req.ip
  });

  return res.json({
    id: updated!.id,
    fullName: updated!.fullName,
    username: updated!.username,
    role: updated!.role,
    phone: updated!.phone || '',
    address: updated!.address || '',
    isActive: updated!.isActive,
    lastLoginAt: updated!.lastLoginAt,
    createdAt: updated!.createdAt
  });
});

// PUT /api/users/:id (Secured endpoint: users can ONLY update their OWN profile data)
router.put('/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  // Security enforcement check: Ensure user is only updating their own data
  if (req.user.userId !== req.params.id) {
    return res.status(403).json({ error: 'Forbidden: You are only allowed to update your own user profile.' });
  }

  const userId = req.params.id;
  const user = db.getUserById(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { fullName, username, phone, address } = req.body;

  if (username && username.toLowerCase().trim() !== user.username.toLowerCase()) {
    const existing = db.getUsers().find(
      u => u.username.toLowerCase() === username.toLowerCase().trim() && u.id !== userId
    );
    if (existing) {
      return res.status(400).json({ error: `Username "${username}" is already taken.` });
    }
  }

  const updated = db.updateUser(userId, {
    fullName: fullName !== undefined ? fullName.trim() : user.fullName,
    username: username !== undefined ? username.toLowerCase().trim() : user.username,
    phone: phone !== undefined ? phone.trim() : user.phone,
    address: address !== undefined ? address.trim() : user.address,
    updatedBy: userId
  });

  db.addAuditLog({
    userId,
    userName: updated?.fullName || user.fullName,
    action: 'UpdateProfile',
    entity: 'User',
    entityId: userId,
    newValues: JSON.stringify({ fullName: updated?.fullName, username: updated?.username, phone: updated?.phone, address: updated?.address }),
    ipAddress: req.ip
  });

  return res.json({
    id: updated!.id,
    fullName: updated!.fullName,
    username: updated!.username,
    role: updated!.role,
    phone: updated!.phone || '',
    address: updated!.address || '',
    isActive: updated!.isActive,
    lastLoginAt: updated!.lastLoginAt,
    createdAt: updated!.createdAt
  });
});

export default router;
