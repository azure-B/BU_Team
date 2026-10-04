import { Router } from 'express';
import { getTasks, createTask, getPrioritizedTasks } from '../controllers/task.controller';

const router = Router();
router.get('/', getTasks as any);
router.post('/', createTask as any);
router.get('/today/recommendations', getPrioritizedTasks as any);

export default router;
