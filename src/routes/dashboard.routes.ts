import { Router } from 'express';
const router = Router();

router.get('/today', (req, res) => res.json({ message: 'get dashboard' }));

export default router;
