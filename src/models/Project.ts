import { Schema, model, Document, Types } from 'mongoose';
import { PROJECT_STATUSES } from '../constants';
import type { ProjectStatus } from '../constants';

// Re-exported so existing imports from the model keep working; the value
// itself lives in src/constants (single source of truth).
export type { ProjectStatus };

export interface IProject extends Document {
  title: string;
  description: string;
  status: ProjectStatus;
  owner: Types.ObjectId;
  members: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<IProject>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    status: { type: String, enum: [...PROJECT_STATUSES], default: 'active' },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true },
);

export const Project = model<IProject>('Project', projectSchema);
