import { asyncHandler } from '../utils/asyncHandler';
import { requireAuthUser } from '../middlewares/auth.middleware';
import * as taskService from '../services/task.service';

export const createTask = asyncHandler(async (req, res) => {
  const user = requireAuthUser(req);
  const task = await taskService.createTask(
    String(req.params['projectId']),
    req.body,
    user.userId,
    user.role,
  );
  res.status(201).json({ status: 'success', data: task });
});

export const listTasks = asyncHandler(async (req, res) => {
  const user = requireAuthUser(req);
  const q = req.query as Record<string, string>;
  const result = await taskService.listTasks(
    String(req.params['projectId']),
    user.userId,
    user.role,
    {
      page: parseInt(q['page'] ?? '1', 10),
      limit: Math.min(parseInt(q['limit'] ?? '10', 10), 100),
      sortBy: q['sortBy'] ?? 'createdAt',
      sortOrder: (q['sortOrder'] as 'asc' | 'desc') ?? 'desc',
      status: q['status'],
      priority: q['priority'],
    },
  );
  res.status(200).json({ status: 'success', ...result });
});

export const getTask = asyncHandler(async (req, res) => {
  const user = requireAuthUser(req);
  const task = await taskService.getTask(
    String(req.params['projectId']),
    String(req.params['taskId']),
    user.userId,
    user.role,
  );
  res.status(200).json({ status: 'success', data: task });
});

export const updateTask = asyncHandler(async (req, res) => {
  const user = requireAuthUser(req);
  const task = await taskService.updateTask(
    String(req.params['projectId']),
    String(req.params['taskId']),
    req.body,
    user.userId,
    user.role,
  );
  res.status(200).json({ status: 'success', data: task });
});

export const deleteTask = asyncHandler(async (req, res) => {
  const user = requireAuthUser(req);
  await taskService.deleteTask(
    String(req.params['projectId']),
    String(req.params['taskId']),
    user.userId,
    user.role,
  );
  res.status(204).send();
});
