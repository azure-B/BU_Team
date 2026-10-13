import { Router } from 'express';
import { getNotices } from '../controllers/notice.controller';

const router = Router();
router.get('/', getNotices as any);

export default router;
