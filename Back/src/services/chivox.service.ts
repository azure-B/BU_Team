/**
 * Chivox MCP / Function-Calling 프록시
 * - 키: .env 의 CHIVOX 또는 CHIVOX_API_KEY / MCP_API_KEY (Bearer)
 * - 문서: https://www.chivox.com/en/docs/mcp
 */

export type ChivoxEvalInput = {
  /** Chivox FC/MCP 툴 이름 (예: en_sentence_eval, en_open_eval) */
  tool: string
  /** 툴별 참고 텍스트 — 따라읽기 문장 또는 개방형 주제/질문 */
  refText: string
  audioBase64: string
  mimeType?: string
}

export type ChivoxEvalResult = {
  ok: boolean
  tool: string
  overall?: number
  accuracy?: number
  pron?: number
  integrity?: number
  fluency?: { overall?: number; speed?: number; pause?: number } | number
  details?: unknown[]
  raw?: unknown
  feedbackKo: string
  error?: string
}

/** Front와 공유하는 툴 카탈로그 (Chivox /v1/functions 기준) */
export const CHIVOX_TOOLS = [
  {
    id: 'en_sentence_eval',
    locale: 'en',
    kind: 'read' as const,
    labelKo: '영어 · 문장 읽기',
    hintKo: '화면에 나온 문장을 따라 읽습니다.',
    samples: [
      'The weather is absolutely gorgeous today.',
      'I would like a cup of coffee.',
      'Could you tell me the way to the library?',
    ],
  },
  {
    id: 'en_open_eval',
    locale: 'en',
    kind: 'speak' as const,
    labelKo: '영어 · 개방형 말하기',
    hintKo: '주제에 대해 자유롭게 말합니다. (Chivox en_open_eval)',
    samples: [
      'Please introduce yourself briefly.',
      'Describe your favorite place on campus.',
      'What did you do last weekend?',
    ],
  },
  {
    id: 'en_semi_open_eval',
    locale: 'en',
    kind: 'speak' as const,
    labelKo: '영어 · 반개방 대화',
    hintKo: '상황에 맞춰 짧게 답합니다. (Chivox en_semi_open_eval)',
    samples: [
      'You meet a classmate. Greet them and ask about their major.',
      'Order a sandwich and a drink at a cafe.',
      'Ask a professor for an appointment tomorrow afternoon.',
    ],
  },
  {
    id: 'cn_sentence_eval',
    locale: 'zh',
    kind: 'read' as const,
    labelKo: '중국어 · 문장 읽기',
    hintKo: '화면에 나온 중문 문장을 따라 읽습니다.',
    samples: [
      '今天天气非常好。',
      '请给我一杯咖啡。',
      '图书馆怎么走？',
    ],
  },
  {
    id: 'cn_aitalk_eval',
    locale: 'zh',
    kind: 'speak' as const,
    labelKo: '중국어 · AI Talk',
    hintKo: '주제에 대해 중국어로 말합니다. (Chivox cn_aitalk_eval)',
    samples: [
      '请简单介绍一下你自己。',
      '说说你最喜欢的校园地点。',
      '你上周末做了什么？',
    ],
  },
] as const

const ALLOWED_TOOLS = new Set(CHIVOX_TOOLS.map((t) => t.id))

function apiKey() {
  return (
    process.env.CHIVOX_API_KEY?.trim()
    || process.env.MCP_API_KEY?.trim()
    || process.env.CHIVOX?.trim()
    || ''
  )
}

function stripDataUrl(b64: string) {
  const raw = String(b64 || '').trim()
  const m = raw.match(/^data:[^;]+;base64,(.+)$/i)
  return m ? m[1] : raw
}

function asNum(v: unknown): number | undefined {
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

/** FC 응답은 `{ name, result: { result: { overall, ... } } }` 형태 */
function unwrapScoreRoot(payload: any): any {
  let cur: any = payload
  for (let i = 0; i < 6; i += 1) {
    if (cur == null) return null
    if (typeof cur === 'string') {
      try {
        cur = JSON.parse(cur)
        continue
      } catch {
        return null
      }
    }
    if (typeof cur !== 'object') return null
    if (asNum(cur.overall) != null) return cur
    if (Array.isArray(cur.content) && cur.content[0]?.text) {
      cur = cur.content[0].text
      continue
    }
    if (cur.result != null) {
      cur = cur.result
      continue
    }
    if (cur.data != null) {
      cur = cur.data
      continue
    }
    break
  }
  return cur
}

function normalizePayload(payload: any): Partial<ChivoxEvalResult> & { tip?: string } {
  const root = unwrapScoreRoot(payload)
  if (!root || typeof root !== 'object') return { raw: payload }

  const fluency = root?.fluency
  const tip = String(root?.info?.tips || root?.info?.tip || root?.tips || '').trim()
  return {
    overall: asNum(root?.overall),
    accuracy: asNum(root?.accuracy),
    pron: asNum(root?.pron ?? root?.pronunciation),
    integrity: asNum(root?.integrity),
    fluency: typeof fluency === 'object' && fluency
      ? {
          overall: asNum(fluency.overall),
          speed: asNum(fluency.speed),
          pause: asNum(fluency.pause),
        }
      : asNum(fluency),
    details: Array.isArray(root?.details) ? root.details : undefined,
    raw: root,
    tip: tip || undefined,
  }
}

function buildFeedbackKo(
  refText: string,
  scores: Partial<ChivoxEvalResult> & { tip?: string },
) {
  const overall = scores.overall
  const accuracy = scores.accuracy
  const fluencyOverall =
    typeof scores.fluency === 'object' ? scores.fluency?.overall : scores.fluency
  const recFailed = /rec failed|no speech|vad|silent|too short/i.test(String(scores.tip || ''))
    || (overall === 0 && accuracy === 0 && (scores.pron === 0 || scores.pron == null))

  if (recFailed) {
    return [
      `「${refText}」 평가 결과`,
      '',
      '음성이 잘 인식되지 않았어요.',
      '조금 더 크게, 문장 전체를 또박또박 다시 녹음해 주세요.',
    ].join('\n')
  }

  const lines = [
    `「${refText}」 평가 결과`,
    '',
  ]
  if (overall != null) lines.push(`종합 ${Math.round(overall)}점`)
  if (accuracy != null) lines.push(`정확도 ${Math.round(accuracy)}점`)
  if (scores.pron != null) lines.push(`발음 ${Math.round(scores.pron)}점`)
  if (scores.integrity != null) lines.push(`완성도 ${Math.round(scores.integrity)}점`)
  if (fluencyOverall != null) lines.push(`유창성 ${Math.round(fluencyOverall)}점`)

  const weakWords = Array.isArray(scores.details)
    ? scores.details
      .map((d: any) => ({
        w: String(d?.char || d?.word || ''),
        s: asNum(d?.score),
      }))
      .filter((d) => d.w && d.s != null && d.s > 0 && d.s < 70)
      .slice(0, 5)
    : []
  if (weakWords.length) {
    lines.push('')
    lines.push('보완하면 좋은 부분')
    for (const w of weakWords) {
      lines.push(`· ${w.w} (${Math.round(w.s!)}점)`)
    }
  }

  lines.push('')
  if (overall == null) {
    lines.push('평가 결과를 해석하지 못했어요. 다시 녹음해 주세요.')
  } else if (overall >= 85) {
    lines.push('잘했어요. 억양만 조금 더 자연스럽게 다듬어 보세요.')
  } else if (overall >= 70) {
    lines.push('전달은 됩니다. 약한 부분을 한 번씩 다시 말해 보세요.')
  } else {
    lines.push('천천히, 또박또박 다시 해 보면 점수가 잘 올라가요.')
  }
  return lines.join('\n')
}

async function callViaFc(tool: string, args: Record<string, unknown>, key: string) {
  const res = await fetch('https://fc-global.cloud.chivox.com/v1/call', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ name: tool, arguments: args }),
    signal: AbortSignal.timeout(45000),
  })
  const json: any = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = json?.error?.message || json?.message || (typeof json?.error === 'string' ? json.error : null)
    throw new Error(msg || `Chivox FC HTTP ${res.status}`)
  }
  return json
}

async function callViaMcp(tool: string, args: Record<string, unknown>, key: string) {
  const headers = {
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    Accept: 'application/json, text/event-stream',
  }
  const initRes = await fetch('https://mcp-global.cloud.chivox.com', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'bu-team-language', version: '1.0.0' },
      },
    }),
    signal: AbortSignal.timeout(20000),
  })
  const sessionId = initRes.headers.get('mcp-session-id') || initRes.headers.get('Mcp-Session-Id')
  await initRes.text().catch(() => '')

  const callHeaders: Record<string, string> = { ...headers }
  if (sessionId) callHeaders['mcp-session-id'] = sessionId

  const callRes = await fetch('https://mcp-global.cloud.chivox.com', {
    method: 'POST',
    headers: callHeaders,
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: { name: tool, arguments: args },
    }),
    signal: AbortSignal.timeout(45000),
  })
  const text = await callRes.text()
  let json: any = null
  try {
    json = JSON.parse(text)
  } catch {
    const line = text.split(/\r?\n/).find((l) => l.startsWith('data:'))
    if (line) json = JSON.parse(line.slice(5).trim())
  }
  const errMsg = json?.error?.message || (typeof json?.error === 'string' ? json.error : null)
  if (!callRes.ok) {
    throw new Error(errMsg || `Chivox MCP HTTP ${callRes.status}`)
  }
  if (json?.error) throw new Error(errMsg || 'Chivox MCP error')
  return json?.result ?? json
}

export async function evaluateSentence(input: ChivoxEvalInput): Promise<ChivoxEvalResult> {
  const key = apiKey()
  if (!key) {
    return {
      ok: false,
      tool: '',
      feedbackKo: '말하기 평가를 준비하지 못했어요. 잠시 후 다시 시도해 주세요.',
      error: 'CHIVOX missing',
    }
  }

  const tool = String(input.tool || '').trim()
  if (!ALLOWED_TOOLS.has(tool as any)) {
    return {
      ok: false,
      tool,
      feedbackKo: '지원하지 않는 평가 방식이에요. 다시 시도해 주세요.',
      error: 'unsupported tool',
    }
  }

  const audio_base64 = stripDataUrl(input.audioBase64)
  if (!audio_base64 || audio_base64.length < 80) {
    return {
      ok: false,
      tool,
      feedbackKo: '녹음 데이터가 너무 짧아요. 다시 말해 주세요.',
      error: 'audio too short',
    }
  }

  const ref_text = String(input.refText || '').trim()
  if (!ref_text) {
    return { ok: false, tool, feedbackKo: '참고 문장/주제가 비어 있어요.', error: 'ref_text empty' }
  }

  const args = { ref_text, audio_base64, accent: 2, rank: 100 }

  let payload: any
  let mode = 'fc'
  try {
    payload = await callViaFc(tool, args, key)
  } catch (fcErr: any) {
    mode = 'mcp'
    try {
      payload = await callViaMcp(tool, args, key)
    } catch (mcpErr: any) {
      const detail = `${fcErr?.message || fcErr} | ${mcpErr?.message || mcpErr}`
      const disabled = /api key disabled|authentication_error|401|403/i.test(detail)
      return {
        ok: false,
        tool,
        feedbackKo: disabled
          ? '말하기 평가 서비스에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.'
          : '말하기 평가 요청이 실패했어요. 잠시 후 다시 시도해 주세요.',
        error: detail,
      }
    }
  }

  const scores = normalizePayload(payload)
  return {
    ok: true,
    tool: `${tool}@${mode}`,
    overall: scores.overall,
    accuracy: scores.accuracy,
    pron: scores.pron,
    integrity: scores.integrity,
    fluency: scores.fluency,
    details: scores.details,
    raw: scores.raw,
    feedbackKo: buildFeedbackKo(ref_text, scores),
  }
}

export function chivoxConfigured() {
  return Boolean(apiKey())
}

export function listChivoxTools() {
  return CHIVOX_TOOLS.map(({ id, locale, kind, labelKo, hintKo, samples }) => ({
    id, locale, kind, labelKo, hintKo, samples: [...samples],
  }))
}
