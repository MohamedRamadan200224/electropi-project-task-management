import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await authService.register(req.body);
    res.status(201).json({ status: 'success', data: result });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await authService.login(req.body);
    res.status(200).json({ status: 'success', data: result });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req: Request, res: Response): Promise<void> {
  res.status(200).json({ status: 'success', data: { user: req.user } });
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await authService.forgotPassword(req.body.email);
    // Always respond with 200 regardless of whether email exists — prevents enumeration
    res.status(200).json({
      status: 'success',
      message: 'If that email is registered, a password reset link has been sent.',
    });
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await authService.resetPassword(String(req.params['token']), req.body.password);
    res.status(200).json({ status: 'success', message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    next(err);
  }
}
