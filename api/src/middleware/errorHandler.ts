import { Request, Response, NextFunction } from 'express';

export interface ApiError extends Error {
  statusCode?: number;
  errors?: any[];
}

export function errorHandler(
  err: ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  console.error(`[Error] ${statusCode}: ${message}`, err.stack);

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(err.errors && { details: err.errors }),
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    error: {
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
}

export function createError(message: string, statusCode: number, errors?: any[]): ApiError {
  const error: ApiError = new Error(message);
  error.statusCode = statusCode;
  error.errors = errors;
  return error;
}

