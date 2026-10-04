import { Router } from 'express';
import { getSchedules, createSchedule } from '../controllers/schedule.controller';

const router = Router();
router.get('/', getSchedules as any);
router.post('/', createSchedule as any);

export default router;
