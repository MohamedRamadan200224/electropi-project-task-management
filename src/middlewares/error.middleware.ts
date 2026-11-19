import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError';
import { formatZodIssues } from './validate.middleware';
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

  // Zod errors thrown anywhere other than the validate() middleware (which
  // answers them itself) get the same 400 shape instead of a 500.
  if (err instanceof ZodError) {
    res.status(400).json({
      status: 'fail',
      message: 'Validation error',
      errors: formatZodIssues(err),
    });
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

  // Mongoose ValidationError (e.g. a failed save) is a client error, not a 500.
  if (err.name === 'ValidationError') {
    res.status(400).json({ status: 'fail', message: err.message });
    return;
  }

  if (ENV.NODE_ENV === 'development') {
    res.status(500).json({ status: 'error', message: err.message, stack: err.stack });
  } else {
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
}
