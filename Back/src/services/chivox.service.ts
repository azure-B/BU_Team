/**
 * Chivox MCP / Function-Calling 프록시
 * - 키: .env 의 CHIVOX 또는 CHIVOX_API_KEY / MCP_API_KEY (Bearer)
 * - 문서: https://www.chivox.com/en/docs/mcp
 * - 점수 JSON → askPronunciationCoach 2차 패스 (LLM 코칭 문장)
 */
import { askPronunciationCoach } from './chat/llm'

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
  /** llm = GPT 코칭, template = 규칙 기반 폴백 */
  feedbackSource?: 'llm' | 'template'
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

/** WAV PCM 만 초 단위로 안전하게 자르기 (base64 중간 절단 금지) */
function trimWavBase64(b64: string, maxSeconds = 12): string {
  let buf: Buffer
  try {
    buf = Buffer.from(b64, 'base64')
  } catch {
    return b64
  }
  if (buf.length < 44 || buf.toString('ascii', 0, 4) !== 'RIFF') return b64
  const sampleRate = buf.readUInt32LE(24) || 16000
  const channels = buf.readUInt16LE(22) || 1
  const bits = buf.readUInt16LE(34) || 16
  const bytesPerFrame = Math.max(1, (bits / 8) * channels)
  const maxData = Math.floor(sampleRate * maxSeconds) * bytesPerFrame
  const dataSize = buf.readUInt32LE(40)
  if (!Number.isFinite(dataSize) || dataSize <= maxData) return b64
  const trimmed = Buffer.alloc(44 + maxData)
  buf.copy(trimmed, 0, 0, 44)
  buf.copy(trimmed, 44, 44, 44 + maxData)
  trimmed.writeUInt32LE(36 + maxData, 4)
  trimmed.writeUInt32LE(maxData, 40)
  return trimmed.toString('base64')
}

function asNum(v: unknown): number | undefined {
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

function providerErrorText(payload: any): string {
  if (!payload) return ''
  if (payload?.isError) {
    const parts = Array.isArray(payload.content)
      ? payload.content.map((c: any) => c?.text).filter(Boolean)
      : []
    return parts.join(' ') || 'tool error'
  }
  if (typeof payload === 'string') return payload
  return String(payload?.error?.message || payload?.message || '')
}

function feedbackFromProviderError(detail: string) {
  if (/api key disabled|authentication_error|401|403/i.test(detail)) {
    return '말하기 평가 서비스에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.'
  }
  if (/53000|core is timeout|timeout|AbortError/i.test(detail)) {
    return '평가가 시간 초과됐어요. 문장을 5초 안으로 짧게 다시 녹음해 주세요.'
  }
  if (/评测失败|request error|empty result/i.test(detail)) {
    return '음성을 처리하지 못했어요. 조금 더 크게, 짧게 다시 녹음해 주세요.'
  }
  return '말하기 평가 요청이 실패했어요. 잠시 후 다시 시도해 주세요.'
}

/** FC: `{ name, result: { result: { overall } } }` / MCP: `{ content:[{ text: "{...}" }] }` */
function unwrapScoreRoot(payload: any): any {
  const queue: any[] = [payload]
  const seen = new Set<any>()

  while (queue.length) {
    let cur = queue.shift()
    if (cur == null || seen.has(cur)) continue
    if (typeof cur === 'object') seen.add(cur)

    if (typeof cur === 'string') {
      const trimmed = cur.trim()
      if (!trimmed) continue
      try {
        queue.push(JSON.parse(trimmed))
      } catch {
        /* ignore non-json text */
      }
      continue
    }
    if (typeof cur !== 'object') continue

    if (asNum((cur as any).overall) != null) return cur

    if (Array.isArray((cur as any).content)) {
      for (const part of (cur as any).content) {
        if (part?.text) queue.push(part.text)
        else queue.push(part)
      }
    }
    if ((cur as any).result != null) queue.push((cur as any).result)
    if ((cur as any).data != null) queue.push((cur as any).data)
    if ((cur as any).structuredContent != null) queue.push((cur as any).structuredContent)
  }
  return null
}

function normalizePayload(payload: any): Partial<ChivoxEvalResult> & { tip?: string } {
  const root = unwrapScoreRoot(payload)
  if (!root || typeof root !== 'object') {
    return { raw: payload }
  }

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

function compactScoresForLlm(
  refText: string,
  scores: Partial<ChivoxEvalResult> & { tip?: string },
) {
  const weakWords = Array.isArray(scores.details)
    ? scores.details
      .map((d: any) => ({
        word: String(d?.char || d?.word || ''),
        score: asNum(d?.score),
        phones: Array.isArray(d?.phone)
          ? d.phone
            .map((p: any) => ({
              phoneme: p?.phoneme || p?.char,
              score: asNum(p?.score),
              dp_type: p?.dp_type,
              error: p?.phoneme_error || undefined,
            }))
            .filter((p: any) => p.phoneme && p.score != null && p.score < 75)
            .slice(0, 4)
          : [],
      }))
      .filter((d) => d.word && d.score != null && (d.score < 75 || d.phones.length))
      .slice(0, 8)
    : []

  return {
    refText,
    overall: scores.overall,
    accuracy: scores.accuracy,
    pron: scores.pron,
    integrity: scores.integrity,
    fluency: scores.fluency,
    tip: scores.tip || undefined,
    weakWords,
  }
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
    signal: AbortSignal.timeout(90000),
  })
  const json: any = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = json?.error?.message || json?.message || (typeof json?.error === 'string' ? json.error : null)
    throw new Error(msg || `Chivox FC HTTP ${res.status}`)
  }
  // 빈 result 는 파싱 실패로 간주 → 상위에서 MCP 재시도
  if (json?.result == null && asNum(json?.overall) == null) {
    throw new Error('Chivox FC empty result')
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
    signal: AbortSignal.timeout(90000),
  })
  const text = await callRes.text()
  let json: any = null
  try {
    json = JSON.parse(text)
  } catch {
    const dataLines = text
      .split(/\r?\n/)
      .filter((l) => l.startsWith('data:'))
      .map((l) => l.slice(5).trim())
      .filter(Boolean)
    for (const line of dataLines.reverse()) {
      try {
        json = JSON.parse(line)
        if (json) break
      } catch {
        /* try previous data line */
      }
    }
  }
  const errMsg = json?.error?.message || (typeof json?.error === 'string' ? json.error : null)
  if (!callRes.ok) {
    throw new Error(errMsg || `Chivox MCP HTTP ${callRes.status}`)
  }
  if (json?.error) throw new Error(errMsg || 'Chivox MCP error')
  const result = json?.result ?? json
  const toolErr = providerErrorText(result)
  if (result?.isError || /评测失败|53000|core is timeout/i.test(toolErr)) {
    throw new Error(toolErr || 'Chivox MCP tool error')
  }
  return result
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

  let audio_base64 = stripDataUrl(input.audioBase64)
  if (!audio_base64 || audio_base64.length < 80) {
    return {
      ok: false,
      tool,
      feedbackKo: '녹음 데이터가 너무 짧아요. 다시 말해 주세요.',
      error: 'audio too short',
    }
  }
  // 긴 녹음은 WAV PCM 기준으로만 안전하게 자름 (base64 중간 절단 금지 — core timeout 유발)
  audio_base64 = trimWavBase64(audio_base64, 12)

  const ref_text = String(input.refText || '').trim()
  if (!ref_text) {
    return { ok: false, tool, feedbackKo: '참고 문장/주제가 비어 있어요.', error: 'ref_text empty' }
  }

  const args = { ref_text, audio_base64, accent: 2, rank: 100 }

  let payload: any
  let mode = 'fc'
  let lastErr = ''
  try {
    payload = await callViaFc(tool, args, key)
  } catch (fcErr: any) {
    lastErr = String(fcErr?.message || fcErr)
    mode = 'mcp'
    try {
      payload = await callViaMcp(tool, args, key)
    } catch (mcpErr: any) {
      const detail = `${lastErr} | ${mcpErr?.message || mcpErr}`
      return {
        ok: false,
        tool,
        feedbackKo: feedbackFromProviderError(detail),
        error: detail,
      }
    }
  }

  let scores = normalizePayload(payload)
  const earlyErr = providerErrorText(payload)
  if (scores.overall == null && mode === 'fc') {
    try {
      payload = await callViaMcp(tool, args, key)
      mode = 'mcp-fallback'
      scores = normalizePayload(payload)
    } catch (mcpErr: any) {
      lastErr = `${lastErr} | ${mcpErr?.message || mcpErr}`
      console.warn('[language/eval] mcp fallback failed', mcpErr?.message || mcpErr)
    }
  }

  if (scores.overall == null) {
    const detail = earlyErr || lastErr || providerErrorText(payload) || 'score unwrap failed'
    console.warn('[language/eval] score unwrap failed', mode, detail, JSON.stringify(payload)?.slice(0, 800))
    return {
      ok: false,
      tool: `${tool}@${mode}`,
      feedbackKo: feedbackFromProviderError(detail),
      error: detail,
      raw: scores.raw ?? payload,
    }
  }

  const templateFeedback = buildFeedbackKo(ref_text, scores)
  let feedbackKo = templateFeedback
  let feedbackSource: 'llm' | 'template' = 'template'

  // 2차 패스: 점수 JSON → LLM 코칭 문장 (실패 시 템플릿 유지)
  try {
    const coach = await askPronunciationCoach({
      refText: ref_text,
      scores: compactScoresForLlm(ref_text, scores),
    })
    if (coach.ok && coach.text.trim().length >= 20) {
      feedbackKo = coach.text.trim()
      feedbackSource = 'llm'
    }
  } catch (err: any) {
    console.warn('[language/eval] llm coach failed', err?.message || err)
  }

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
    feedbackKo,
    feedbackSource,
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
