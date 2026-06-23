import { Task } from '../models/Task';
import { Project } from '../models/Project';
import { AppError } from '../utils/AppError';
import type { CreateTaskInput, UpdateTaskInput } from '../validations/task.validation';

interface ListQuery {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  status?: string;
  priority?: string;
}

async function assertProjectAccess(projectId: string, userId: string, role: string) {
  const project = await Project.findById(projectId);
  if (!project) throw new AppError('Project not found', 404);

  if (role !== 'admin') {
    const ownerId = String(project.owner);
    const isMember = project.members.some((m) => String(m) === userId);
    if (ownerId !== userId && !isMember) throw new AppError('Forbidden', 403);
  }
  return project;
}

export async function createTask(
  projectId: string,
  data: CreateTaskInput,
  userId: string,
  role: string,
) {
  await assertProjectAccess(projectId, userId, role);
  const task = await Task.create({ ...data, project: projectId, createdBy: userId });
  return task;
}

export async function listTasks(
  projectId: string,
  userId: string,
  role: string,
  query: ListQuery,
) {
  await assertProjectAccess(projectId, userId, role);

  const filter: Record<string, unknown> = { project: projectId };
  if (query.status) filter['status'] = query.status;
  if (query.priority) filter['priority'] = query.priority;

  const skip = (query.page - 1) * query.limit;
  const sortDir = query.sortOrder === 'asc' ? 1 : -1;

  const [tasks, total] = await Promise.all([
    Task.find(filter)
      .sort({ [query.sortBy]: sortDir })
      .skip(skip)
      .limit(query.limit)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email'),
    Task.countDocuments(filter),
  ]);

  return {
    data: tasks,
    pagination: { total, page: query.page, limit: query.limit, pages: Math.ceil(total / query.limit) },
  };
}

export async function getTask(projectId: string, taskId: string, userId: string, role: string) {
  await assertProjectAccess(projectId, userId, role);

  const task = await Task.findOne({ _id: taskId, project: projectId })
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email');
  if (!task) throw new AppError('Task not found', 404);
  return task;
}

export async function updateTask(
  projectId: string,
  taskId: string,
  data: UpdateTaskInput,
  userId: string,
  role: string,
) {
  await assertProjectAccess(projectId, userId, role);

  const task = await Task.findOne({ _id: taskId, project: projectId });
  if (!task) throw new AppError('Task not found', 404);

  Object.assign(task, data);
  await task.save();
  return task;
}

export async function deleteTask(
  projectId: string,
  taskId: string,
  userId: string,
  role: string,
) {
  await assertProjectAccess(projectId, userId, role);

  const task = await Task.findOne({ _id: taskId, project: projectId });
  if (!task) throw new AppError('Task not found', 404);

  await task.deleteOne();
}
