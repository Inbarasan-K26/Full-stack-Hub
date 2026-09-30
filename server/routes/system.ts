/**
 * System Diagnostics, Telemetry, and API Spec Routes
 */
import { Router } from 'express';
import { db } from '../database.js';
import { config } from '../config.js';

export const systemRouter = Router();

// GET /api/health
systemRouter.get('/health', (_req, res) => {
  const stats = db.getStats();
  return res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: config.APP_ENV,
    database: 'connected (in-memory + persistent ACID JSON)',
    uptimeSeconds: stats.uptimeSeconds,
    memoryUsageMB: stats.memoryUsageMB,
  });
});

// GET /api/stats
systemRouter.get('/stats', (_req, res) => {
  const stats = db.getStats();
  return res.json({
    stats,
    timestamp: new Date().toISOString(),
  });
});

// GET /api/logs
systemRouter.get('/logs', (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 30, 100);
  const logs = db.getAuditLogs(limit);
  return res.json({
    logs,
    total: logs.length,
  });
});

// GET /api/spec (API Documentation Schema for API Explorer)
systemRouter.get('/spec', (_req, res) => {
  return res.json({
    title: 'Nexus FullStack API Specification',
    version: '1.0.0',
    description: 'RESTful API endpoints for authentication, user management, and resources.',
    basePath: '/api',
    endpoints: [
      {
        path: '/api/health',
        method: 'GET',
        summary: 'Check system health and status',
        auth: false,
        params: [],
        exampleResponse: { status: 'healthy', version: '1.0.0' },
      },
      {
        path: '/api/stats',
        method: 'GET',
        summary: 'Retrieve application metrics and analytics',
        auth: false,
        params: [],
        exampleResponse: { totalUsers: 2, totalItems: 6, completionRate: 50 },
      },
      {
        path: '/api/auth/register',
        method: 'POST',
        summary: 'Register a new user account',
        auth: false,
        body: {
          email: 'user@example.com',
          username: 'johndoe',
          fullName: 'John Doe',
          password: 'password123',
        },
      },
      {
        path: '/api/auth/login',
        method: 'POST',
        summary: 'Authenticate user credentials and receive JWT token',
        auth: false,
        body: {
          email: 'admin@example.com',
          password: 'admin123',
        },
      },
      {
        path: '/api/auth/me',
        method: 'GET',
        summary: 'Fetch currently authenticated user details',
        auth: true,
      },
      {
        path: '/api/auth/profile',
        method: 'PUT',
        summary: 'Update current user profile information',
        auth: true,
        body: {
          fullName: 'Alex Morgan',
          bio: 'Lead FullStack Engineer',
        },
      },
      {
        path: '/api/items',
        method: 'GET',
        summary: 'List and filter tasks/resources',
        auth: false,
        params: [
          { name: 'search', type: 'string', description: 'Filter by keyword' },
          { name: 'category', type: 'string', description: 'Filter by category (DevOps, Security, etc.)' },
          { name: 'status', type: 'string', description: 'Filter by status (todo, in_progress, completed)' },
          { name: 'priority', type: 'string', description: 'Filter by priority (low, medium, high, urgent)' },
        ],
      },
      {
        path: '/api/items',
        method: 'POST',
        summary: 'Create a new task or resource item',
        auth: true,
        body: {
          title: 'Deploy microservice to Kubernetes',
          description: 'Set up Helm charts and rolling updates.',
          category: 'DevOps',
          priority: 'high',
          status: 'todo',
          tags: ['k8s', 'helm', 'cloud'],
        },
      },
      {
        path: '/api/items/:id',
        method: 'PUT',
        summary: 'Update an existing item by ID',
        auth: true,
        body: {
          status: 'completed',
          priority: 'urgent',
        },
      },
      {
        path: '/api/items/:id',
        method: 'DELETE',
        summary: 'Delete an item by ID',
        auth: true,
      },
      {
        path: '/api/logs',
        method: 'GET',
        summary: 'Inspect server audit activity logs',
        auth: false,
      },
    ],
  });
});
