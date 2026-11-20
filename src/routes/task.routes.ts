import { Router } from 'express';
import * as taskController from '../controllers/task.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createTaskSchema,
  updateTaskSchema,
  taskQuerySchema,
} from '../validations/task.validation';

// mergeParams: true so we get :projectId from the parent router
const router = Router({ mergeParams: true });

// Defence in depth: the parent project router already mounts this router
// under `authenticate`, but this router must not silently depend on that —
// mounted anywhere else, its endpoints would be unprotected. Running the
// middleware twice is harmless (it just re-verifies the token).
router.use(authenticate);

router.post('/', validate(createTaskSchema), taskController.createTask);
router.get('/', validate(taskQuerySchema), taskController.listTasks);
router.get('/:taskId', taskController.getTask);
router.patch('/:taskId', validate(updateTaskSchema), taskController.updateTask);
router.delete('/:taskId', taskController.deleteTask);

export default router;
