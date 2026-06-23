import { Request, Response, NextFunction } from 'express';
import * as projectService from '../services/project.service';

export async function createProject(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const project = await projectService.createProject(req.body, req.user!.userId);
    res.status(201).json({ status: 'success', data: project });
  } catch (err) {
    next(err);
  }
}

export async function listProjects(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const q = req.query as Record<string, string>;
    const result = await projectService.listProjects(req.user!.userId, req.user!.role, {
      page: parseInt(q['page'] ?? '1', 10),
      limit: Math.min(parseInt(q['limit'] ?? '10', 10), 100),
      sortBy: q['sortBy'] ?? 'createdAt',
      sortOrder: (q['sortOrder'] as 'asc' | 'desc') ?? 'desc',
      status: q['status'],
    });
    res.status(200).json({ status: 'success', ...result });
  } catch (err) {
    next(err);
  }
}

export async function getProject(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const project = await projectService.getProject(String(req.params['id']), req.user!.userId, req.user!.role);
    res.status(200).json({ status: 'success', data: project });
  } catch (err) {
    next(err);
  }
}

export async function updateProject(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const project = await projectService.updateProject(
      String(req.params['id']),
      req.body,
      req.user!.userId,
      req.user!.role,
    );
    res.status(200).json({ status: 'success', data: project });
  } catch (err) {
    next(err);
  }
}

export async function deleteProject(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await projectService.deleteProject(String(req.params['id']), req.user!.userId, req.user!.role);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
