import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createScheduleSchema, updateScheduleSchema, getSchedulesQuerySchema } from '../validations/schedule.validation';
import { getSchedules, createSchedule, updateSchedule, deleteSchedule } from '../controllers/schedule.controller';

const router = Router();

// 🔒 모든 일정 라우터에 JWT 인증 미들웨어(도어락) 부착!
router.use(authenticate);

router.get('/', validate({ query: getSchedulesQuerySchema }), getSchedules as any);
router.post('/', validate({ body: createScheduleSchema }), createSchedule as any);
router.patch('/:id', validate({ body: updateScheduleSchema }), updateSchedule as any);
router.delete('/:id', deleteSchedule as any);

export default router;
