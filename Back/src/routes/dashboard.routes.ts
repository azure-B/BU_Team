import { Router } from 'express';
import { optionalAuthenticate } from '../middlewares/optional-auth.middleware';
import { getDashboard } from '../controllers/dashboard.controller';

const router = Router();
router.get('/today', optionalAuthenticate, getDashboard as any);

export default router;
