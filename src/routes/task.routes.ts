import { Router } from 'express';
import * as taskController from '../controllers/task.controller';
import { validate } from '../middlewares/validate.middleware';
import {
  createTaskSchema,
  updateTaskSchema,
  taskQuerySchema,
} from '../validations/task.validation';

// mergeParams: true so we get :projectId from the parent router
const router = Router({ mergeParams: true });

router.post('/', validate(createTaskSchema), taskController.createTask);
router.get('/', validate(taskQuerySchema), taskController.listTasks);
router.get('/:taskId', taskController.getTask);
router.patch('/:taskId', validate(updateTaskSchema), taskController.updateTask);
router.delete('/:taskId', taskController.deleteTask);

export default router;
