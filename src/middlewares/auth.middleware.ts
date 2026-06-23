import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt';
import { AppError } from '../utils/AppError';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new AppError('No token provided', 401));
  }
  const token = authHeader.split(' ')[1];
  if (!token) {
    return next(new AppError('No token provided', 401));
  }
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    next(new AppError('Invalid or expired token', 401));
  }
}

export function authorize(...roles: Array<'admin' | 'member'>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('Forbidden: insufficient permissions', 403));
    }
    next();
  };
}
