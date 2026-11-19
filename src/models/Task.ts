import { Schema, model, Document, Types } from 'mongoose';
import { TASK_STATUSES, TASK_PRIORITIES } from '../constants';
import type { TaskStatus, TaskPriority } from '../constants';

// Re-exported so existing imports from the model keep working; the values
// themselves live in src/constants (single source of truth).
export type { TaskStatus, TaskPriority };

export interface ITask extends Document {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date;
  project: Types.ObjectId;
  assignedTo?: Types.ObjectId;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    status: { type: String, enum: [...TASK_STATUSES], default: 'pending' },
    priority: { type: String, enum: [...TASK_PRIORITIES], default: 'medium' },
    dueDate: { type: Date },
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

taskSchema.index({ project: 1, status: 1 });
taskSchema.index({ project: 1, priority: 1 });

export const Task = model<ITask>('Task', taskSchema);
