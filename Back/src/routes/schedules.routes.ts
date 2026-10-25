import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { optionalAuthenticate } from '../middlewares/optional-auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createScheduleSchema, updateScheduleSchema, getSchedulesQuerySchema } from '../validations/schedule.validation';
import {
  getSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getScheduleTasks,
} from '../controllers/schedule.controller';

const router = Router();

// 조회는 LMS 연동 가정용으로 토큰 없이도 이승빈(mocked_user_id) 일정·연계 과제를 본다.
router.get('/', optionalAuthenticate, validate({ query: getSchedulesQuerySchema }), getSchedules as any);
router.get('/:id/tasks', optionalAuthenticate, getScheduleTasks as any);

router.use(authenticate);
router.post('/', validate({ body: createScheduleSchema }), createSchedule as any);
router.patch('/:id', validate({ body: updateScheduleSchema }), updateSchedule as any);
router.delete('/:id', deleteSchedule as any);

export default router;
