import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import type { IUser } from '../models/User';
import { signToken } from '../utils/jwt';
import { AppError } from '../utils/AppError';
import { sendPasswordResetEmail, sendPasswordResetSuccessEmail } from '../utils/email';
import { ENV } from '../config/env';
import { BCRYPT_ROUNDS } from '../constants';
import type { RegisterInput, LoginInput } from '../validations/auth.validation';

// The public user shape every auth endpoint returns — register, login and
// getMe all use this, so a client can rely on one shape.
type PublicUser = { id: IUser['_id']; name: string; email: string; role: IUser['role'] };

function toPublicUser(user: Pick<IUser, '_id' | 'name' | 'email' | 'role'>): PublicUser {
  return { id: user._id, name: user.name, email: user.email, role: user.role };
}

function toAuthResponse(user: Pick<IUser, '_id' | 'name' | 'email' | 'role'>) {
  return {
    token: signToken({ userId: String(user._id), role: user.role }),
    user: toPublicUser(user),
  };
}

function hashResetToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

export async function register(data: RegisterInput) {
  const exists = await User.findOne({ email: data.email });
  if (exists) throw new AppError('Email already in use', 409);

  const hashed = await bcrypt.hash(data.password, BCRYPT_ROUNDS);
  // Only name/email/password are accepted; role is intentionally never taken
  // from user input — it defaults to 'member' (see User schema). The admin
  // account is provisioned exclusively via the seed script.
  const user = await User.create({ name: data.name, email: data.email, password: hashed });

  return toAuthResponse(user);
}

export async function login(data: LoginInput) {
  const user = await User.findOne({ email: data.email }).select('+password');
  if (!user) throw new AppError('Invalid email or password', 401);

  const valid = await bcrypt.compare(data.password, user.password);
  if (!valid) throw new AppError('Invalid email or password', 401);

  return toAuthResponse(user);
}

export async function getCurrentUser(userId: string): Promise<PublicUser> {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);
  return toPublicUser(user);
}

export async function forgotPassword(email: string): Promise<void> {
  const user = await User.findOne({ email });

  // Always return silently — prevents email enumeration
  if (!user) return;

  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = hashResetToken(rawToken);
  const expiresAt = new Date(Date.now() + ENV.RESET_TOKEN_EXPIRES_MINUTES * 60 * 1000);

  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = expiresAt;
  await user.save();

  await sendPasswordResetEmail(user.email, user.name, rawToken);
}

export async function resetPassword(rawToken: string, newPassword: string): Promise<void> {
  const hashedToken = hashResetToken(rawToken);

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: new Date() },
  }).select('+resetPasswordToken +resetPasswordExpires');

  if (!user) throw new AppError('Reset token is invalid or has expired', 400);

  user.password = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  await sendPasswordResetSuccessEmail(user.email, user.name);
}
