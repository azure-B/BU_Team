import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createTaskSchema, updateTaskSchema } from '../validations/task.validation';
import { getTasks, createTask, updateTask, deleteTask, getPrioritizedTasks } from '../controllers/task.controller';

const router = Router();

// 🔒 모든 과제 라우터에 JWT 인증 미들웨어(도어락) 부착!
router.use(authenticate);

router.get('/', getTasks as any);
router.get('/today/recommendations', getPrioritizedTasks as any);
router.post('/', validate({ body: createTaskSchema }), createTask as any);
router.patch('/:id', validate({ body: updateTaskSchema }), updateTask as any);
router.delete('/:id', deleteTask as any);

export default router;
