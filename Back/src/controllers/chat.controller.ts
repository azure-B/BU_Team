import { Request, Response, NextFunction } from 'express'
import { routeChat } from '../services/chat/router'

export const postChat = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const question = String(req.body?.question || req.body?.message || '').trim()
    const department = req.body?.department
      || (req as any).user?.department
      || null
    const forceLlm = Boolean(req.body?.forceLlm || req.body?.force_llm || req.body?.preferAi)
    const userId = (req as any).user?.id ? String((req as any).user.id) : null
    const result = await routeChat({
      question,
      department: department ? String(department) : null,
      now: new Date(),
      forceLlm,
      userId,
    })
    res.json({
      success: true,
      data: result,
    })
  } catch (error) {
    next(error)
  }
}
