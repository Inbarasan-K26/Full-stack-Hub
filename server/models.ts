/**
 * Data Models and Schemas
 * Mirrors backend/app/models.py & schemas.py
 */

export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  email: string;
  username: string;
  fullName: string;
  role: UserRole;
  passwordHash: string;
  bio?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export type ItemPriority = 'low' | 'medium' | 'high' | 'urgent';
export type ItemStatus = 'todo' | 'in_progress' | 'completed';
export type ItemCategory = 'Backend' | 'Frontend' | 'DevOps' | 'Security' | 'Database' | 'Architecture';

export interface Item {
  id: string;
  title: string;
  description: string;
  category: ItemCategory;
  priority: ItemPriority;
  status: ItemStatus;
  assignedTo?: string;
  tags: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  userEmail: string;
  details: string;
  ip?: string;
  timestamp: string;
}

export interface UserResponse {
  id: string;
  email: string;
  username: string;
  fullName: string;
  role: UserRole;
  bio?: string;
  avatar?: string;
  createdAt: string;
  lastLoginAt?: string;
}

export function sanitizeUser(user: User): UserResponse {
  const { passwordHash: _, ...safeUser } = user;
  return safeUser;
}
