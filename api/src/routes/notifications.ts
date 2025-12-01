import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';
import { createNotificationSchema, updateNotificationSchema, validateBody } from '../lib/validation.js';
import { createError } from '../middleware/errorHandler.js';
import { ZodError } from 'zod';

const router = Router();

// GET /api/notifications - List notifications for a user
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = parseInt(req.query.userId as string);
    const status = req.query.status as string | undefined;

    if (isNaN(userId)) {
      throw createError('userId query parameter is required', 400);
    }

    const notifications = await prisma.notification.findMany({
      where: {
        pantryItem: { userId },
        ...(status && { status }),
      },
      include: {
        pantryItem: {
          select: { name: true, expirationDate: true },
        },
      },
      orderBy: { scheduledFor: 'asc' },
    });

    const result = notifications.map((n) => ({
      ...n,
      pantryItemName: n.pantryItem.name,
      expirationDate: n.pantryItem.expirationDate,
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// GET /api/notifications/pending - Get pending notifications that are due
router.get('/pending', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = parseInt(req.query.userId as string);
    if (isNaN(userId)) {
      throw createError('userId query parameter is required', 400);
    }

    const now = new Date();

    const notifications = await prisma.notification.findMany({
      where: {
        pantryItem: { userId },
        status: 'pending',
        scheduledFor: { lte: now },
      },
      include: {
        pantryItem: {
          select: { name: true, expirationDate: true },
        },
      },
      orderBy: { scheduledFor: 'asc' },
    });

    const result = notifications.map((n) => ({
      ...n,
      pantryItemName: n.pantryItem.name,
      expirationDate: n.pantryItem.expirationDate,
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// GET /api/notifications/:id - Get single notification
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notificationId = parseInt(req.params.id);
    if (isNaN(notificationId)) {
      throw createError('Invalid notification ID', 400);
    }

    const notification = await prisma.notification.findUnique({
      where: { notificationId },
      include: {
        pantryItem: {
          select: { name: true, expirationDate: true },
        },
      },
    });

    if (!notification) {
      throw createError('Notification not found', 404);
    }

    res.json({
      success: true,
      data: {
        ...notification,
        pantryItemName: notification.pantryItem.name,
        expirationDate: notification.pantryItem.expirationDate,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/notifications - Create notification
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = validateBody(createNotificationSchema, req.body);

    // Verify pantry item exists
    const pantryItem = await prisma.pantryItem.findUnique({
      where: { pantryItemId: data.pantryItemId },
    });
    if (!pantryItem) {
      throw createError('Pantry item not found', 404);
    }

    const notification = await prisma.notification.create({
      data: {
        ...data,
        scheduledFor: new Date(data.scheduledFor),
      },
      include: {
        pantryItem: {
          select: { name: true },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: {
        ...notification,
        pantryItemName: notification.pantryItem.name,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      next(createError('Validation failed', 400, error.errors));
    } else {
      next(error);
    }
  }
});

// PUT /api/notifications/:id - Update notification
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notificationId = parseInt(req.params.id);
    if (isNaN(notificationId)) {
      throw createError('Invalid notification ID', 400);
    }

    const data = validateBody(updateNotificationSchema, req.body);

    const notification = await prisma.notification.update({
      where: { notificationId },
      data: {
        ...data,
        scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : undefined,
      },
    });

    res.json({ success: true, data: notification });
  } catch (error) {
    if (error instanceof ZodError) {
      next(createError('Validation failed', 400, error.errors));
    } else if ((error as any).code === 'P2025') {
      next(createError('Notification not found', 404));
    } else {
      next(error);
    }
  }
});

// PUT /api/notifications/:id/mark-sent - Mark as sent
router.put('/:id/mark-sent', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notificationId = parseInt(req.params.id);
    if (isNaN(notificationId)) {
      throw createError('Invalid notification ID', 400);
    }

    const notification = await prisma.notification.update({
      where: { notificationId },
      data: {
        status: 'sent',
        sentAt: new Date(),
      },
    });

    res.json({ success: true, data: notification });
  } catch (error) {
    if ((error as any).code === 'P2025') {
      next(createError('Notification not found', 404));
    } else {
      next(error);
    }
  }
});

// PUT /api/notifications/:id/cancel - Cancel notification
router.put('/:id/cancel', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notificationId = parseInt(req.params.id);
    if (isNaN(notificationId)) {
      throw createError('Invalid notification ID', 400);
    }

    const notification = await prisma.notification.update({
      where: { notificationId },
      data: { status: 'cancelled' },
    });

    res.json({ success: true, data: notification });
  } catch (error) {
    if ((error as any).code === 'P2025') {
      next(createError('Notification not found', 404));
    } else {
      next(error);
    }
  }
});

// DELETE /api/notifications/:id - Delete notification
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notificationId = parseInt(req.params.id);
    if (isNaN(notificationId)) {
      throw createError('Invalid notification ID', 400);
    }

    await prisma.notification.delete({ where: { notificationId } });
    res.json({ success: true, message: 'Notification deleted successfully' });
  } catch (error) {
    if ((error as any).code === 'P2025') {
      next(createError('Notification not found', 404));
    } else {
      next(error);
    }
  }
});

// POST /api/notifications/auto-schedule - Auto-schedule for expiring items
router.post('/auto-schedule', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = parseInt(req.body.userId);
    if (isNaN(userId)) {
      throw createError('userId is required', 400);
    }

    const user = await prisma.user.findUnique({ where: { userId } });
    if (!user) {
      throw createError('User not found', 404);
    }

    const reminderDays = user.reminderWindowDays || 3;

    // Get pantry items with expiration dates
    const pantryItems = await prisma.pantryItem.findMany({
      where: {
        userId,
        expirationDate: { not: null },
      },
    });

    let createdCount = 0;
    for (const item of pantryItems) {
      // Check if notification already exists
      const existing = await prisma.notification.findFirst({
        where: {
          pantryItemId: item.pantryItemId,
          status: 'pending',
        },
      });

      if (!existing && item.expirationDate) {
        const notifyDate = new Date(item.expirationDate);
        notifyDate.setDate(notifyDate.getDate() - reminderDays);

        if (notifyDate >= new Date()) {
          await prisma.notification.create({
            data: {
              pantryItemId: item.pantryItemId,
              scheduledFor: notifyDate,
              status: 'pending',
            },
          });
          createdCount++;
        }
      }
    }

    res.json({ success: true, message: `Scheduled ${createdCount} new notifications` });
  } catch (error) {
    next(error);
  }
});

export default router;

