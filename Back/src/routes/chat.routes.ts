import { Router } from 'express'
import { optionalAuthenticate } from '../middlewares/optional-auth.middleware'
import { postChat } from '../controllers/chat.controller'

const router = Router()

router.post('/', optionalAuthenticate, postChat)

export default router
