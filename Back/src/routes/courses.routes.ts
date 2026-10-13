import { Router } from 'express';
import { getCourses } from '../controllers/course.controller';

const router = Router();
router.get('/', getCourses as any);

export default router;
