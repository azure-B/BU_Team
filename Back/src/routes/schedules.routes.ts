import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { getSchedules, createSchedule, updateSchedule, deleteSchedule } from '../controllers/schedule.controller';

const router = Router();

// 🔒 모든 일정 라우터에 JWT 인증 미들웨어(도어락) 부착!
router.use(authenticate);

router.get('/', getSchedules as any);
router.post('/', createSchedule as any);
router.patch('/:id', updateSchedule as any);
router.delete('/:id', deleteSchedule as any);

export default router;
