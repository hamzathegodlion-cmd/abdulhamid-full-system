import { Router, Response } from 'express';
import { db } from '../db';
import { comparePassword, generateAccessToken, generateRefreshToken, hashPassword, verifyRefreshToken } from '../auth';
import { authenticateToken, AuthenticatedRequest } from '../middleware';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = db.getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Your account has been deactivated. Please contact store manager.' });
    }

    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Update last login
    db.updateUser(user.id, { lastLoginAt: new Date().toISOString() });

    const payload = {
      userId: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Log activity
    db.addCashierActivity({
      userId: user.id,
      userName: user.fullName,
      action: 'Login',
      details: `${user.role} logged in successfully`,
      ipAddress: req.ip || '127.0.0.1'
    });

    db.addAuditLog({
      userId: user.id,
      userName: user.fullName,
      action: 'UserLogin',
      entity: 'User',
      entityId: user.id,
      ipAddress: req.ip || '127.0.0.1'
    });

    return res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        fullName: user.fullName,
        username: user.username,
        role: user.role,
        phone: user.phone,
        address: user.address,
        lastLoginAt: user.lastLoginAt
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Login failed' });
  }
});

// POST /api/auth/refresh
router.post('/refresh', (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token is required' });
  }

  const payload = verifyRefreshToken(refreshToken);
  if (!payload) {
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }

  const user = db.getUserById(payload.userId);
  if (!user || !user.isActive) {
    return res.status(401).json({ error: 'User is inactive or deleted' });
  }

  const newPayload = {
    userId: user.id,
    username: user.username,
    fullName: user.fullName,
    role: user.role
  };

  const newAccessToken = generateAccessToken(newPayload);
  const newRefreshToken = generateRefreshToken(newPayload);

  return res.json({
    accessToken: newAccessToken,
    refreshToken: newRefreshToken
  });
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const user = db.getUserById(req.user.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  return res.json({
    user: {
      id: user.id,
      fullName: user.fullName,
      username: user.username,
      role: user.role,
      phone: user.phone,
      address: user.address,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt
    }
  });
});

// PUT /api/auth/profile
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
    user: {
      id: updated!.id,
      fullName: updated!.fullName,
      username: updated!.username,
      role: updated!.role,
      phone: updated!.phone,
      address: updated!.address,
      lastLoginAt: updated!.lastLoginAt,
      createdAt: updated!.createdAt
    }
  });
});

// POST /api/auth/change-password
router.post('/change-password', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    const user = db.getUserById(req.user!.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isValid = await comparePassword(currentPassword, user.passwordHash);
    if (!isValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const newHash = await hashPassword(newPassword);
    db.updateUser(user.id, { passwordHash: newHash });

    db.addCashierActivity({
      userId: user.id,
      userName: user.fullName,
      action: 'PasswordReset',
      details: 'User updated their own password',
      ipAddress: req.ip
    });

    return res.json({ message: 'Password updated successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/logout
router.post('/logout', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  if (req.user) {
    db.addCashierActivity({
      userId: req.user.userId,
      userName: req.user.fullName,
      action: 'Logout',
      details: 'Logged out',
      ipAddress: req.ip
    });
  }
  return res.json({ message: 'Logged out successfully' });
});

export default router;
