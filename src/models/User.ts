import { Schema, model, Document } from 'mongoose';
import { ROLES } from '../constants';
import type { UserRole } from '../constants';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: [...ROLES], default: 'member' },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
  },
  { timestamps: true },
);

// Perf P0: password reset looks up users with
// findOne({ resetPasswordToken, resetPasswordExpires: { $gt: now } }),
// which scanned the whole users collection. This index serves that lookup.
// (email is already indexed via unique: true.)
userSchema.index({ resetPasswordToken: 1 });

export const User = model<IUser>('User', userSchema);
