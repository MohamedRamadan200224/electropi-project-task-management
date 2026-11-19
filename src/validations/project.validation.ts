import { z } from 'zod';

export const createProjectSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').trim(),
    description: z.string().optional().default(''),
    status: z.enum(['active', 'archived', 'completed']).optional().default('active'),
  }),
});

export const updateProjectSchema = z.object({
  body: z.object({
    title: z.string().min(1).trim().optional(),
    description: z.string().optional(),
    status: z.enum(['active', 'archived', 'completed']).optional(),
  }),
  params: z.object({ id: z.string() }),
});

export const projectQuerySchema = z.object({
  query: z.object({
    // Perf P0: page/limit were raw strings parsed with parseInt in the
    // controller, so ?page=abc produced NaN and a broken skip/limit.
    // Coerce to numbers here: non-numeric input (NaN) and non-integers fail
    // validation with a 400, and limit is capped at 100. Defaults match the
    // previous behaviour (page 1, limit 10).
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(10),
    // Perf P0: sortBy was any client-supplied string passed straight into
    // .sort(), i.e. sorting on an unindexed / non-existent field. Allowlist
    // only fields that exist on Project — 'priority' is NOT a Project field,
    // so it is deliberately excluded here (it is allowed for tasks).
    sortBy: z.enum(['createdAt', 'updatedAt', 'title', 'status']).optional().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
    status: z.enum(['active', 'archived', 'completed']).optional(),
  }),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>['body'];
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>['body'];
export type ProjectQueryInput = z.infer<typeof projectQuerySchema>['query'];
