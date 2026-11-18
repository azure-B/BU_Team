import { Request, Response, NextFunction } from 'express'
import { chivoxConfigured, evaluateSentence, listChivoxTools } from '../services/chivox.service'

export const getLanguageStatus = async (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      chivox: chivoxConfigured(),
      provider: 'chivox-mcp',
      supportedLocales: ['en', 'zh'],
      tools: listChivoxTools(),
    },
  })
}

export const getLanguageTools = async (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: { tools: listChivoxTools() },
  })
}

export const postLanguageEval = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tool, refText, audioBase64, locale, mimeType } = req.body || {}
    let resolvedTool = String(tool || '').trim()
    // 하위 호환: tool 없으면 locale → 문장 평가 툴
    if (!resolvedTool) {
      resolvedTool = locale === 'zh' || locale === 'zh-CN' ? 'cn_sentence_eval' : 'en_sentence_eval'
    }
    const result = await evaluateSentence({
      tool: resolvedTool,
      refText: String(refText || ''),
      audioBase64: String(audioBase64 || ''),
      mimeType: mimeType ? String(mimeType) : undefined,
    })
    res.status(result.ok ? 200 : 502).json({
      success: result.ok,
      data: result,
      message: result.ok ? undefined : result.feedbackKo,
    })
  } catch (err) {
    next(err)
  }
}
