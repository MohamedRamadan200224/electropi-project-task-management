import { asyncHandler } from '../utils/asyncHandler';
import { requireAuthUser } from '../middlewares/auth.middleware';
import * as authService from '../services/auth.service';

export const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  res.status(201).json({ status: 'success', data: result });
});

export const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  res.status(200).json({ status: 'success', data: result });
});

export const getMe = asyncHandler(async (req, res) => {
  const user = requireAuthUser(req);
  // Same user shape as register/login ({ id, name, email, role }) — the old
  // version returned the raw JWT payload ({ userId, role, iat, exp }).
  const currentUser = await authService.getCurrentUser(user.userId);
  res.status(200).json({ status: 'success', data: { user: currentUser } });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  await authService.forgotPassword(req.body.email);
  // Always respond with 200 regardless of whether email exists — prevents enumeration
  res.status(200).json({
    status: 'success',
    message: 'If that email is registered, a password reset link has been sent.',
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(String(req.params['token']), req.body.password);
  res.status(200).json({ status: 'success', message: 'Password reset successfully. You can now log in.' });
});
