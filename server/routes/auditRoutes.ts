import { Router, Response } from 'express';
import { db } from '../db';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware';
import { UserRole } from '../types';

const router = Router();

// GET /api/audit-logs (Manager only)
router.get('/logs', authenticateToken, requireRole(UserRole.MANAGER), (_req: AuthenticatedRequest, res: Response) => {
  return res.json(db.getAuditLogs());
});

// GET /api/audit-logs/activities (Manager only)
router.get('/activities', authenticateToken, requireRole(UserRole.MANAGER), (req: AuthenticatedRequest, res: Response) => {
  const { userId } = req.query;
  return res.json(db.getCashierActivities(userId as string));
});

export default router;
