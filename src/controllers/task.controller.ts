import { Request, Response, NextFunction } from 'express';
import * as taskService from '../services/task.service';

export async function createTask(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const task = await taskService.createTask(
      String(req.params['projectId']),
      req.body,
      req.user!.userId,
      req.user!.role,
    );
    res.status(201).json({ status: 'success', data: task });
  } catch (err) {
    next(err);
  }
}

export async function listTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const q = req.query as Record<string, string>;
    const result = await taskService.listTasks(
      String(req.params['projectId']),
      req.user!.userId,
      req.user!.role,
      {
        page: parseInt(q['page'] ?? '1', 10),
        limit: Math.min(parseInt(q['limit'] ?? '10', 10), 100),
        sortBy: q['sortBy'] ?? 'createdAt',
        sortOrder: (q['sortOrder'] as 'asc' | 'desc') ?? 'desc',
        status: q['status'],
        priority: q['priority'],
      },
    );
    res.status(200).json({ status: 'success', ...result });
  } catch (err) {
    next(err);
  }
}

export async function getTask(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const task = await taskService.getTask(
      String(req.params['projectId']),
      String(req.params['taskId']),
      req.user!.userId,
      req.user!.role,
    );
    res.status(200).json({ status: 'success', data: task });
  } catch (err) {
    next(err);
  }
}

export async function updateTask(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const task = await taskService.updateTask(
      String(req.params['projectId']),
      String(req.params['taskId']),
      req.body,
      req.user!.userId,
      req.user!.role,
    );
    res.status(200).json({ status: 'success', data: task });
  } catch (err) {
    next(err);
  }
}

export async function deleteTask(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await taskService.deleteTask(
      String(req.params['projectId']),
      String(req.params['taskId']),
      req.user!.userId,
      req.user!.role,
    );
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
