import { Router } from 'express'
import { getLanguageStatus, getLanguageTools, postLanguageEval } from '../controllers/language.controller'

const router = Router()

router.get('/status', getLanguageStatus as any)
router.get('/tools', getLanguageTools as any)
router.post('/eval', postLanguageEval as any)

export default router
