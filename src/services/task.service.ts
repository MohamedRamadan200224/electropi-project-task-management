import { Task } from '../models/Task';
import { AppError } from '../utils/AppError';
import { assertProjectAccess } from './projectAccess';
import {
  listSkip,
  paginate,
  sortDirection,
  type ListQuery,
} from '../utils/pagination';
import { USER_PUBLIC_PROJECTION, type UserRole } from '../constants';
import type { CreateTaskInput, UpdateTaskInput } from '../validations/task.validation';

export async function createTask(
  projectId: string,
  data: CreateTaskInput,
  userId: string,
  role: UserRole,
) {
  await assertProjectAccess(projectId, userId, role);
  const task = await Task.create({ ...data, project: projectId, createdBy: userId });
  return task;
}

export async function listTasks(
  projectId: string,
  userId: string,
  role: UserRole,
  query: ListQuery,
) {
  await assertProjectAccess(projectId, userId, role);

  const filter: Record<string, unknown> = { project: projectId };
  if (query.status) filter['status'] = query.status;
  if (query.priority) filter['priority'] = query.priority;

  const [tasks, total] = await Promise.all([
    Task.find(filter)
      .sort({ [query.sortBy]: sortDirection(query.sortOrder) })
      .skip(listSkip(query))
      .limit(query.limit)
      .populate('assignedTo', USER_PUBLIC_PROJECTION)
      .populate('createdBy', USER_PUBLIC_PROJECTION),
    Task.countDocuments(filter),
  ]);

  return paginate(tasks, total, query);
}

export async function getTask(projectId: string, taskId: string, userId: string, role: UserRole) {
  await assertProjectAccess(projectId, userId, role);

  const task = await Task.findOne({ _id: taskId, project: projectId })
    .populate('assignedTo', USER_PUBLIC_PROJECTION)
    .populate('createdBy', USER_PUBLIC_PROJECTION);
  if (!task) throw new AppError('Task not found', 404);
  return task;
}

export async function updateTask(
  projectId: string,
  taskId: string,
  data: UpdateTaskInput,
  userId: string,
  role: UserRole,
) {
  await assertProjectAccess(projectId, userId, role);

  const task = await Task.findOne({ _id: taskId, project: projectId });
  if (!task) throw new AppError('Task not found', 404);

  // Explicit field assignment, not Object.assign: only the fields the
  // update schema allows are ever written, and Mongoose setters run.
  if (data.title !== undefined) task.title = data.title;
  if (data.description !== undefined) task.description = data.description;
  if (data.status !== undefined) task.status = data.status;
  if (data.priority !== undefined) task.priority = data.priority;
  // dueDate arrives as a validated ISO string; convert it explicitly.
  if (data.dueDate !== undefined) task.dueDate = new Date(data.dueDate);
  // assignedTo arrives as a string id; set() lets Mongoose cast it to an
  // ObjectId on save, exactly as the old Object.assign did (an invalid id
  // still fails as a CastError → 400, not a crash here).
  if (data.assignedTo !== undefined) task.set('assignedTo', data.assignedTo);

  await task.save();
  return task;
}

export async function deleteTask(
  projectId: string,
  taskId: string,
  userId: string,
  role: UserRole,
) {
  await assertProjectAccess(projectId, userId, role);

  const task = await Task.findOne({ _id: taskId, project: projectId });
  if (!task) throw new AppError('Task not found', 404);

  await task.deleteOne();
}
