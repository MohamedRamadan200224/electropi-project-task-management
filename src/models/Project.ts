import { Schema, model, Document, Types } from 'mongoose';

export type ProjectStatus = 'active' | 'archived' | 'completed';

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
    status: { type: String, enum: ['active', 'archived', 'completed'], default: 'active' },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true },
);

export const Project = model<IProject>('Project', projectSchema);
