import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import { AppError } from '../utils/AppError';
import { isUserRole } from '../constants';
import type { UserRole } from '../constants';

export interface JwtPayload {
  userId: string;
  role: UserRole;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, ENV.JWT_SECRET, { expiresIn: ENV.JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, ENV.JWT_SECRET);
  // jwt.verify returns string | JwtPayload — never trust a cast here: a
  // token with a string payload would otherwise pass as JwtPayload and
  // break req.user.userId at runtime. Validate the shape instead.
  if (typeof decoded !== 'object' || decoded === null) {
    throw new AppError('Invalid token payload', 401);
  }
  const { userId, role } = decoded as Partial<JwtPayload>;
  if (typeof userId !== 'string' || !isUserRole(role)) {
    throw new AppError('Invalid token payload', 401);
  }
  return { userId, role };
}
