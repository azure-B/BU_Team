import { Router } from 'express';
import { getSchedules, createSchedule, updateSchedule, deleteSchedule } from '../controllers/schedule.controller';

const router = Router();
router.get('/', getSchedules as any);
router.post('/', createSchedule as any);
router.patch('/:id', updateSchedule as any);
router.delete('/:id', deleteSchedule as any);

export default router;
