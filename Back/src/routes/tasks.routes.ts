import { Router } from 'express';
import { getTasks, createTask, updateTask, deleteTask, getPrioritizedTasks } from '../controllers/task.controller';

const router = Router();
router.get('/', getTasks as any);
router.post('/', createTask as any);
router.patch('/:id', updateTask as any);
router.delete('/:id', deleteTask as any);
router.get('/today/recommendations', getPrioritizedTasks as any);

export default router;
