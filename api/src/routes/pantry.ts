import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';
import { createPantryItemSchema, updatePantryItemSchema, validateBody } from '../lib/validation.js';
import { createError } from '../middleware/errorHandler.js';
import { ZodError } from 'zod';

const router = Router();

const LOW_STOCK_THRESHOLD = 2;

// Helper to add computed fields
function enrichPantryItem(item: any, reminderDays: number = 3) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let isExpiringSoon = false;
  let isLowStock = false;
  let daysUntilExpiry: number | null = null;

  if (item.expirationDate) {
    const expDate = new Date(item.expirationDate);
    expDate.setHours(0, 0, 0, 0);
    daysUntilExpiry = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    isExpiringSoon = daysUntilExpiry <= reminderDays;
  }

  if (item.quantity !== null) {
    isLowStock = Number(item.quantity) <= LOW_STOCK_THRESHOLD;
  }

  return {
    ...item,
    isExpiringSoon,
    isLowStock,
    daysUntilExpiry,
  };
}

// GET /api/pantry - List pantry items for a user
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = parseInt(req.query.userId as string);
    if (isNaN(userId)) {
      throw createError('userId query parameter is required', 400);
    }

    const category = req.query.category as string | undefined;

    const user = await prisma.user.findUnique({ where: { userId } });
    if (!user) {
      throw createError('User not found', 404);
    }

    const items = await prisma.pantryItem.findMany({
      where: {
        userId,
        ...(category && { category }),
      },
      orderBy: { createdAt: 'desc' },
    });

    const enrichedItems = items.map((item) =>
      enrichPantryItem(item, user.reminderWindowDays || 3)
    );

    res.json({ success: true, data: enrichedItems });
  } catch (error) {
    next(error);
  }
});

// GET /api/pantry/expiring - Get expiring items
router.get('/expiring', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = parseInt(req.query.userId as string);
    const days = parseInt(req.query.days as string) || 7;

    if (isNaN(userId)) {
      throw createError('userId query parameter is required', 400);
    }

    const user = await prisma.user.findUnique({ where: { userId } });
    if (!user) {
      throw createError('User not found', 404);
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + days);

    const items = await prisma.pantryItem.findMany({
      where: {
        userId,
        expirationDate: {
          not: null,
          lte: cutoffDate,
        },
      },
      orderBy: { expirationDate: 'asc' },
    });

    const enrichedItems = items.map((item) =>
      enrichPantryItem(item, user.reminderWindowDays || 3)
    );

    res.json({
      success: true,
      data: { items: enrichedItems, count: enrichedItems.length },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/pantry/low-stock - Get low stock items
router.get('/low-stock', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = parseInt(req.query.userId as string);
    if (isNaN(userId)) {
      throw createError('userId query parameter is required', 400);
    }

    const user = await prisma.user.findUnique({ where: { userId } });
    if (!user) {
      throw createError('User not found', 404);
    }

    const items = await prisma.pantryItem.findMany({
      where: {
        userId,
        quantity: {
          not: null,
          lte: LOW_STOCK_THRESHOLD,
        },
      },
      orderBy: { quantity: 'asc' },
    });

    const enrichedItems = items.map((item) =>
      enrichPantryItem(item, user.reminderWindowDays || 3)
    );

    res.json({
      success: true,
      data: { items: enrichedItems, count: enrichedItems.length },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/pantry/categories - List unique categories
router.get('/categories', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = parseInt(req.query.userId as string);
    if (isNaN(userId)) {
      throw createError('userId query parameter is required', 400);
    }

    const categories = await prisma.pantryItem.findMany({
      where: { userId, category: { not: null } },
      select: { category: true },
      distinct: ['category'],
    });

    res.json({
      success: true,
      data: categories.map((c) => c.category).filter(Boolean),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/pantry/:id - Get single pantry item
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pantryItemId = parseInt(req.params.id);
    if (isNaN(pantryItemId)) {
      throw createError('Invalid pantry item ID', 400);
    }

    const item = await prisma.pantryItem.findUnique({
      where: { pantryItemId },
      include: { user: { select: { reminderWindowDays: true } } },
    });

    if (!item) {
      throw createError('Pantry item not found', 404);
    }

    const enriched = enrichPantryItem(item, item.user.reminderWindowDays || 3);
    res.json({ success: true, data: enriched });
  } catch (error) {
    next(error);
  }
});

// POST /api/pantry - Create pantry item
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = validateBody(createPantryItemSchema, req.body);

    // Verify user exists
    const user = await prisma.user.findUnique({ where: { userId: data.userId } });
    if (!user) {
      throw createError('User not found', 404);
    }

    const item = await prisma.pantryItem.create({
      data: {
        ...data,
        expirationDate: data.expirationDate ? new Date(data.expirationDate) : null,
      },
    });

    // Auto-create notification if expiration date is set
    if (item.expirationDate && user.reminderWindowDays) {
      const notifyDate = new Date(item.expirationDate);
      notifyDate.setDate(notifyDate.getDate() - user.reminderWindowDays);

      if (notifyDate >= new Date()) {
        await prisma.notification.create({
          data: {
            pantryItemId: item.pantryItemId,
            scheduledFor: notifyDate,
            status: 'pending',
          },
        });
      }
    }

    const enriched = enrichPantryItem(item, user.reminderWindowDays || 3);
    res.status(201).json({ success: true, data: enriched });
  } catch (error) {
    if (error instanceof ZodError) {
      next(createError('Validation failed', 400, error.errors));
    } else {
      next(error);
    }
  }
});

// PUT /api/pantry/:id - Update pantry item
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pantryItemId = parseInt(req.params.id);
    if (isNaN(pantryItemId)) {
      throw createError('Invalid pantry item ID', 400);
    }

    const data = validateBody(updatePantryItemSchema, req.body);

    const item = await prisma.pantryItem.update({
      where: { pantryItemId },
      data: {
        ...data,
        expirationDate: data.expirationDate ? new Date(data.expirationDate) : undefined,
      },
      include: { user: { select: { reminderWindowDays: true } } },
    });

    const enriched = enrichPantryItem(item, item.user.reminderWindowDays || 3);
    res.json({ success: true, data: enriched });
  } catch (error) {
    if (error instanceof ZodError) {
      next(createError('Validation failed', 400, error.errors));
    } else if ((error as any).code === 'P2025') {
      next(createError('Pantry item not found', 404));
    } else {
      next(error);
    }
  }
});

// DELETE /api/pantry/:id - Delete pantry item
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pantryItemId = parseInt(req.params.id);
    if (isNaN(pantryItemId)) {
      throw createError('Invalid pantry item ID', 400);
    }

    await prisma.pantryItem.delete({ where: { pantryItemId } });
    res.json({ success: true, message: 'Pantry item deleted successfully' });
  } catch (error) {
    if ((error as any).code === 'P2025') {
      next(createError('Pantry item not found', 404));
    } else {
      next(error);
    }
  }
});

export default router;


