import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';

export interface JwtPayload {
  userId: string;
  role: 'admin' | 'member';
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, ENV.JWT_SECRET, { expiresIn: ENV.JWT_EXPIRES_IN } as jwt.SignOptions);
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, ENV.JWT_SECRET) as JwtPayload;
}
