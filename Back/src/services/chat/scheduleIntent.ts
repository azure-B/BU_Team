import { createSchedule, deleteSchedule, getSchedules } from '../schedule.service'
import {
  classifyScheduleCode,
  extractScheduleSlots,
  type ScheduleIntentCode,
  type ScheduleSlotExtract,
} from './llm'

export type ScheduleActionStatus =
  | 'created'
  | 'deleted'
  | 'conflict'
  | 'need_login'
  | 'need_clarify'
  | 'queried'

export type ScheduleAction = {
  status: ScheduleActionStatus
  title?: string
  weekday?: number
  start?: string
  end?: string
}

export type ScheduleIntentResult = {
  handled: boolean
  answer?: string
  badge?: string
  choices?: string[]
  scheduleAction?: ScheduleAction
  /** GPT/로컬 분류 코드 — 디버그·로그용 */
  intentCode?: ScheduleIntentCode
}

const WEEKDAY_LABEL = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']
const WEEKDAY_CHAR: Record<string, number> = { 일: 0, 월: 1, 화: 2, 수: 3, 목: 4, 금: 5, 토: 6 }

const WEEKDAY_RE = /[월화수목금토일](요일)?/
const TIME_RE =
  /(\d{1,2}\s*시(?:\s*(?:반|\d{1,2}\s*분))?|\d{1,2}\s*[:：]\s*\d{2}|\d{1,2}\s*[~-]\s*\d{1,2}|부터|까지|오전|오후|점심|저녁)/
const CREATE_RE =
  /등록|넣어|추가|잡아|잡을게|넣어줘|잡아줘|하기로|약속\s*잡|만나|먹기로|잡았|할거야|할게|할께|가자|가기로/
const DELETE_RE =
  /삭제|지워|없애|취소|제거|빼\s*줘|빼줘|지워\s*줘|없애\s*줘|삭제해|취소해|삭제할|지울/
const QUERY_RE =
  /있(어|나|나요|습니까)|없(어|나|나요)(?!애|애줘|애주세요)|뭐\s*있|비어|한가|스케줄|알려줘|보여줘|확인|일정\s*있|수업\s*있/
const KIND_RE = /스터디|공부|모임|알바|미팅|동아리|상담|약속|밥|식사|연습|회의|밥약|카페|영화/

const TIME_CHOICE_PRESETS: Array<{ label: string; start: string; end: string }> = [
  { label: '점심 12시', start: '12:00', end: '13:00' },
  { label: '오후 1시', start: '13:00', end: '14:00' },
  { label: '오후 3시', start: '15:00', end: '16:00' },
  { label: '저녁 6시', start: '18:00', end: '19:00' },
  { label: '저녁 7시', start: '19:00', end: '20:00' },
]

function toMin(hm: string) {
  const [h, m] = hm.split(':').map(Number)
  return h * 60 + m
}

function fromMin(total: number) {
  const h = Math.floor(total / 60)
  const m = total % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function nextOccurrence(now: Date, weekday: number, startMin: number, endMin: number) {
  const add = (weekday - now.getDay() + 7) % 7
  const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + add, 0, 0, 0, 0)
  const startAt = new Date(day.getFullYear(), day.getMonth(), day.getDate(), Math.floor(startMin / 60), startMin % 60, 0, 0)
  let endAt = new Date(day.getFullYear(), day.getMonth(), day.getDate(), Math.floor(endMin / 60), endMin % 60, 0, 0)
  if (endAt <= startAt) endAt = new Date(startAt.getTime() + 60 * 60 * 1000)
  return { startAt, endAt }
}

function overlapMins(a0: number, a1: number, b0: number, b1: number) {
  return a0 < b1 && b0 < a1
}

function classTitle(title: string) {
  return String(title || '').replace(/\s*\([^)]*\)\s*$/, '').trim() || title
}

function hmLabel(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return fromMin(d.getHours() * 60 + d.getMinutes())
}

function parseWeekdayLocal(q: string): number | null {
  const m = q.match(/([월화수목금토일])요일?/)
  if (!m) return null
  return WEEKDAY_CHAR[m[1]] ?? null
}

/** 오늘/내일/모레/요일 → 기준 날짜 */
function resolveTargetDay(question: string, now: Date): Date {
  const q = String(question || '')
  const base = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0, 0)
  if (/오늘/.test(q)) return base
  if (/내일/.test(q)) return new Date(base.getTime() + 86400000)
  if (/모레/.test(q)) return new Date(base.getTime() + 2 * 86400000)
  const wd = parseWeekdayLocal(q)
  if (wd != null) {
    const add = (wd - base.getDay() + 7) % 7
    return new Date(base.getTime() + add * 86400000)
  }
  return base
}

/** 조각·전체 문맥으로 시(0–23) 보정. 1~6시 + 오전/오후 없으면 오후 */
function adjustHour(h: number, fragment: string, full: string): number {
  const localPm = /오후|저녁/.test(fragment)
  const localAm = /오전/.test(fragment)
  const fullPm = /오후|저녁/.test(full)
  const fullAm = /오전/.test(full)
  if (localPm || (fullPm && !localAm)) {
    if (h > 0 && h < 12) return h + 12
  }
  // 「오전 12시」만 0시. 「오전 10시부터 12시」의 12는 정오 유지
  if (localAm) return h === 12 ? 0 : h
  if (fullAm && !fullPm) return h
  if (!fullAm && !fullPm && h >= 1 && h <= 6) return h + 12
  return h
}

/** "12시 30분" | "12시반" | "12:30" | "15시" → 분 단위. 실패 시 null */
function parseClockToMin(fragment: string, full: string): number | null {
  const s = String(fragment || '').trim()
  if (!s) return null

  let m = s.match(/(\d{1,2})\s*시\s*반/)
  if (m) {
    const h = adjustHour(Number(m[1]), s, full)
    if (h > 23) return null
    return h * 60 + 30
  }

  m = s.match(/(\d{1,2})\s*시\s*(\d{1,2})\s*분/)
  if (m) {
    const h = adjustHour(Number(m[1]), s, full)
    const min = Number(m[2])
    if (h > 23 || min > 59) return null
    return h * 60 + min
  }

  m = s.match(/(\d{1,2})\s*[:：]\s*(\d{2})/)
  if (m) {
    const h = adjustHour(Number(m[1]), s, full)
    const min = Number(m[2])
    if (h > 23 || min > 59) return null
    return h * 60 + min
  }

  m = s.match(/(\d{1,2})\s*시/)
  if (m) {
    const h = adjustHour(Number(m[1]), s, full)
    if (h > 23) return null
    return h * 60
  }

  // 숫자만 (범위 "7-8" 등)
  m = s.match(/^(\d{1,2})$/)
  if (m) {
    const h = adjustHour(Number(m[1]), s, full)
    if (h > 23) return null
    return h * 60
  }

  return null
}

/** 명시 시각 토큰 (시/분/콜론). 단독 숫자 "7"은 범위용으로만 사용 */
const CLOCK_EXPR =
  '(?:오전|오후|저녁)?\\s*\\d{1,2}\\s*(?:[:：]\\s*\\d{2}|시\\s*반|시\\s*\\d{1,2}\\s*분|시)'

function parseTimeLocal(q: string): { start: string; end: string } | null {
  const text = String(q || '')

  // 12시 30분부터 15시까지 / 12:30부터 3시까지
  const fromUntil = text.match(
    new RegExp(`(${CLOCK_EXPR})\\s*부터\\s*(${CLOCK_EXPR})(?:\\s*까지)?`),
  )
  if (fromUntil) {
    const a = parseClockToMin(fromUntil[1], text)
    const b = parseClockToMin(fromUntil[2], text)
    if (a != null && b != null && b > a) {
      return { start: fromMin(a), end: fromMin(b) }
    }
  }

  // 12:30~15:00 / 12시 30분-15시 / 12시반~2시 / 7-8
  const tildeRange = text.match(
    new RegExp(`(${CLOCK_EXPR}|\\d{1,2})\\s*[~\\-–—]\\s*(${CLOCK_EXPR}|\\d{1,2})`),
  )
  if (tildeRange) {
    const a = parseClockToMin(tildeRange[1], text)
    const b = parseClockToMin(tildeRange[2], text)
    if (a != null && b != null && b > a) {
      return { start: fromMin(a), end: fromMin(b) }
    }
  }

  if (/점심/.test(text) && !/\d{1,2}\s*시|\d{1,2}\s*[:：]/.test(text)) {
    return { start: '12:00', end: '13:00' }
  }
  if (/저녁/.test(text) && !/\d{1,2}\s*[:：]/.test(text) && !/\d{1,2}\s*시/.test(text)) {
    return { start: '18:00', end: '19:00' }
  }

  // 단일 시각 — 끝 없으면 +1시간 (분은 유지: 12:30 → 13:30)
  const single = text.match(new RegExp(CLOCK_EXPR))
  if (single) {
    const a = parseClockToMin(single[0], text)
    if (a != null) {
      return { start: fromMin(a), end: fromMin(a + 60) }
    }
  }

  return null
}

function guessTitle(q: string): string {
  if (/밥약|밥|식사/.test(q)) return /친구/.test(q) ? '친구랑 밥' : '식사 약속'
  if (/스터디|공부/.test(q)) return '스터디'
  if (/동아리|연습/.test(q)) return '동아리 연습'
  if (/알바/.test(q)) return '알바'
  if (/미팅|회의/.test(q)) return '미팅'
  if (/상담/.test(q)) return '상담'
  if (/카페/.test(q)) return '카페'
  if (/영화/.test(q)) return '영화'
  if (/모임|약속|만나/.test(q)) return '약속'
  return '개인 일정'
}

/** Front projectSchedulesOntoDay 와 동일 규칙 */
function projectOntoDay(schedules: any[], targetDay: Date) {
  const day = new Date(targetDay.getFullYear(), targetDay.getMonth(), targetDay.getDate(), 12)
  const dow = day.getDay()
  const dayKey = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`
  const projected: any[] = []
  for (const item of schedules || []) {
    if (!item?.startAt) continue
    const startSrc = new Date(item.startAt)
    const endSrc = new Date(item.endAt || item.startAt)
    if (Number.isNaN(startSrc.getTime())) continue
    if (item.type === 'CLASS' || item.type === 'WEEKLY' || !item.type) {
      if (startSrc.getDay() !== dow) continue
      const startAt = new Date(day.getFullYear(), day.getMonth(), day.getDate(), startSrc.getHours(), startSrc.getMinutes(), 0, 0)
      let endAt = new Date(day.getFullYear(), day.getMonth(), day.getDate(), endSrc.getHours(), endSrc.getMinutes(), 0, 0)
      if (endAt <= startAt) endAt = new Date(endAt.getTime() + 60 * 60 * 1000)
      projected.push({ ...item, startAt: startAt.toISOString(), endAt: endAt.toISOString() })
      continue
    }
    const srcKey = `${startSrc.getFullYear()}-${String(startSrc.getMonth() + 1).padStart(2, '0')}-${String(startSrc.getDate()).padStart(2, '0')}`
    if (srcKey === dayKey) projected.push(item)
  }
  return projected.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
}

function mergeSlots(gpt: ScheduleSlotExtract | null, question: string, now: Date): ScheduleSlotExtract {
  const localWeekday = parseWeekdayLocal(question)
    ?? (/오늘|내일|모레/.test(question) ? resolveTargetDay(question, now).getDay() : null)
  const localTime = parseTimeLocal(question)
  const localTitle = guessTitle(question)
  const localRepeat = /매주|주마다/.test(question)
    ? true
    : /오늘|내일|모레|이번\s*주/.test(question) || KIND_RE.test(question)
      ? false
      : null

  if (!gpt) {
    return {
      intent: 'create_schedule',
      title: localTitle,
      weekday: localWeekday,
      start: localTime?.start ?? null,
      end: localTime?.end ?? null,
      repeatWeekly: localRepeat,
    }
  }

  // 사용자가 HH:MM 을 명시한 경우 로컬 파싱 우선 (GPT가 UTC로 04:00 등으로 틀리는 경우 방지)
  return {
    intent: gpt.intent === 'not_schedule' ? 'unclear' : gpt.intent,
    title: gpt.title || localTitle,
    weekday: localWeekday ?? gpt.weekday,
    start: localTime?.start ?? gpt.start ?? null,
    end: localTime?.end ?? gpt.end ?? null,
    repeatWeekly: localRepeat ?? gpt.repeatWeekly,
  }
}

/** 챗봇 등록분은 수업(CLASS)이 아니라 개인 일정. 매주만 WEEKLY */
function resolveChatScheduleType(question: string, repeatWeekly: boolean): 'CLASS' | 'PERSONAL' | 'WEEKLY' | 'TASK' {
  if (/과제|마감|숙제/.test(question) && !/스터디|약속|밥|미팅/.test(question)) return 'TASK'
  if (/수업|강의|과목/.test(question) && !KIND_RE.test(question)) return 'CLASS'
  return repeatWeekly ? 'WEEKLY' : 'PERSONAL'
}

/** DB·시드와 동일한 한국 벽시계 naive ISO (UTC Z 붙이지 않음) */
function toWallClockIso(day: Date, hm: string) {
  const y = day.getFullYear()
  const m = String(day.getMonth() + 1).padStart(2, '0')
  const d = String(day.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}T${hm}:00`
}

function clarifyChoices(weekday: number, title: string) {
  const day = WEEKDAY_LABEL[weekday]
  return TIME_CHOICE_PRESETS.map(
    (p) => `${day} ${p.start}~${p.end} 「${title}」 일정 등록`,
  )
}

function offerCreateChoices(day: Date, title = '약속') {
  const label = WEEKDAY_LABEL[day.getDay()]
  return TIME_CHOICE_PRESETS.map(
    (p) => `${label} ${p.start}~${p.end} 「${title}」 일정 등록`,
  )
}

const NOTICE_RE =
  /대회|공모|모집|해킹|페스티벌|인턴|채용|특강|설문|창업|비교과|공지|부트\s*캠프|경진|취업|자퇴|병결|조기취업/

/** 수업(CLASS)은 챗봇으로 삭제 불가. 개인·과제·잘못 태그된 개인성 CLASS(스터디 등)만 삭제 */
function isChatDeletable(item: any) {
  const type = item?.type || 'CLASS'
  if (type === 'PERSONAL' || type === 'WEEKLY' || type === 'TASK') return true
  if (type === 'CLASS' && KIND_RE.test(classTitle(item?.title || ''))) return true
  return false
}

function isProtectedClass(item: any) {
  return (item?.type === 'CLASS' || !item?.type) && !KIND_RE.test(classTitle(item?.title || ''))
}

/** 로컬 폴백 분류 (GPT 실패 시) */
export function classifyScheduleCodeLocal(question: string): ScheduleIntentCode {
  const q = String(question || '')
  if (DELETE_RE.test(q) && (WEEKDAY_RE.test(q) || TIME_RE.test(q) || KIND_RE.test(q) || /일정|스케줄/.test(q))) {
    return 5
  }
  if (NOTICE_RE.test(q) && !CREATE_RE.test(q) && !(QUERY_RE.test(q) && /오늘|내일|모레|시/.test(q) && /일정|스케줄/.test(q))) {
    return 4
  }
  if (/교수|교원|사무실|과사|중간고사|기말고사|수강신청|장학|등록금|개강|종강|학사일정/.test(q)
    && !QUERY_RE.test(q) && !CREATE_RE.test(q) && !KIND_RE.test(q) && !DELETE_RE.test(q)) {
    return 0
  }
  if (QUERY_RE.test(q) && !CREATE_RE.test(q) && !DELETE_RE.test(q)) return 1
  if (CREATE_RE.test(q) || (KIND_RE.test(q) && !DELETE_RE.test(q))) return 2
  if ((WEEKDAY_RE.test(q) || /오늘|내일|모레/.test(q)) && TIME_RE.test(q) && /일정|수업|스케줄/.test(q)) {
    return 1
  }
  if (WEEKDAY_RE.test(q) && KIND_RE.test(q)) return 2
  if (/일정|스케줄|수업/.test(q) && (TIME_RE.test(q) || /오늘|내일|모레/.test(q) || WEEKDAY_RE.test(q))) {
    return 3
  }
  return 0
}

/** FAQ와 안 섞이게 일정 후보만 */
export function looksLikeScheduleCandidate(question: string) {
  const q = String(question || '')
  if (/교수|교원|선생님/.test(q) && /전화|이메일|메일|연락처|번호|목록/.test(q) && !TIME_RE.test(q)) {
    return false
  }
  if (/사무실|과사/.test(q) && /어디|위치|몇호|전화/.test(q) && !CREATE_RE.test(q) && !QUERY_RE.test(q) && !DELETE_RE.test(q)) {
    return false
  }
  if (/중간고사|기말고사|수강신청|휴학|장학|등록금|개강|종강|학사일정/.test(q)
    && !CREATE_RE.test(q) && !KIND_RE.test(q) && !QUERY_RE.test(q) && !DELETE_RE.test(q)) {
    return false
  }
  let score = 0
  if (WEEKDAY_RE.test(q) || /오늘|내일|모레/.test(q)) score += 1
  if (TIME_RE.test(q)) score += 1
  if (/매주|주마다/.test(q)) score += 1
  if (CREATE_RE.test(q) || DELETE_RE.test(q) || QUERY_RE.test(q) || /일정|스케줄|시간표/.test(q)) score += 1
  if (KIND_RE.test(q)) score += 1
  return score >= 2
}

async function handleQuery(input: {
  question: string
  userId?: string | null
  now: Date
  intentCode: ScheduleIntentCode
}): Promise<ScheduleIntentResult> {
  const targetDay = resolveTargetDay(input.question, input.now)
  const time = parseTimeLocal(input.question)
  const dayLabel = `${targetDay.getMonth() + 1}/${targetDay.getDate()}(${WEEKDAY_LABEL[targetDay.getDay()].replace('요일', '')})`

  if (!input.userId) {
    return {
      handled: true,
      intentCode: input.intentCode,
      answer: '로그인하면 내 일정을 바로 확인해 드릴게요.',
      badge: '일정 안내',
      scheduleAction: { status: 'need_login', weekday: targetDay.getDay(), start: time?.start, end: time?.end },
    }
  }

  const raw = await getSchedules(input.userId)
  const dayItems = projectOntoDay(raw || [], targetDay)
  let hits = dayItems
  if (time) {
    const a0 = toMin(time.start)
    const a1 = toMin(time.end)
    hits = dayItems.filter((item) => {
      const s = new Date(item.startAt)
      const e = new Date(item.endAt || item.startAt)
      const b0 = s.getHours() * 60 + s.getMinutes()
      let b1 = e.getHours() * 60 + e.getMinutes()
      if (b1 <= b0) b1 = b0 + 60
      return overlapMins(a0, a1, b0, b1)
    })
  }

  const listLine = (items: any[]) => items
    .map((it) => `· ${hmLabel(it.startAt)}~${hmLabel(it.endAt)} 「${classTitle(it.title)}」`)
    .join('\n')

  if (time && hits.length === 0) {
    const when = `${dayLabel} ${time.start}`
    return {
      handled: true,
      intentCode: input.intentCode,
      answer:
        `${when}쯤에는 등록된 일정이 없어요. 비어 있으니 약속·밥·스터디를 잡아볼까요?`,
      badge: '일정 조회',
      choices: offerCreateChoices(targetDay),
      scheduleAction: {
        status: 'queried',
        weekday: targetDay.getDay(),
        start: time.start,
        end: time.end,
      },
    }
  }

  if (!time) {
    if (!dayItems.length) {
      return {
        handled: true,
        intentCode: input.intentCode,
        answer: `${dayLabel}에는 등록된 일정이 없어요. 약속 하나 잡아둘까요?`,
        badge: '일정 조회',
        choices: offerCreateChoices(targetDay),
        scheduleAction: { status: 'queried', weekday: targetDay.getDay() },
      }
    }
    return {
      handled: true,
      intentCode: input.intentCode,
      answer: `${dayLabel} 일정이에요.\n${listLine(dayItems)}\n\n빈 시간에 약속 잡을까요?`,
      badge: '일정 조회',
      choices: offerCreateChoices(targetDay),
      scheduleAction: { status: 'queried', weekday: targetDay.getDay() },
    }
  }

  return {
    handled: true,
    intentCode: input.intentCode,
    answer:
      `${dayLabel} ${time.start}쯤 일정이 있어요.\n${listLine(hits)}\n\n다른 시간에 약속 잡을까요?`,
    badge: '일정 조회',
    choices: offerCreateChoices(targetDay),
    scheduleAction: {
      status: 'queried',
      weekday: targetDay.getDay(),
      start: time.start,
      end: time.end,
    },
  }
}

async function handleDelete(input: {
  question: string
  userId?: string | null
  now: Date
  intentCode: ScheduleIntentCode
}): Promise<ScheduleIntentResult> {
  const weekday = parseWeekdayLocal(input.question)
    ?? (/오늘|내일|모레/.test(input.question) ? resolveTargetDay(input.question, input.now).getDay() : null)
  const time = parseTimeLocal(input.question)
  const titleHint = guessTitle(input.question)
  const wantsKind = KIND_RE.test(input.question)

  if (!input.userId) {
    return {
      handled: true,
      intentCode: input.intentCode,
      answer: '로그인하면 개인 일정을 삭제할 수 있어요. (수업은 챗봇으로 지울 수 없어요)',
      badge: '일정 안내',
      scheduleAction: { status: 'need_login', title: titleHint, weekday: weekday ?? undefined, start: time?.start, end: time?.end },
    }
  }

  if (weekday == null && !time && !wantsKind) {
    return {
      handled: true,
      intentCode: input.intentCode,
      answer: '어떤 일정을 지울까요? 예: 「화요일 13시 약속 없애줘」',
      badge: '일정 안내',
      scheduleAction: { status: 'need_clarify', title: titleHint },
    }
  }

  const existing = await getSchedules(input.userId)
  const candidates = (existing || []).filter((item: any) => {
    if (!item?.startAt) return false
    const src = new Date(item.startAt)
    const srcEnd = new Date(item.endAt || item.startAt)
    if (weekday != null && src.getDay() !== weekday) return false
    if (time) {
      const b0 = src.getHours() * 60 + src.getMinutes()
      let b1 = srcEnd.getHours() * 60 + srcEnd.getMinutes()
      if (b1 <= b0) b1 = b0 + 60
      if (!overlapMins(toMin(time.start), toMin(time.end), b0, b1)) return false
    }
    if (wantsKind) {
      const t = classTitle(item.title || '')
      if (!KIND_RE.test(t) && !t.includes(titleHint) && titleHint !== '개인 일정') {
        // 제목에 스터디 등이 없어도 시간·요일이 맞으면 후보로 둠 (아래 protected 분기)
      }
    }
    return true
  })

  const protectedHits = candidates.filter(isProtectedClass)
  const deletable = candidates.filter(isChatDeletable)

  if (deletable.length === 0) {
    if (protectedHits.length > 0) {
      const names = protectedHits.map((h: any) => `「${classTitle(h.title)}」`).join(', ')
      return {
        handled: true,
        intentCode: input.intentCode,
        answer: `${names} 수업은 챗봇으로 삭제할 수 없어요. 일정 탭에서 수업 등록을 관리해 주세요. 개인 일정(약속·스터디 등)만 삭제할 수 있어요.`,
        badge: '일정 안내',
        scheduleAction: {
          status: 'conflict',
          title: classTitle(protectedHits[0].title),
          weekday: weekday ?? undefined,
          start: time?.start,
          end: time?.end,
        },
      }
    }
    const when = [
      weekday != null ? WEEKDAY_LABEL[weekday] : '',
      time ? `${time.start}~${time.end}` : '',
      wantsKind ? `「${titleHint}」` : '',
    ].filter(Boolean).join(' ')
    return {
      handled: true,
      intentCode: input.intentCode,
      answer: `${when || '해당'} 개인 일정을 찾지 못했어요. 일정 탭에서 한 번 확인해 볼까요?`,
      badge: '일정 안내',
      scheduleAction: { status: 'queried', title: titleHint, weekday: weekday ?? undefined, start: time?.start, end: time?.end },
    }
  }

  if (deletable.length > 1 && !time) {
    return {
      handled: true,
      intentCode: input.intentCode,
      answer: '여러 건이 있어요. 지울 일정을 골라 주세요.',
      badge: '일정 안내',
      choices: deletable.slice(0, 6).map((item: any) => {
        const src = new Date(item.startAt)
        const srcEnd = new Date(item.endAt || item.startAt)
        const day = WEEKDAY_LABEL[src.getDay()]
        const s = fromMin(src.getHours() * 60 + src.getMinutes())
        const e = fromMin(srcEnd.getHours() * 60 + srcEnd.getMinutes())
        return `${day} ${s}~${e} 「${classTitle(item.title)}」 일정 삭제`
      }),
      scheduleAction: { status: 'need_clarify', title: titleHint, weekday: weekday ?? undefined },
    }
  }

  const removed: string[] = []
  for (const item of deletable) {
    await deleteSchedule(input.userId, item.id)
    const src = new Date(item.startAt)
    const srcEnd = new Date(item.endAt || item.startAt)
    const s = fromMin(src.getHours() * 60 + src.getMinutes())
    const e = fromMin(srcEnd.getHours() * 60 + srcEnd.getMinutes())
    removed.push(`${WEEKDAY_LABEL[src.getDay()]} ${s}~${e} 「${classTitle(item.title)}」`)
  }

  const classNote = protectedHits.length
    ? `\n(같은 시간에 있는 수업 ${protectedHits.map((h: any) => `「${classTitle(h.title)}」`).join(', ')}은 그대로 두었어요.)`
    : ''

  return {
    handled: true,
    intentCode: input.intentCode,
    answer: `${removed.join(', ')} 일정을 삭제했어요.${classNote}`,
    badge: '일정 삭제',
    scheduleAction: {
      status: 'deleted',
      title: classTitle(deletable[0].title),
      weekday: weekday ?? new Date(deletable[0].startAt).getDay(),
      start: time?.start,
      end: time?.end,
    },
  }
}

async function handleCreate(input: {
  question: string
  userId?: string | null
  now: Date
  intentCode: ScheduleIntentCode
}): Promise<ScheduleIntentResult> {
  const gptSlots = await extractScheduleSlots(input.question, input.now)
  const slots = mergeSlots(gptSlots, input.question, input.now)
  const title = slots.title || guessTitle(input.question)
  const weekday = slots.weekday

  if (weekday == null) {
    return {
      handled: true,
      intentCode: input.intentCode,
      answer: '어느 요일에 넣을까요? 예: 「목요일 18시 친구랑 밥 등록」',
      badge: '일정 안내',
      choices: ['월요일', '화요일', '수요일', '목요일', '금요일'].map(
        (d) => `${d} ${title} 일정 등록할래`,
      ),
      scheduleAction: { status: 'need_clarify', title },
    }
  }

  if (!slots.start) {
    return {
      handled: true,
      intentCode: input.intentCode,
      answer:
        `${WEEKDAY_LABEL[weekday]} 「${title}」 일정이네요. 시간을 골라 주시면 시간표에 바로 넣을게요.`,
      badge: '일정 안내',
      choices: clarifyChoices(weekday, title),
      scheduleAction: { status: 'need_clarify', title, weekday },
    }
  }

  let startMin = toMin(slots.start)
  let endMin = slots.end ? toMin(slots.end) : startMin + 60
  if (endMin <= startMin) endMin = startMin + 60
  const start = fromMin(startMin)
  const end = fromMin(endMin)
  const repeatWeekly = slots.repeatWeekly === true || /매주|주마다/.test(input.question)
  const scheduleType = resolveChatScheduleType(input.question, repeatWeekly)

  if (!input.userId) {
    return {
      handled: true,
      intentCode: input.intentCode,
      answer: '로그인하면 일정을 바로 등록할 수 있어요.',
      badge: '일정 안내',
      scheduleAction: { status: 'need_login', title, weekday, start, end },
    }
  }

  const existing = await getSchedules(input.userId)
  const hit = (existing || []).find((item: any) => {
    if (!item?.startAt) return false
    // 실제 수업만 충돌 — 잘못 CLASS로 남은 스터디·약속 등은 등록 막지 않음
    if (!isProtectedClass(item)) return false
    const src = new Date(item.startAt)
    const srcEnd = new Date(item.endAt || item.startAt)
    if (src.getDay() !== weekday) return false
    const b0 = src.getHours() * 60 + src.getMinutes()
    let b1 = srcEnd.getHours() * 60 + srcEnd.getMinutes()
    if (b1 <= b0) b1 = b0 + 60
    return overlapMins(startMin, endMin, b0, b1)
  })

  if (hit) {
    return {
      handled: true,
      intentCode: input.intentCode,
      answer: `${WEEKDAY_LABEL[weekday]} ${start}~${end}에 「${classTitle(hit.title)}」 수업이 있어 등록이 어려워요. 다른 시간을 골라 볼까요?`,
      badge: '일정 안내',
      choices: clarifyChoices(weekday, title).filter((c) => !c.includes(`${start}~${end}`)),
      scheduleAction: { status: 'conflict', title, weekday, start, end },
    }
  }

  const { startAt } = nextOccurrence(input.now, weekday, startMin, endMin)
  await createSchedule(input.userId, {
    title,
    type: scheduleType,
    startAt: toWallClockIso(startAt, start),
    endAt: toWallClockIso(startAt, end),
  })

  const when = `${WEEKDAY_LABEL[weekday]} ${start}~${end}`
  const extra = scheduleType === 'WEEKLY' ? '매주 반복으로 ' : ''
  const where =
    scheduleType === 'TASK' ? '과제/마감으로 '
      : scheduleType === 'CLASS' ? '수업으로 '
        : '개인 일정으로 '
  return {
    handled: true,
    intentCode: input.intentCode,
    answer: `${when} 「${title}」을 ${where}${extra}등록했어요. 일정 탭에서 확인할 수 있어요.`,
    badge: '일정 등록',
    scheduleAction: { status: 'created', title, weekday, start, end },
  }
}

export async function tryHandleScheduleIntent(input: {
  question: string
  userId?: string | null
  now: Date
  /** 라우터에서 이미 분류한 코드 (중복 GPT 호출 방지) */
  intentCode?: ScheduleIntentCode
}): Promise<ScheduleIntentResult> {
  const gptCode = input.intentCode != null
    ? null
    : await classifyScheduleCode(input.question, input.now)
  const code: ScheduleIntentCode = input.intentCode
    ?? gptCode
    ?? classifyScheduleCodeLocal(input.question)

  if (code === 0 || code === 4) {
    return { handled: false, intentCode: code }
  }

  // 삭제 키워드면 GPT가 2로 오분류해도 삭제 우선
  if (DELETE_RE.test(input.question) || code === 5) {
    if (!looksLikeScheduleCandidate(input.question) && !DELETE_RE.test(input.question)) {
      return { handled: false, intentCode: code }
    }
    return handleDelete({ ...input, intentCode: 5 })
  }

  if (!looksLikeScheduleCandidate(input.question) && input.intentCode == null) {
    return { handled: false, intentCode: code }
  }

  if (code === 1) {
    return handleQuery({ ...input, intentCode: 1 })
  }

  if (code === 3) {
    const day = resolveTargetDay(input.question, input.now)
    return {
      handled: true,
      intentCode: 3,
      answer: '일정을 확인할까요, 등록할까요, 아니면 지울까요?',
      badge: '일정 안내',
      choices: [
        `${WEEKDAY_LABEL[day.getDay()].replace('요일', '')}요일 일정 알려줘`,
        ...offerCreateChoices(day).slice(0, 2),
        `${WEEKDAY_LABEL[day.getDay()]} 약속 없애줘`,
      ],
      scheduleAction: { status: 'need_clarify', weekday: day.getDay() },
    }
  }

  // code === 2
  return handleCreate({ ...input, intentCode: 2 })
}
