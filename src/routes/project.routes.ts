import { Router } from 'express';
import * as projectController from '../controllers/project.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createProjectSchema,
  updateProjectSchema,
  projectQuerySchema,
} from '../validations/project.validation';
import taskRouter from './task.routes';

const router = Router();

router.use(authenticate);

// Nest task routes under projects
router.use('/:projectId/tasks', taskRouter);

router.post('/', validate(createProjectSchema), projectController.createProject);
router.get('/', validate(projectQuerySchema), projectController.listProjects);
router.get('/:id', projectController.getProject);
router.patch('/:id', validate(updateProjectSchema), projectController.updateProject);
router.delete('/:id', projectController.deleteProject);

export default router;
