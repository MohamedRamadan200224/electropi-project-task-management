import type { JwtPayload } from '../utils/jwt';

// Augments Express's Request with the authenticated user set by the
// `authenticate` middleware. Kept in its own file — it used to live inside
// a middleware file, where nobody would think to look for a type.
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export {};
