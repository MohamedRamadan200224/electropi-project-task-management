import { z } from 'zod';
import { PROJECT_STATUSES } from '../constants';

export const createProjectSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').trim(),
    description: z.string().optional().default(''),
    status: z.enum(PROJECT_STATUSES).optional().default('active'),
  }),
});

export const updateProjectSchema = z.object({
  body: z.object({
    title: z.string().min(1).trim().optional(),
    description: z.string().optional(),
    status: z.enum(PROJECT_STATUSES).optional(),
  }),
  params: z.object({ id: z.string() }),
});

export const projectQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().default('1'),
    limit: z.string().optional().default('10'),
    sortBy: z.string().optional().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
    status: z.enum(PROJECT_STATUSES).optional(),
  }),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>['body'];
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>['body'];
