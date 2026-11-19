import { z } from 'zod';
import { TASK_STATUSES, TASK_PRIORITIES } from '../constants';

export const createTaskSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').trim(),
    description: z.string().optional().default(''),
    status: z.enum(TASK_STATUSES).optional().default('pending'),
    priority: z.enum(TASK_PRIORITIES).optional().default('medium'),
    dueDate: z.string().datetime({ offset: true }).optional(),
    assignedTo: z.string().optional(),
  }),
  params: z.object({ projectId: z.string() }),
});

export const updateTaskSchema = z.object({
  body: z.object({
    title: z.string().min(1).trim().optional(),
    description: z.string().optional(),
    status: z.enum(TASK_STATUSES).optional(),
    priority: z.enum(TASK_PRIORITIES).optional(),
    dueDate: z.string().datetime({ offset: true }).optional(),
    assignedTo: z.string().optional(),
  }),
  params: z.object({ projectId: z.string(), taskId: z.string() }),
});

export const taskQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().default('1'),
    limit: z.string().optional().default('10'),
    sortBy: z.string().optional().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
    status: z.enum(TASK_STATUSES).optional(),
    priority: z.enum(TASK_PRIORITIES).optional(),
  }),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>['body'];
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>['body'];
