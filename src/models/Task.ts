import { Schema, model, Document, Types } from 'mongoose';

export type TaskStatus = 'pending' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

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
    status: { type: String, enum: ['pending', 'in_progress', 'done'], default: 'pending' },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
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
