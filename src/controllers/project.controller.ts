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
  const q = req.query as Record<string, string>;
  const result = await projectService.listProjects(user.userId, user.role, {
    page: parseInt(q['page'] ?? '1', 10),
    limit: Math.min(parseInt(q['limit'] ?? '10', 10), 100),
    sortBy: q['sortBy'] ?? 'createdAt',
    sortOrder: (q['sortOrder'] as 'asc' | 'desc') ?? 'desc',
    status: q['status'],
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
