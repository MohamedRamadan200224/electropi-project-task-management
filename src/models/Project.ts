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

// Perf P0: listProjects filters on owner / members / status with no index,
// so every project list was a collection scan. These indexes cover the
// filter used in listProjects (owner OR members, optional status) and the
// admin list (status only). The compound { owner, status } index also serves
// owner-only queries via its leftmost prefix.
projectSchema.index({ owner: 1 });
projectSchema.index({ members: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ owner: 1, status: 1 });

export const Project = model<IProject>('Project', projectSchema);
