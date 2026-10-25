import { SYSTEM_PROMPT } from './systemPrompt'

export type LlmResult = {
  ok: boolean
  text: string
  model: string
  inputTokens?: number
  outputTokens?: number
  error?: string
}

export async function askGpt(question: string, contextBlocks: string[] = []): Promise<LlmResult> {
  const key = process.env.OPENAI_API_KEY?.trim()
  const model = process.env.OPENAI_MODEL?.trim() || 'gpt-5-mini'
  const maxOut = Number(process.env.MAX_OUTPUT_TOKENS || 800)

  if (!key) {
    return {
      ok: false,
      text: 'AI 키가 설정되지 않아 상세 답변을 만들 수 없습니다. 학부사무실·학사일정 등 간단 질문은 계속 이용할 수 있어요.',
      model,
      error: 'OPENAI_API_KEY missing',
    }
  }

  const context = contextBlocks.filter(Boolean).join('\n\n')
  const input = [
    context ? `[근거]\n${context}` : '[근거]\n(검색된 로컬 근거 없음 — 모르는 내용은 확인 불가로 답할 것)',
    `질문: ${question}`,
  ].join('\n\n')

  try {
    const res = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        instructions: SYSTEM_PROMPT,
        input,
        max_output_tokens: Math.max(maxOut, 400),
        reasoning: { effort: 'low' },
      }),
    })
    const json: any = await res.json().catch(() => ({}))
    if (!res.ok) {
      return {
        ok: false,
        text: 'AI 응답에 잠시 문제가 있어요. 교무처 041-550-9154 또는 학부사무실에 문의해 주세요.',
        model,
        error: json?.error?.message || `HTTP ${res.status}`,
      }
    }

    let text = extractResponseText(json)
    const reasoningOnly = Number(json?.usage?.output_tokens_details?.reasoning_tokens || 0)
      >= Number(json?.usage?.output_tokens || 0)
    return {
      ok: Boolean(text),
      text: text
        || (reasoningOnly
          ? '답변이 길어 잘렸습니다. 「장학금 신청 방법」처럼 짧게 다시 물어봐 주세요.'
          : '답변을 생성하지 못했습니다.'),
      model,
      inputTokens: json?.usage?.input_tokens,
      outputTokens: json?.usage?.output_tokens,
    }
  } catch (err: any) {
    return {
      ok: false,
      text: 'AI 서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.',
      model,
      error: err?.message || String(err),
    }
  }
}

/** 0=기타 1=일정조회 2=일정등록 3=일정애매 4=공지·대회·모집 5=일정삭제 */
export type ScheduleIntentCode = 0 | 1 | 2 | 3 | 4 | 5

export type ScheduleSlotExtract = {
  intent: 'create_schedule' | 'not_schedule' | 'unclear'
  title: string | null
  weekday: number | null
  start: string | null
  end: string | null
  repeatWeekly: boolean | null
}

const CLASSIFY_SCHEDULE_PROMPT = `너는 대학 비서 의도 분류기다. 숫자 하나만 출력한다. 공백·설명·마크다운 금지.
0 = 아래 1~5가 아님 (과사·교수 연락처, 순수 학사일정, 병결·휴학·복학 절차 FAQ, 공강·뭐하지, 셔틀·통학버스 등)
1 = 내 시간표/일정 조회 (있어? 있나? 뭐 있어? 비어? 스케줄 알려줘, 오늘 14시에 일정 있어?)
2 = 개인 일정 등록·추가·약속 (등록, 넣어줘, 밥먹기로 함, 스터디 잡을게)
3 = 일정 관련인데 조회/등록/삭제 구분이 애매
4 = 학교·학부 공지·대회·모집·특강·인턴·채용·설문·창업·비교과 등 공지성 질문
  예: 해킹 페스티벌, 창업동아리 모집, 인턴 채용 있어?
  ※ 「휴학하려면」「병결 서류」처럼 학적 절차 질문은 4가 아니라 0
5 = 일정 삭제·취소 (없애줘, 지워줘, 삭제, 취소해줘, 스터디 빼줘) — 수업 삭제가 아님`

const EXTRACT_SCHEDULE_PROMPT = `너는 일정 슬롯 추출기다. JSON 객체 하나만 출력한다. 설명·마크다운 금지.
키: intent, title, weekday, start, end, repeatWeekly
- intent: 등록·추가·약속 잡기면 create_schedule. 조회(있어?)는 not_schedule. 과사/학사만 not_schedule. 애매하면 unclear
- title: 짧게 요약(친구랑 밥, 스터디 등). 없으면 "개인 일정". 수업/강의가 아니면 과목명처럼 쓰지 말 것
- weekday: 0=일 … 6=토. 「오늘」이면 아래 지금 시각의 요일. 모르면 null
- start, end: "HH:MM" **한국 로컬 24시간·분 단위**. UTC 변환 금지. 사용자가 말한 시각 그대로 (12시 30분→"12:30", 15시→"15:00"). 1시간 단위로 반올림·강제 금지
- 「A부터 B까지」「A~B」면 start=A, end=B. 끝만 없으면 start+1시간(12:30→13:30). 시간 언급 없으면 null (추측 금지)
- 1~6시만 있고 오전/오후가 없으면 오후로 해석(4시→16:00). 이미 12~23시면 그대로. 「시 반」=30분
- 점심은 12:00, 저녁은 18:00 전후 (구체 시각이 있으면 점심/저녁 무시)
- repeatWeekly: 「매주/주마다」가 문장에 있을 때만 true. 밥·약속·스터디·동아리·알바·모임·오늘/내일/모레·일회는 기본 false`

function extractResponseText(json: any): string {
  let text = typeof json?.output_text === 'string' ? json.output_text : ''
  for (const part of Array.isArray(json?.output) ? json.output : []) {
    if (part?.type !== 'message') continue
    for (const c of part.content || []) {
      if (c?.type === 'output_text' || c?.type === 'text') {
        text += c.text || c.value || ''
      } else if (typeof c?.text === 'string') {
        text += c.text
      }
    }
  }
  if (!text && Array.isArray(json?.output)) {
    text = json.output
      .filter((p: any) => p?.type === 'message')
      .flatMap((p: any) => p.content || [])
      .map((c: any) => (typeof c === 'string' ? c : c?.text || c?.value || ''))
      .join('')
  }
  return String(text || '').trim()
}

function parseJsonObject(raw: string): any | null {
  const trimmed = String(raw || '').trim()
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/)
  const body = fence ? fence[1] : trimmed
  const start = body.indexOf('{')
  const end = body.lastIndexOf('}')
  if (start < 0 || end <= start) return null
  try {
    return JSON.parse(body.slice(start, end + 1))
  } catch {
    return null
  }
}

function parseWeekday(value: unknown): number | null {
  if (typeof value === 'number' && value >= 0 && value <= 6) return value
  const s = String(value ?? '').trim()
  if (/^[0-6]$/.test(s)) return Number(s)
  const map: Record<string, number> = { 일: 0, 월: 1, 화: 2, 수: 3, 목: 4, 금: 5, 토: 6 }
  const key = s.replace(/요일/, '').charAt(0)
  return key in map ? map[key] : null
}

function parseHm(value: unknown): string | null {
  const s = String(value ?? '').trim()
  const m = s.match(/^(\d{1,2}):(\d{2})/)
  if (!m) return null
  const h = Number(m[1])
  const min = Number(m[2])
  if (h < 0 || h > 23 || min < 0 || min > 59) return null
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}

function parseIntentCode(raw: string): ScheduleIntentCode | null {
  const m = String(raw || '').trim().match(/[0-5]/)
  if (!m) return null
  return Number(m[0]) as ScheduleIntentCode
}

/** GPT가 숫자 하나만 출력 → 0|1|2|3|4|5. 실패 시 null */
export async function classifyScheduleCode(question: string, now: Date): Promise<ScheduleIntentCode | null> {
  const key = process.env.OPENAI_API_KEY?.trim()
  const model = process.env.OPENAI_MODEL?.trim() || 'gpt-5-mini'
  if (!key) return null

  try {
    const res = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        instructions: CLASSIFY_SCHEDULE_PROMPT,
        input: `지금: ${now.toISOString()}\n사용자: ${question}`,
        max_output_tokens: 16,
        reasoning: { effort: 'low' },
      }),
    })
    const json: any = await res.json().catch(() => ({}))
    if (!res.ok) return null
    return parseIntentCode(extractResponseText(json))
  } catch {
    return null
  }
}

export async function extractScheduleSlots(question: string, now: Date): Promise<ScheduleSlotExtract | null> {
  const key = process.env.OPENAI_API_KEY?.trim()
  const model = process.env.OPENAI_MODEL?.trim() || 'gpt-5-mini'
  if (!key) return null

  try {
    const res = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        instructions: EXTRACT_SCHEDULE_PROMPT,
        input: `지금: ${now.toISOString()} (요일 ${now.getDay()}: 0=일…6=토)\n사용자: ${question}`,
        max_output_tokens: 250,
        reasoning: { effort: 'low' },
      }),
    })
    const json: any = await res.json().catch(() => ({}))
    if (!res.ok) return null
    const parsed = parseJsonObject(extractResponseText(json))
    if (!parsed || typeof parsed !== 'object') return null
    const intentRaw = String(parsed.intent || 'unclear')
    const intent: ScheduleSlotExtract['intent'] =
      intentRaw === 'create_schedule' || intentRaw === 'not_schedule' ? intentRaw : 'unclear'
    return {
      intent,
      title: parsed.title ? String(parsed.title).trim().slice(0, 100) : null,
      weekday: parseWeekday(parsed.weekday),
      start: parseHm(parsed.start),
      end: parseHm(parsed.end),
      repeatWeekly: typeof parsed.repeatWeekly === 'boolean' ? parsed.repeatWeekly : null,
    }
  } catch {
    return null
  }
}
