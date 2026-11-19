import { z } from 'zod';

export const createTaskSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').trim(),
    description: z.string().optional().default(''),
    status: z.enum(['pending', 'in_progress', 'done']).optional().default('pending'),
    priority: z.enum(['low', 'medium', 'high']).optional().default('medium'),
    dueDate: z.string().datetime({ offset: true }).optional(),
    assignedTo: z.string().optional(),
  }),
  params: z.object({ projectId: z.string() }),
});

export const updateTaskSchema = z.object({
  body: z.object({
    title: z.string().min(1).trim().optional(),
    description: z.string().optional(),
    status: z.enum(['pending', 'in_progress', 'done']).optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
    dueDate: z.string().datetime({ offset: true }).optional(),
    assignedTo: z.string().optional(),
  }),
  params: z.object({ projectId: z.string(), taskId: z.string() }),
});

export const taskQuerySchema = z.object({
  query: z.object({
    // Perf P0: page/limit were raw strings parsed with parseInt in the
    // controller, so ?page=abc produced NaN and a broken skip/limit.
    // Coerce to numbers here: non-numeric input (NaN) and non-integers fail
    // validation with a 400, and limit is capped at 100. Defaults match the
    // previous behaviour (page 1, limit 10).
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(10),
    // Perf P0: sortBy was any client-supplied string passed straight into
    // .sort(). Allowlist only fields that exist on Task. 'dueDate' also
    // exists and now has an index ({ project, dueDate }), but it was kept
    // out of this allowlist per the P0 scope — it can be added later.
    sortBy: z.enum(['createdAt', 'updatedAt', 'title', 'status', 'priority']).optional().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
    status: z.enum(['pending', 'in_progress', 'done']).optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
  }),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>['body'];
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>['body'];
export type TaskQueryInput = z.infer<typeof taskQuerySchema>['query'];
