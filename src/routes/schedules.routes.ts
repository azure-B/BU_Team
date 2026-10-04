import { Router } from 'express';
const router = Router();

router.get('/', (req, res) => res.json({ message: 'get schedules' }));
router.post('/', (req, res) => res.json({ message: 'create schedule' }));

export default router;
