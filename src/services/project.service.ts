import { Project } from '../models/Project';
import { AppError } from '../utils/AppError';
import type { CreateProjectInput, UpdateProjectInput } from '../validations/project.validation';

interface ListQuery {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  status?: string;
}

export async function createProject(data: CreateProjectInput, userId: string) {
  const project = await Project.create({ ...data, owner: userId, members: [userId] });
  return project;
}

export async function listProjects(userId: string, role: string, query: ListQuery) {
  const filter: Record<string, unknown> =
    role === 'admin' ? {} : { $or: [{ owner: userId }, { members: userId }] };

  if (query.status) filter['status'] = query.status;

  const skip = (query.page - 1) * query.limit;
  const sortDir = query.sortOrder === 'asc' ? 1 : -1;

  const [projects, total] = await Promise.all([
    Project.find(filter)
      .sort({ [query.sortBy]: sortDir })
      .skip(skip)
      .limit(query.limit)
      .populate('owner', 'name email'),
    Project.countDocuments(filter),
  ]);

  return {
    data: projects,
    pagination: { total, page: query.page, limit: query.limit, pages: Math.ceil(total / query.limit) },
  };
}

export async function getProject(projectId: string, userId: string, role: string) {
  const project = await Project.findById(projectId).populate('owner', 'name email');
  if (!project) throw new AppError('Project not found', 404);

  if (role !== 'admin') {
    const ownerId = String(project.owner._id ?? project.owner);
    const isMember = project.members.some((m) => String(m) === userId);
    if (ownerId !== userId && !isMember) throw new AppError('Forbidden', 403);
  }
  return project;
}

export async function updateProject(
  projectId: string,
  data: UpdateProjectInput,
  userId: string,
  role: string,
) {
  const project = await Project.findById(projectId);
  if (!project) throw new AppError('Project not found', 404);

  if (role !== 'admin' && String(project.owner) !== userId) {
    throw new AppError('Only the project owner or admin can update this project', 403);
  }

  Object.assign(project, data);
  await project.save();
  return project;
}

export async function deleteProject(projectId: string, userId: string, role: string) {
  const project = await Project.findById(projectId);
  if (!project) throw new AppError('Project not found', 404);

  if (role !== 'admin' && String(project.owner) !== userId) {
    throw new AppError('Only the project owner or admin can delete this project', 403);
  }

  await project.deleteOne();
}
