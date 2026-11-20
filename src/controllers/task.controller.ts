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
    // req.query is already validated and coerced by validate(taskQuerySchema):
    // page/limit arrive as numbers (min 1, limit max 100) and sortBy is
    // allowlisted. The guards below are defence-in-depth only, so a request
    // that ever reaches this handler without validation (e.g. a future route
    // change) can still never produce a NaN skip/limit or an arbitrary sort.
    // parseInt was removed: it turned ?page=abc into NaN.
    const q = req.query as unknown as Record<string, unknown>;
    const rawPage = Number(q['page']);
    const page = Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : 1;
    const rawLimit = Number(q['limit']);
    const limit = Number.isFinite(rawLimit) && rawLimit >= 1 ? Math.min(Math.floor(rawLimit), 100) : 10;
    const allowedSortBy = ['createdAt', 'updatedAt', 'title', 'status', 'priority'] as const;
    const sortBy =
      typeof q['sortBy'] === 'string' && (allowedSortBy as readonly string[]).includes(q['sortBy'])
        ? q['sortBy']
        : 'createdAt';
    const result = await taskService.listTasks(
      String(req.params['projectId']),
          user.userId,
          user.role,
      {
        page,
        limit,
        sortBy,
        sortOrder: q['sortOrder'] === 'asc' ? 'asc' : 'desc',
        status: typeof q['status'] === 'string' ? q['status'] : undefined,
        priority: typeof q['priority'] === 'string' ? q['priority'] : undefined,
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
