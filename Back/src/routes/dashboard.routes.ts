import { Router } from 'express';
import { getDashboard } from '../controllers/dashboard.controller';

const router = Router();
router.get('/today', getDashboard as any);

export default router;
