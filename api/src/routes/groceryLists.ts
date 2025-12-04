import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';
import {
  createGroceryListSchema,
  updateGroceryListSchema,
  createGroceryListItemSchema,
  updateGroceryListItemSchema,
  validateBody,
} from '../lib/validation.js';
import { createError } from '../middleware/errorHandler.js';
import { ZodError } from 'zod';

const router = Router();

const LOW_STOCK_THRESHOLD = 2;

// GET /api/grocery-lists - List grocery lists for a user
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = parseInt(req.query.userId as string);
    const status = req.query.status as string | undefined;

    if (isNaN(userId)) {
      throw createError('userId query parameter is required', 400);
    }

    const lists = await prisma.groceryList.findMany({
      where: {
        userId,
        ...(status && { status }),
      },
      include: {
        items: true,
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: lists });
  } catch (error) {
    next(error);
  }
});

// GET /api/grocery-lists/:id - Get single grocery list with items
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const groceryListId = parseInt(req.params.id);
    if (isNaN(groceryListId)) {
      throw createError('Invalid grocery list ID', 400);
    }

    const list = await prisma.groceryList.findUnique({
      where: { groceryListId },
      include: {
        items: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!list) {
      throw createError('Grocery list not found', 404);
    }

    res.json({ success: true, data: list });
  } catch (error) {
    next(error);
  }
});

// POST /api/grocery-lists - Create grocery list
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = validateBody(createGroceryListSchema, req.body);

    // Verify user exists
    const user = await prisma.user.findUnique({ where: { userId: data.userId } });
    if (!user) {
      throw createError('User not found', 404);
    }

    const list = await prisma.groceryList.create({
      data,
      include: { items: true },
    });

    res.status(201).json({ success: true, data: list });
  } catch (error) {
    if (error instanceof ZodError) {
      next(createError('Validation failed', 400, error.errors));
    } else {
      next(error);
    }
  }
});

// PUT /api/grocery-lists/:id - Update grocery list
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const groceryListId = parseInt(req.params.id);
    if (isNaN(groceryListId)) {
      throw createError('Invalid grocery list ID', 400);
    }

    const data = validateBody(updateGroceryListSchema, req.body);

    const list = await prisma.groceryList.update({
      where: { groceryListId },
      data,
      include: { items: true },
    });

    res.json({ success: true, data: list });
  } catch (error) {
    if (error instanceof ZodError) {
      next(createError('Validation failed', 400, error.errors));
    } else if ((error as any).code === 'P2025') {
      next(createError('Grocery list not found', 404));
    } else {
      next(error);
    }
  }
});

// DELETE /api/grocery-lists/:id - Delete grocery list
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const groceryListId = parseInt(req.params.id);
    if (isNaN(groceryListId)) {
      throw createError('Invalid grocery list ID', 400);
    }

    await prisma.groceryList.delete({ where: { groceryListId } });
    res.json({ success: true, message: 'Grocery list deleted successfully' });
  } catch (error) {
    if ((error as any).code === 'P2025') {
      next(createError('Grocery list not found', 404));
    } else {
      next(error);
    }
  }
});

// ============ List Items ============

// POST /api/grocery-lists/:id/items - Add item to list
router.post('/:id/items', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const groceryListId = parseInt(req.params.id);
    if (isNaN(groceryListId)) {
      throw createError('Invalid grocery list ID', 400);
    }

    const data = validateBody(createGroceryListItemSchema, req.body);

    // Verify list exists
    const list = await prisma.groceryList.findUnique({ where: { groceryListId } });
    if (!list) {
      throw createError('Grocery list not found', 404);
    }

    const item = await prisma.groceryListItem.create({
      data: {
        ...data,
        groceryListId,
      },
    });

    res.status(201).json({ success: true, data: item });
  } catch (error) {
    if (error instanceof ZodError) {
      next(createError('Validation failed', 400, error.errors));
    } else {
      next(error);
    }
  }
});

// PUT /api/grocery-lists/:listId/items/:itemId - Update list item
router.put('/:listId/items/:itemId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const groceryListId = parseInt(req.params.listId);
    const groceryListItemId = parseInt(req.params.itemId);

    if (isNaN(groceryListId) || isNaN(groceryListItemId)) {
      throw createError('Invalid IDs', 400);
    }

    const data = validateBody(updateGroceryListItemSchema, req.body);

    // Verify item belongs to list
    const existingItem = await prisma.groceryListItem.findFirst({
      where: { groceryListItemId, groceryListId },
    });
    if (!existingItem) {
      throw createError('Item not found in this list', 404);
    }

    const item = await prisma.groceryListItem.update({
      where: { groceryListItemId },
      data,
    });

    res.json({ success: true, data: item });
  } catch (error) {
    if (error instanceof ZodError) {
      next(createError('Validation failed', 400, error.errors));
    } else {
      next(error);
    }
  }
});

// DELETE /api/grocery-lists/:listId/items/:itemId - Remove item from list
router.delete('/:listId/items/:itemId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const groceryListId = parseInt(req.params.listId);
    const groceryListItemId = parseInt(req.params.itemId);

    if (isNaN(groceryListId) || isNaN(groceryListItemId)) {
      throw createError('Invalid IDs', 400);
    }

    // Verify item belongs to list
    const existingItem = await prisma.groceryListItem.findFirst({
      where: { groceryListItemId, groceryListId },
    });
    if (!existingItem) {
      throw createError('Item not found in this list', 404);
    }

    await prisma.groceryListItem.delete({ where: { groceryListItemId } });
    res.json({ success: true, message: 'Item removed from list' });
  } catch (error) {
    next(error);
  }
});

// ============ Auto-add features ============

// POST /api/grocery-lists/:id/add-expiring - Add expiring pantry items
router.post('/:id/add-expiring', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const groceryListId = parseInt(req.params.id);
    const userId = parseInt(req.query.userId as string);
    const days = parseInt(req.query.days as string) || 7;

    if (isNaN(groceryListId) || isNaN(userId)) {
      throw createError('groceryListId and userId are required', 400);
    }

    const list = await prisma.groceryList.findUnique({ where: { groceryListId } });
    if (!list) {
      throw createError('Grocery list not found', 404);
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + days);

    const expiringItems = await prisma.pantryItem.findMany({
      where: {
        userId,
        expirationDate: { not: null, lte: cutoffDate },
      },
    });

    let addedCount = 0;
    for (const pantryItem of expiringItems) {
      // Check if already in list
      const existing = await prisma.groceryListItem.findFirst({
        where: { groceryListId, pantryItemId: pantryItem.pantryItemId },
      });

      if (!existing) {
        await prisma.groceryListItem.create({
          data: {
            groceryListId,
            pantryItemId: pantryItem.pantryItemId,
            name: pantryItem.name,
            quantity: pantryItem.quantity,
            unit: pantryItem.unit,
            category: pantryItem.category,
            note: `Expiring: ${pantryItem.expirationDate?.toISOString().split('T')[0]}`,
          },
        });
        addedCount++;
      }
    }

    res.json({ success: true, message: `Added ${addedCount} expiring items to list` });
  } catch (error) {
    next(error);
  }
});

// POST /api/grocery-lists/:id/add-low-stock - Add low stock pantry items
router.post('/:id/add-low-stock', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const groceryListId = parseInt(req.params.id);
    const userId = parseInt(req.query.userId as string);

    if (isNaN(groceryListId) || isNaN(userId)) {
      throw createError('groceryListId and userId are required', 400);
    }

    const list = await prisma.groceryList.findUnique({ where: { groceryListId } });
    if (!list) {
      throw createError('Grocery list not found', 404);
    }

    const lowStockItems = await prisma.pantryItem.findMany({
      where: {
        userId,
        quantity: { not: null, lte: LOW_STOCK_THRESHOLD },
      },
    });

    let addedCount = 0;
    for (const pantryItem of lowStockItems) {
      const existing = await prisma.groceryListItem.findFirst({
        where: { groceryListId, pantryItemId: pantryItem.pantryItemId },
      });

      if (!existing) {
        await prisma.groceryListItem.create({
          data: {
            groceryListId,
            pantryItemId: pantryItem.pantryItemId,
            name: pantryItem.name,
            quantity: 5, // Default restock quantity
            unit: pantryItem.unit,
            category: pantryItem.category,
            note: `Low stock (currently: ${pantryItem.quantity})`,
          },
        });
        addedCount++;
      }
    }

    res.json({ success: true, message: `Added ${addedCount} low stock items to list` });
  } catch (error) {
    next(error);
  }
});

export default router;


