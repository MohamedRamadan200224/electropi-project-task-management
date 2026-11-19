import type { NextFunction, Request, RequestHandler, Response } from 'express';

// Wraps a handler so async errors go to the error middleware instead of
// crashing the process. Every controller handler is wrapped with this, so
// no handler needs its own identical try/catch + next(err) boilerplate.
// Sync handlers work too — a thrown error is still caught.
type Handler = (req: Request, res: Response, next: NextFunction) => void | Promise<void>;

export function asyncHandler(handler: Handler): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}
