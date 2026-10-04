import { Router } from 'express';
const router = Router();

router.get('/', (req, res) => res.json({ message: 'get tasks' }));
router.post('/', (req, res) => res.json({ message: 'create task' }));

export default router;
