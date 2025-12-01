import { z } from 'zod';

// User validation schemas
export const createUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  name: z.string().max(100).optional(),
  timezone: z.string().max(50).optional(),
  dietaryTags: z.string().max(255).optional(),
  allergies: z.string().max(500).optional(),
  reminderWindowDays: z.number().int().min(1).max(30).optional(),
  notifyEmail: z.boolean().optional(),
  notifyPush: z.boolean().optional(),
  notifyExpiring: z.boolean().optional(),
  notifyLowStock: z.boolean().optional(),
});

export const updateUserSchema = createUserSchema.partial();

// Pantry Item validation schemas
export const createPantryItemSchema = z.object({
  userId: z.number().int().positive('User ID is required'),
  name: z.string().min(1, 'Name is required').max(255),
  quantity: z.number().min(0).optional(),
  unit: z.string().max(50).optional(),
  category: z.string().max(100).optional(),
  expirationDate: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
  source: z.string().max(100).optional(),
});

export const updatePantryItemSchema = createPantryItemSchema.omit({ userId: true }).partial();

// Grocery List validation schemas
export const createGroceryListSchema = z.object({
  userId: z.number().int().positive('User ID is required'),
  title: z.string().min(1, 'Title is required').max(255),
  status: z.enum(['active', 'completed', 'archived']).optional().default('active'),
});

export const updateGroceryListSchema = createGroceryListSchema.omit({ userId: true }).partial();

// Grocery List Item validation schemas
export const createGroceryListItemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  quantity: z.number().min(0).optional(),
  unit: z.string().max(50).optional(),
  category: z.string().max(100).optional(),
  note: z.string().max(1000).optional(),
  pantryItemId: z.number().int().positive().optional(),
});

export const updateGroceryListItemSchema = createGroceryListItemSchema.partial().extend({
  isChecked: z.boolean().optional(),
});

// Meal Idea validation schemas
export const createMealIdeaSchema = z.object({
  userId: z.number().int().positive('User ID is required'),
  title: z.string().min(1, 'Title is required').max(255),
  notes: z.string().max(2000).optional(),
});

export const updateMealIdeaSchema = createMealIdeaSchema.omit({ userId: true }).partial();

// Notification validation schemas
export const createNotificationSchema = z.object({
  pantryItemId: z.number().int().positive('Pantry Item ID is required'),
  scheduledFor: z.string().datetime('Invalid datetime format'),
  status: z.enum(['pending', 'sent', 'cancelled']).optional().default('pending'),
});

export const updateNotificationSchema = z.object({
  scheduledFor: z.string().datetime().optional(),
  status: z.enum(['pending', 'sent', 'cancelled']).optional(),
});

// Helper to validate and parse request body
export function validateBody<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

