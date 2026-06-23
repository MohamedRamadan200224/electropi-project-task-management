import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { ENV } from '../config/env';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ status: 'fail', message: err.message });
    return;
  }

  // Mongoose duplicate key
  if ('code' in err && (err as NodeJS.ErrnoException).code === '11000') {
    res.status(409).json({ status: 'fail', message: 'Duplicate field value' });
    return;
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    res.status(400).json({ status: 'fail', message: 'Invalid ID format' });
    return;
  }

  if (ENV.NODE_ENV === 'development') {
    res.status(500).json({ status: 'error', message: err.message, stack: err.stack });
  } else {
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
}
