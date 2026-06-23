import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Parse and write the cleaned result back, so downstream handlers only
      // ever see validated data with unknown keys stripped (defense in depth).
      const parsed = schema.parse({ body: req.body, params: req.params, query: req.query }) as {
        body?: unknown;
        params?: unknown;
        query?: unknown;
      };
      if (parsed.body !== undefined) req.body = parsed.body;
      if (parsed.params !== undefined) req.params = parsed.params as Request['params'];
      // req.query is a getter-only property in Express 5, so it must be redefined
      // rather than assigned.
      if (parsed.query !== undefined) {
        Object.defineProperty(req, 'query', {
          value: parsed.query,
          writable: true,
          configurable: true,
          enumerable: true,
        });
      }
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(400).json({
          status: 'fail',
          message: 'Validation error',
          errors: err.issues.map((e) => ({ field: e.path.join('.'), message: e.message })),
        });
        return;
      }
      next(err);
    }
  };
}
