export type UserRole = 'admin' | 'user';

export interface User {
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

export interface SystemStats {
  totalUsers: number;
  totalItems: number;
  completedItems: number;
  inProgressItems: number;
  todoItems: number;
  completionRate: number;
  totalRequests: number;
  uptimeSeconds: number;
  totalAuditLogs: number;
  memoryUsageMB: number;
}

export interface ApiEndpointSpec {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  summary: string;
  auth: boolean;
  params?: { name: string; type: string; description: string }[];
  body?: Record<string, any>;
  exampleResponse?: Record<string, any>;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
}
