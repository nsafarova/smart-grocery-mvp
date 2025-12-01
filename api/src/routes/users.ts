import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';
import { createUserSchema, updateUserSchema, validateBody } from '../lib/validation.js';
import { createError } from '../middleware/errorHandler.js';
import { ZodError } from 'zod';

const router = Router();

// GET /api/users - List all users
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
});

// GET /api/users/:id - Get user by ID
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      throw createError('Invalid user ID', 400);
    }

    const user = await prisma.user.findUnique({
      where: { userId },
      include: {
        _count: {
          select: {
            pantryItems: true,
            groceryLists: true,
            mealIdeas: true,
          },
        },
      },
    });

    if (!user) {
      throw createError('User not found', 404);
    }

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

// POST /api/users - Create new user
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = validateBody(createUserSchema, req.body);

    // Check if email exists
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) {
      throw createError('Email already registered', 409);
    }

    const user = await prisma.user.create({ data });
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    if (error instanceof ZodError) {
      next(createError('Validation failed', 400, error.errors));
    } else {
      next(error);
    }
  }
});

// PUT /api/users/:id - Update user
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      throw createError('Invalid user ID', 400);
    }

    const data = validateBody(updateUserSchema, req.body);

    const user = await prisma.user.update({
      where: { userId },
      data,
    });

    res.json({ success: true, data: user });
  } catch (error) {
    if (error instanceof ZodError) {
      next(createError('Validation failed', 400, error.errors));
    } else if ((error as any).code === 'P2025') {
      next(createError('User not found', 404));
    } else {
      next(error);
    }
  }
});

// DELETE /api/users/:id - Delete user
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      throw createError('Invalid user ID', 400);
    }

    await prisma.user.delete({ where: { userId } });
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    if ((error as any).code === 'P2025') {
      next(createError('User not found', 404));
    } else {
      next(error);
    }
  }
});

export default router;

