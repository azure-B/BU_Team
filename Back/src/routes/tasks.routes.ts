import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { optionalAuthenticate } from '../middlewares/optional-auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createTaskSchema, updateTaskSchema } from '../validations/task.validation';
import { getTasks, createTask, updateTask, deleteTask, getPrioritizedTasks } from '../controllers/task.controller';

const router = Router();

// 조회는 LMS 데모용으로 토큰 없이도 mocked_user_id 과제를 본다.
router.get('/', optionalAuthenticate, getTasks as any);
router.get('/today/recommendations', optionalAuthenticate, getPrioritizedTasks as any);

router.use(authenticate);
router.post('/', validate({ body: createTaskSchema }), createTask as any);
router.patch('/:id', validate({ body: updateTaskSchema }), updateTask as any);
router.delete('/:id', deleteTask as any);

export default router;
