import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from './auth';
import { JWTPayload, UserRole } from './types';
import { db } from './db';

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1];

  if (!token && req.query.token) {
    token = req.query.token as string;
  }

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const payload = verifyAccessToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Invalid or expired access token' });
  }

  // Check if user is active
  const user = db.getUserById(payload.userId);
  if (!user || !user.isActive) {
    return res.status(401).json({ error: 'User account is deactivated or deleted' });
  }

  req.user = payload;
  next();
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: `Forbidden: Requires one of [${allowedRoles.join(', ')}] role` });
    }

    next();
  };
}

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error(`[Global Error Handler] ${req.method} ${req.url}:`, err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal Server Error',
    timestamp: new Date().toISOString()
  });
}
