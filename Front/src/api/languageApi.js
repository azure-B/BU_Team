import api from './index'

/** Chivox 연동 상태 (+ 툴 목록) */
export const getLanguageStatus = async () => {
  const res = await api.get('/language/status')
  return res?.data || res
}

/** Chivox FC/MCP 툴 카탈로그 */
export const getLanguageTools = async () => {
  const res = await api.get('/language/tools')
  return res?.data || res
}

/**
 * Chivox 툴 발음·말하기 평가
 * @param {{ tool: string, refText: string, audioBase64: string, mimeType?: string, locale?: 'en'|'zh' }} payload
 */
export const postLanguageEval = async ({
  tool,
  refText,
  audioBase64,
  mimeType,
  locale,
} = {}) => {
  try {
    const res = await api.post(
      '/language/eval',
      { tool, refText, audioBase64, mimeType, locale },
      { timeout: 120000 },
    )
    // axios 인터셉터: { success, data, message }
    if (res?.data && typeof res.data === 'object') return res.data
    return res
  } catch (err) {
    return {
      ok: false,
      feedbackKo: err?.message || '평가 요청에 실패했어요.',
      error: err?.message || 'request failed',
    }
  }
}
