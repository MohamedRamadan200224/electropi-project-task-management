import { Project } from '../models/Project';
import { AppError } from '../utils/AppError';
import { assertProjectAccess, checkProjectAccess } from './projectAccess';
import {
  listSkip,
  paginate,
  sortDirection,
  type ListQuery,
} from '../utils/pagination';
import { USER_PUBLIC_PROJECTION, type UserRole } from '../constants';
import type { CreateProjectInput, UpdateProjectInput } from '../validations/project.validation';

export async function createProject(data: CreateProjectInput, userId: string) {
  const project = await Project.create({ ...data, owner: userId, members: [userId] });
  return project;
}

export async function listProjects(userId: string, role: UserRole, query: ListQuery) {
  const filter: Record<string, unknown> =
    role === 'admin' ? {} : { $or: [{ owner: userId }, { members: userId }] };

  if (query.status) filter['status'] = query.status;

  const [projects, total] = await Promise.all([
    Project.find(filter)
      .sort({ [query.sortBy]: sortDirection(query.sortOrder) })
      .skip(listSkip(query))
      .limit(query.limit)
      .populate('owner', USER_PUBLIC_PROJECTION),
    Project.countDocuments(filter),
  ]);

  return paginate(projects, total, query);
}

export async function getProject(projectId: string, userId: string, role: UserRole) {
  const project = await Project.findById(projectId).populate('owner', USER_PUBLIC_PROJECTION);
  if (!project) throw new AppError('Project not found', 404);

  // The owner is populated here, so the check takes the fetched project
  // instead of re-fetching it.
  checkProjectAccess(project, userId, role);
  return project;
}

export async function updateProject(
  projectId: string,
  data: UpdateProjectInput,
  userId: string,
  role: UserRole,
) {
  // Members may manage tasks in a project, but only the owner (or an admin)
  // may update the project itself.
  const project = await assertProjectAccess(projectId, userId, role, { requireOwner: 'update' });

  // Explicit field assignment, not Object.assign: only the fields the
  // update schema allows are ever written, and Mongoose setters run.
  if (data.title !== undefined) project.title = data.title;
  if (data.description !== undefined) project.description = data.description;
  if (data.status !== undefined) project.status = data.status;

  await project.save();
  return project;
}

export async function deleteProject(projectId: string, userId: string, role: UserRole) {
  const project = await assertProjectAccess(projectId, userId, role, { requireOwner: 'delete' });
  await project.deleteOne();
}
