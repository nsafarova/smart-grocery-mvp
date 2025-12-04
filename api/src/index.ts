import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import userRoutes from './routes/users.js';
import pantryRoutes from './routes/pantry.js';
import groceryListRoutes from './routes/groceryLists.js';
import mealRoutes from './routes/meals.js';
import notificationRoutes from './routes/notifications.js';

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/pantry', pantryRoutes);
app.use('/api/grocery-lists', groceryListRoutes);
app.use('/api/meals', mealRoutes);
app.use('/api/notifications', notificationRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Only listen when not in Vercel serverless environment
if (process.env.VERCEL !== '1') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Smart Grocery API running on http://localhost:${PORT}`);
    console.log(`📱 Also accessible at http://10.0.0.78:${PORT} (for mobile devices)`);
  });
}

// Export for Vercel serverless
// Vercel with @vercel/node expects the Express app as default export
export default app;
