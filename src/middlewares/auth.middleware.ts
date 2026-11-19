import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt';
import { AppError } from '../utils/AppError';

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

// Returns the authenticated user, or throws 401. Controllers use this
// instead of `req.user!` so an unauthenticated request can never slip
// through with an undefined user. (The `authenticate` middleware already
// rejects missing tokens; this is the type-level guarantee on top of it.)
export function requireAuthUser(req: Request): JwtPayload {
  if (!req.user) throw new AppError('No token provided', 401);
  return req.user;
}
