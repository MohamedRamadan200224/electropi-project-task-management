import { asyncHandler } from '../utils/asyncHandler';
import { requireAuthUser } from '../middlewares/auth.middleware';
import * as projectService from '../services/project.service';

export const createProject = asyncHandler(async (req, res) => {
  const user = requireAuthUser(req);
  const project = await projectService.createProject(req.body, user.userId);
  res.status(201).json({ status: 'success', data: project });
});

export const listProjects = asyncHandler(async (req, res) => {
    const user = requireAuthUser(req);
    // req.query is already validated and coerced by validate(projectQuerySchema):
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
    const allowedSortBy = ['createdAt', 'updatedAt', 'title', 'status'] as const;
    const sortBy =
      typeof q['sortBy'] === 'string' && (allowedSortBy as readonly string[]).includes(q['sortBy'])
        ? q['sortBy']
        : 'createdAt';
      const result = await projectService.listProjects(user.userId, user.role, {
      page,
      limit,
      sortBy,
      sortOrder: q['sortOrder'] === 'asc' ? 'asc' : 'desc',
      status: typeof q['status'] === 'string' ? q['status'] : undefined,
    });
    res.status(200).json({ status: 'success', ...result });
});  

export const getProject = asyncHandler(async (req, res) => {
  const user = requireAuthUser(req);
  const project = await projectService.getProject(String(req.params['id']), user.userId, user.role);
  res.status(200).json({ status: 'success', data: project });
});

export const updateProject = asyncHandler(async (req, res) => {
  const user = requireAuthUser(req);
  const project = await projectService.updateProject(
    String(req.params['id']),
    req.body,
    user.userId,
    user.role,
  );
  res.status(200).json({ status: 'success', data: project });
});

export const deleteProject = asyncHandler(async (req, res) => {
  const user = requireAuthUser(req);
  await projectService.deleteProject(String(req.params['id']), user.userId, user.role);
  res.status(204).send();
});
