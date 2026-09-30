/**
 * Authentication Routes
 * Mirrors FastAPI auth endpoints in backend/app/main.py
 */
import { Router, Response } from 'express';
import { db } from '../database.js';
import {
  hashPassword,
  verifyPassword,
  createAccessToken,
  AuthenticatedRequest,
  requireAuth,
  requireAdmin,
} from '../security.js';
import { sanitizeUser } from '../models.js';

export const authRouter = Router();

// POST /api/auth/register
authRouter.post('/register', (req, res) => {
  try {
    const { email, username, fullName, password } = req.body;

    if (!email || !username || !fullName || !password) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'All fields (email, username, fullName, password) are required.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Password must be at least 6 characters long.',
      });
    }

    if (db.findUserByEmail(email)) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'A user with this email address already exists.',
      });
    }

    if (db.findUserByUsername(username)) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'A user with this username already exists.',
      });
    }

    const newUser = db.createUser({
      email,
      username,
      fullName,
      password,
      role: 'user',
    });

    const token = createAccessToken({
      id: newUser.id,
      email: newUser.email,
      username: newUser.username,
      role: newUser.role,
    });

    return res.status(201).json({
      message: 'User registered successfully',
      token,
      user: newUser,
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

// POST /api/auth/login
authRouter.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Email and password are required.',
      });
    }

    const user = db.findUserByEmail(email) || db.findUserByUsername(email);

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password credentials.',
      });
    }

    // Update lastLoginAt
    db.updateUser(user.id, { lastLoginAt: new Date().toISOString() });
    db.addAuditLog('USER_LOGIN', user.email, `User signed in successfully: ${user.email}`);

    const safeUser = sanitizeUser(user);
    const token = createAccessToken({
      id: safeUser.id,
      email: safeUser.email,
      username: safeUser.username,
      role: safeUser.role,
    });

    return res.json({
      message: 'Login successful',
      token,
      user: safeUser,
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

// GET /api/auth/me
authRouter.get('/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const user = db.findUserById(userId);

  if (!user) {
    return res.status(404).json({ error: 'Not Found', message: 'User not found.' });
  }

  return res.json({ user: sanitizeUser(user) });
});

// PUT /api/auth/profile
authRouter.put('/profile', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { fullName, bio, avatar } = req.body;

    const updatedUser = db.updateUser(userId, {
      fullName: fullName !== undefined ? fullName : undefined,
      bio: bio !== undefined ? bio : undefined,
      avatar: avatar !== undefined ? avatar : undefined,
    });

    if (!updatedUser) {
      return res.status(404).json({ error: 'Not Found', message: 'User not found.' });
    }

    db.addAuditLog('USER_PROFILE_UPDATED', updatedUser.email, `Profile updated for ${updatedUser.fullName}`);

    return res.json({
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

// PUT /api/auth/change-password
authRouter.put('/change-password', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Current password and new password are required.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'New password must be at least 6 characters long.',
      });
    }

    const user = db.findUserById(userId);
    if (!user || !verifyPassword(currentPassword, user.passwordHash)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Current password does not match.',
      });
    }

    db.updateUser(userId, { passwordHash: hashPassword(newPassword) });
    db.addAuditLog('PASSWORD_CHANGED', user.email, `Password changed for user ${user.email}`);

    return res.json({ message: 'Password updated successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

// GET /api/auth/users (admin only)
authRouter.get('/users', requireAuth, requireAdmin, (_req, res) => {
  const users = db.getAllUsers();
  return res.json({ users, total: users.length });
});
