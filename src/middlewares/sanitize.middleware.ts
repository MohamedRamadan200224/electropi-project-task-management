import { Request, Response, NextFunction } from 'express';

/**
 * Recursively strips keys that could be interpreted as MongoDB query operators
 * (those starting with `$` or containing `.`) to block NoSQL operator injection.
 * Mutates the object in place and returns it.
 */
function sanitize<T>(value: T): T {
  if (Array.isArray(value)) {
    value.forEach(sanitize);
    return value;
  }
  if (value && typeof value === 'object') {
    for (const key of Object.keys(value as Record<string, unknown>)) {
      if (key.startsWith('$') || key.includes('.')) {
        delete (value as Record<string, unknown>)[key];
      } else {
        sanitize((value as Record<string, unknown>)[key]);
      }
    }
  }
  return value;
}

/**
 * Express 5–safe replacement for `express-mongo-sanitize`.
 *
 * In Express 5 `req.query` is a getter-only property, so it cannot be
 * reassigned (which is why `express-mongo-sanitize` throws). We sanitize
 * `req.body` and `req.params` in place, and shadow `req.query` with a cleaned
 * object via `Object.defineProperty`.
 */
export function mongoSanitize(req: Request, _res: Response, next: NextFunction): void {
  if (req.body) sanitize(req.body);
  if (req.params) sanitize(req.params);

  if (req.query) {
    const cleanedQuery = sanitize({ ...req.query });
    Object.defineProperty(req, 'query', {
      value: cleanedQuery,
      writable: true,
      configurable: true,
      enumerable: true,
    });
  }

  next();
}
