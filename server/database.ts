/**
 * In-Memory & Persistent Database Engine
 * Mirrors backend/app/database.py
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import { User, Item, AuditLog, sanitizeUser, UserResponse } from './models.js';
import { hashPassword } from './security.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

interface DatabaseSchema {
  users: User[];
  items: Item[];
  auditLogs: AuditLog[];
  metrics: {
    totalRequests: number;
    startTime: number;
  };
}

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadDatabase();
    if (this.data.users.length === 0) {
      this.seedInitialData();
    }
  }

  private loadDatabase(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.warn('Failed to load persistent db file, initializing fresh store:', err);
    }

    return {
      users: [],
      items: [],
      auditLogs: [],
      metrics: {
        totalRequests: 0,
        startTime: Date.now(),
      },
    };
  }

  private saveDatabase(): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.warn('Could not persist database to disk:', err);
    }
  }

  public seedInitialData(): void {
    const adminPasswordHash = hashPassword('admin123');
    const demoPasswordHash = hashPassword('demo123');
    const now = new Date().toISOString();

    const adminUser: User = {
      id: 'usr_admin_001',
      email: 'admin@example.com',
      username: 'admin',
      fullName: 'System Administrator',
      role: 'admin',
      passwordHash: adminPasswordHash,
      bio: 'Principal DevOps & FullStack Systems Lead',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now,
    };

    const demoUser: User = {
      id: 'usr_demo_002',
      email: 'demo@example.com',
      username: 'alexdev',
      fullName: 'Alex Morgan',
      role: 'user',
      passwordHash: demoPasswordHash,
      bio: 'Senior Software Engineer building React & API solutions',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now,
    };

    const sampleItems: Item[] = [
      {
        id: 'item_001',
        title: 'Containerize Backend & Frontend with Docker Compose',
        description: 'Orchestrate FastAPI/Node backend and React frontend services with hot-reloading and network isolation.',
        category: 'DevOps',
        priority: 'high',
        status: 'completed',
        assignedTo: 'admin@example.com',
        tags: ['docker', 'compose', 'devops', 'infrastructure'],
        createdBy: 'admin@example.com',
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        updatedAt: now,
      },
      {
        id: 'item_002',
        title: 'Implement Cryptographic JWT Authentication & RBAC',
        description: 'Secure API with signed HMAC-SHA256 JWT tokens, PBKDF2 password hashing, and role-based permissions.',
        category: 'Security',
        priority: 'urgent',
        status: 'completed',
        assignedTo: 'demo@example.com',
        tags: ['security', 'jwt', 'auth', 'rbac'],
        createdBy: 'admin@example.com',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        updatedAt: now,
      },
      {
        id: 'item_003',
        title: 'Design Reactive Dashboard with Real-Time Telemetry',
        description: 'Create responsive metrics cards, interactive data grids, priority badges, and activity tracking in Tailwind CSS.',
        category: 'Frontend',
        priority: 'high',
        status: 'in_progress',
        assignedTo: 'demo@example.com',
        tags: ['react', 'tailwind', 'ui', 'dashboard'],
        createdBy: 'demo@example.com',
        createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
        updatedAt: now,
      },
      {
        id: 'item_004',
        title: 'Construct Interactive REST API Explorer Playground',
        description: 'Allow developers to inspect, test, and debug all live endpoints directly from within the browser interface.',
        category: 'Backend',
        priority: 'medium',
        status: 'in_progress',
        assignedTo: 'demo@example.com',
        tags: ['api', 'rest', 'swagger', 'developer-tools'],
        createdBy: 'admin@example.com',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'item_005',
        title: 'Database Schema Indexing and Query Optimization',
        description: 'Audit query execution plans, configure database indexes, and optimize serialization for high throughput.',
        category: 'Database',
        priority: 'medium',
        status: 'todo',
        assignedTo: 'admin@example.com',
        tags: ['database', 'sqlite', 'performance', 'sql'],
        createdBy: 'admin@example.com',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'item_006',
        title: 'Full-Stack Architecture Specification & Health Probes',
        description: 'Integrate /api/health probe endpoints, memory monitoring, and automated system diagnostics.',
        category: 'Architecture',
        priority: 'low',
        status: 'completed',
        assignedTo: 'demo@example.com',
        tags: ['architecture', 'healthcheck', 'monitoring'],
        createdBy: 'admin@example.com',
        createdAt: now,
        updatedAt: now,
      },
    ];

    const sampleLogs: AuditLog[] = [
      {
        id: 'log_001',
        action: 'SYSTEM_BOOTSTRAP',
        userEmail: 'system',
        details: 'Full-stack application database bootstrapped with pre-configured schemas.',
        timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
        ip: '127.0.0.1',
      },
      {
        id: 'log_002',
        action: 'USER_REGISTERED',
        userEmail: 'admin@example.com',
        details: 'Default Administrator account provisioned.',
        timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
        ip: '127.0.0.1',
      },
      {
        id: 'log_003',
        action: 'USER_LOGIN',
        userEmail: 'admin@example.com',
        details: 'Successful JWT authentication token granted.',
        timestamp: new Date(Date.now() - 3600000 * 1).toISOString(),
        ip: '127.0.0.1',
      },
    ];

    this.data.users = [adminUser, demoUser];
    this.data.items = sampleItems;
    this.data.auditLogs = sampleLogs;
    this.saveDatabase();
  }

  // --- Users Operations ---
  public findUserByEmail(email: string): User | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public findUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public findUserByUsername(username: string): User | undefined {
    return this.data.users.find((u) => u.username.toLowerCase() === username.toLowerCase());
  }

  public createUser(userData: {
    email: string;
    username: string;
    fullName: string;
    password: string;
    role?: 'admin' | 'user';
  }): UserResponse {
    const now = new Date().toISOString();
    const newUser: User = {
      id: `usr_${crypto.randomUUID().slice(0, 8)}`,
      email: userData.email.trim().toLowerCase(),
      username: userData.username.trim().toLowerCase(),
      fullName: userData.fullName.trim(),
      role: userData.role || 'user',
      passwordHash: hashPassword(userData.password),
      avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(userData.username)}`,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now,
    };

    this.data.users.push(newUser);
    this.addAuditLog('USER_REGISTERED', newUser.email, `User registered: ${newUser.fullName}`);
    this.saveDatabase();
    return sanitizeUser(newUser);
  }

  public updateUser(id: string, updates: Partial<Pick<User, 'fullName' | 'bio' | 'avatar' | 'lastLoginAt' | 'passwordHash'>>): UserResponse | null {
    const user = this.findUserById(id);
    if (!user) return null;

    Object.assign(user, updates, { updatedAt: new Date().toISOString() });
    this.saveDatabase();
    return sanitizeUser(user);
  }

  public getAllUsers(): UserResponse[] {
    return this.data.users.map(sanitizeUser);
  }

  // --- Items Operations ---
  public getItems(filters?: {
    search?: string;
    category?: string;
    priority?: string;
    status?: string;
  }): Item[] {
    let results = [...this.data.items];

    if (filters) {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        results = results.filter(
          (i) =>
            i.title.toLowerCase().includes(q) ||
            i.description.toLowerCase().includes(q) ||
            i.tags.some((t) => t.toLowerCase().includes(q))
        );
      }
      if (filters.category && filters.category !== 'all') {
        results = results.filter((i) => i.category.toLowerCase() === filters.category!.toLowerCase());
      }
      if (filters.priority && filters.priority !== 'all') {
        results = results.filter((i) => i.priority === filters.priority);
      }
      if (filters.status && filters.status !== 'all') {
        results = results.filter((i) => i.status === filters.status);
      }
    }

    // Default sort by updatedAt desc
    return results.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  public getItemById(id: string): Item | undefined {
    return this.data.items.find((i) => i.id === id);
  }

  public createItem(data: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>): Item {
    const now = new Date().toISOString();
    const newItem: Item = {
      id: `item_${crypto.randomUUID().slice(0, 8)}`,
      ...data,
      createdAt: now,
      updatedAt: now,
    };

    this.data.items.unshift(newItem);
    this.addAuditLog('ITEM_CREATED', data.createdBy, `Created item: ${newItem.title}`);
    this.saveDatabase();
    return newItem;
  }

  public updateItem(id: string, updates: Partial<Omit<Item, 'id' | 'createdAt' | 'createdBy'>>, updatedBy: string): Item | null {
    const item = this.getItemById(id);
    if (!item) return null;

    Object.assign(item, updates, { updatedAt: new Date().toISOString() });
    this.addAuditLog('ITEM_UPDATED', updatedBy, `Updated item: ${item.title}`);
    this.saveDatabase();
    return item;
  }

  public deleteItem(id: string, deletedBy: string): boolean {
    const index = this.data.items.findIndex((i) => i.id === id);
    if (index === -1) return false;

    const title = this.data.items[index].title;
    this.data.items.splice(index, 1);
    this.addAuditLog('ITEM_DELETED', deletedBy, `Deleted item: ${title}`);
    this.saveDatabase();
    return true;
  }

  public resetToDefaults(triggeredBy: string): void {
    this.seedInitialData();
    this.addAuditLog('SYSTEM_RESET', triggeredBy, 'Database reset to default seed state.');
  }

  // --- Audit Logs & Metrics ---
  public addAuditLog(action: string, userEmail: string, details: string, ip: string = '127.0.0.1'): void {
    const log: AuditLog = {
      id: `log_${crypto.randomUUID().slice(0, 8)}`,
      action,
      userEmail,
      details,
      ip,
      timestamp: new Date().toISOString(),
    };
    this.data.auditLogs.unshift(log);
    if (this.data.auditLogs.length > 200) {
      this.data.auditLogs = this.data.auditLogs.slice(0, 200);
    }
  }

  public getAuditLogs(limit = 50): AuditLog[] {
    return this.data.auditLogs.slice(0, limit);
  }

  public incrementRequests(): void {
    this.data.metrics.totalRequests += 1;
  }

  public getStats() {
    const totalUsers = this.data.users.length;
    const totalItems = this.data.items.length;
    const completedItems = this.data.items.filter((i) => i.status === 'completed').length;
    const inProgressItems = this.data.items.filter((i) => i.status === 'in_progress').length;
    const todoItems = this.data.items.filter((i) => i.status === 'todo').length;
    const uptimeSec = Math.floor((Date.now() - this.data.metrics.startTime) / 1000);

    return {
      totalUsers,
      totalItems,
      completedItems,
      inProgressItems,
      todoItems,
      completionRate: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0,
      totalRequests: this.data.metrics.totalRequests,
      uptimeSeconds: uptimeSec,
      totalAuditLogs: this.data.auditLogs.length,
      memoryUsageMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    };
  }
}

export const db = new Database();
