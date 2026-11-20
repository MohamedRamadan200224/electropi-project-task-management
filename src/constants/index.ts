// Single source of truth for the enum values used across the codebase.
// Add a value here and it flows everywhere — Mongoose schema enums, Zod
// validation enums, and the TypeScript types are all derived from these
// tuples, so the allowed values can no longer drift between files.

export const PROJECT_STATUSES = ['active', 'archived', 'completed'] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const TASK_STATUSES = ['pending', 'in_progress', 'done'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ['low', 'medium', 'high'] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const ROLES = ['admin', 'member'] as const;
export type UserRole = (typeof ROLES)[number];

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value);
}

// bcrypt cost factor, used by the auth service and the seed script.
export const BCRYPT_ROUNDS = 12;

// Fields projected when populating a user reference on project/task lists
// ('name email' was copy-pasted in six populate calls).
export const USER_PUBLIC_PROJECTION = 'name email';
