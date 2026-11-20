import { Types } from 'mongoose';
import { Project } from '../models/Project';
import { AppError } from '../utils/AppError';
import type { UserRole } from '../constants';
import type { IProject } from '../models/Project';

// A project reference as it appears in access checks: the owner may be a raw
// ObjectId (unpopulated) or a populated user document, and members may be
// ObjectIds or strings.
type ProjectMemberRef = Types.ObjectId | string | { _id: Types.ObjectId | string };

export interface ProjectAccessSubject {
  owner: ProjectMemberRef;
  members: ProjectMemberRef[];
}

function idOf(ref: ProjectMemberRef): string {
  if (typeof ref === 'object' && ref !== null && '_id' in ref) return String(ref._id);
  return String(ref);
}

// The single project access check for the whole API. It used to exist in
// three different shapes across the project and task services, with
// undocumented differences. The semantics, confirmed with the owner
// (2026-11-19), are:
// - admins bypass every ownership check;
// - any member of a project (owner included) may read it and may create,
//   update and delete TASKS inside it;
// - only the project owner (or an admin) may update or delete the PROJECT
//   itself — pass { requireOwner: 'update' | 'delete' } for that, which also
//   keeps the exact error message for each action.
export function checkProjectAccess(
  project: ProjectAccessSubject,
  userId: string,
  role: UserRole,
  options: { requireOwner?: 'update' | 'delete' } = {},
): void {
  if (role === 'admin') return;
  const ownerId = idOf(project.owner);
  const isMember = project.members.some((m) => idOf(m) === userId);
  if (ownerId !== userId && !isMember) throw new AppError('Forbidden', 403);
  if (options.requireOwner && ownerId !== userId) {
    throw new AppError(
      `Only the project owner or admin can ${options.requireOwner} this project`,
      403,
    );
  }
}

// Fetches the project (404 if missing) and runs the access check on it.
export async function assertProjectAccess(
  projectId: string,
  userId: string,
  role: UserRole,
  options: { requireOwner?: 'update' | 'delete' } = {},
): Promise<IProject> {
  const project = await Project.findById(projectId);
  if (!project) throw new AppError('Project not found', 404);
  checkProjectAccess(project, userId, role, options);
  return project;
}
