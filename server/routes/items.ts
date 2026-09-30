/**
 * Items / Tasks CRUD Endpoints
 * Mirrors core application routes in backend/app/main.py
 */
import { Router, Response } from 'express';
import { db } from '../database.js';
import { AuthenticatedRequest, requireAuth } from '../security.js';
import { ItemCategory, ItemPriority, ItemStatus } from '../models.js';

export const itemsRouter = Router();

// GET /api/items
itemsRouter.get('/', (req, res) => {
  const { search, category, priority, status } = req.query as {
    search?: string;
    category?: string;
    priority?: string;
    status?: string;
  };

  const items = db.getItems({
    search,
    category,
    priority,
    status,
  });

  return res.json({
    items,
    total: items.length,
    filters: { search, category, priority, status },
  });
});

// GET /api/items/:id
itemsRouter.get('/:id', (req, res) => {
  const item = db.getItemById(req.params.id);
  if (!item) {
    return res.status(404).json({ error: 'Not Found', message: 'Item not found.' });
  }
  return res.json({ item });
});

// POST /api/items (Authenticated)
itemsRouter.post('/', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, description, category, priority, status, assignedTo, tags } = req.body;

    if (!title || !category || !priority) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'title, category, and priority are required.',
      });
    }

    const createdBy = req.user?.email || 'anonymous';

    const newItem = db.createItem({
      title: title.trim(),
      description: description ? description.trim() : '',
      category: (category as ItemCategory) || 'Backend',
      priority: (priority as ItemPriority) || 'medium',
      status: (status as ItemStatus) || 'todo',
      assignedTo: assignedTo || createdBy,
      tags: Array.isArray(tags) ? tags : [],
      createdBy,
    });

    return res.status(201).json({
      message: 'Item created successfully',
      item: newItem,
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

// PUT /api/items/:id (Authenticated)
itemsRouter.put('/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, category, priority, status, assignedTo, tags } = req.body;

    const existing = db.getItemById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Not Found', message: 'Item not found.' });
    }

    const updated = db.updateItem(
      id,
      {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: description.trim() }),
        ...(category !== undefined && { category }),
        ...(priority !== undefined && { priority }),
        ...(status !== undefined && { status }),
        ...(assignedTo !== undefined && { assignedTo }),
        ...(tags !== undefined && { tags: Array.isArray(tags) ? tags : [] }),
      },
      req.user?.email || 'anonymous'
    );

    return res.json({
      message: 'Item updated successfully',
      item: updated,
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

// DELETE /api/items/:id (Authenticated)
itemsRouter.delete('/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const success = db.deleteItem(id, req.user?.email || 'anonymous');

  if (!success) {
    return res.status(404).json({ error: 'Not Found', message: 'Item not found.' });
  }

  return res.json({ message: 'Item deleted successfully', id });
});

// POST /api/items/reset-seed (Admin or Demo user can reset)
itemsRouter.post('/reset-seed', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  db.resetToDefaults(req.user?.email || 'admin@example.com');
  return res.json({
    message: 'Database reset to default seed records successfully.',
    items: db.getItems(),
  });
});
