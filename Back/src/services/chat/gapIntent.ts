import { getTasks } from '../task.service'
import { getSchedules } from '../schedule.service'

function isCyberLecture(task: { title?: string; type?: string; category?: string } | null | undefined) {
  const hay = `${task?.title || ''} ${task?.type || ''} ${task?.category || ''}`
  return /사이버|사강|온라인\s*강의|출석\s*영상|동영상\s*강의/.test(hay)
}

export type GapIntentResult = {
  handled: boolean
  answer?: string
  badge?: string
  sourceUrl?: string | null
  choices?: string[]
}

/** 공강·과제 추천·어디서 할지 의견 (일정 등록 아님). 단독 「추천」은 제외 */
const RECOMMEND_RE =
  /과제\s*추천|공강\s*추천|시간\s*추천|장소\s*추천|뭐\s*하|뭐하|어떻게\s*보내|시간\s*짜|짜\s*(줘|달|봐|주)|짜줘|짜달|계획|루틴|붕\s*뜨|붕뜨|남는\s*시간|비는\s*시간|빈\s*시간|틈새|공강|다음\s*수업\s*전|수업\s*(끝나|끝나고|후|뒤)|어디서|어디\s*서|어디가\s*좋|하면\s*좋|좋을까|좋을지|할\s*과제|과제\s*(할|해)|사강|사이버|남는\s*틈/
const GAP_EXCLUDE_RE = /공지|뉴스|대회|모집|채용|장학|날씨|헤드라인|페스티벌|인턴/

/** 오늘 일정에 밥/식사 슬롯을 언제 넣을지 */
const MEAL_SLOT_RE = /밥|식사|점심|저녁|학식|밥약|밥\s*먹|런치|디너/

const STUDY_PLACES = [
  { name: '백석학술정보관 열람실', tip: '좌석·집중용 · 클리커로 좌석 선택' },
  { name: '본부동 창업카페', tip: '음료 없이도 이용 · 노트북·PC' },
  { name: '진리관 1층·지하 학습존', tip: '수업 직후 가깝고 짧게 앉기 좋음' },
  { name: '목양관 2층 라운지', tip: '조용히 과제용' },
  { name: '기숙사 1층 라운지', tip: '밤·늦게까지 남았을 때' },
]

const LUNCH_FROM = 11 * 60
const LUNCH_TO = 14 * 60
const DINNER_FROM = 17 * 60
const DINNER_TO = 20 * 60
const MEAL_BLOCK = 50 // 식사+이동 여유

function isMealSlotQuestion(q: string) {
  if (!MEAL_SLOT_RE.test(q)) return false
  // 밥만 말하고 과제 추천이면 일반 추천으로
  if (/과제|사강|사이버/.test(q) && !/몇\s*시|언제|추가|넣|슬롯|비어/.test(q)) return false
  return /몇\s*시|언제|추가|넣|넣을|넣으|좋을|추천|시간|비어|틈|공강|일정|시간표/.test(q)
    || /밥\s*언제|식사\s*언제|점심\s*언제|저녁\s*언제/.test(q)
}

function isRecommendQuestion(q: string) {
  if (/등록해|넣어\s*줘|넣어줘|추가해|스케줄에\s*넣|일정에\s*넣|시간표에\s*넣/.test(q)
    && !isMealSlotQuestion(q)) {
    return false
  }
  if (isMealSlotQuestion(q)) return true
  if (GAP_EXCLUDE_RE.test(q) && !/공강|과제|사강|시간\s*짜|뭐\s*하/.test(q)) return false
  // 단독 「추천」만 있으면 공지·일반 추천과 섞이므로 과제/공강 맥락 필요
  if (/추천/.test(q) && !RECOMMEND_RE.test(q) && !/과제|공강|사강|사이버|시간|장소|어디|짜|계획|틈|붕|뭐\s*하/.test(q)) {
    return false
  }
  return RECOMMEND_RE.test(q)
}

function nextFreeSlot(
  cursor: number,
  duration: number,
  busy: { startMin: number; endMin: number }[],
  dayEnd = 22 * 60,
) {
  let t = Math.max(cursor, 9 * 60)
  while (t + duration <= dayEnd) {
    if (!overlapsBusy(t, t + duration, busy)) return t
    const hit = busy.find((b) => t < b.endMin && t + duration > b.startMin)
    if (!hit) return t
    t = hit.endMin + 5
  }
  return null
}

export function looksLikeGapCandidate(question: string) {
  return isRecommendQuestion(String(question || ''))
}

function weekdayLabel(d: Date) {
  return ['일', '월', '화', '수', '목', '금', '토'][d.getDay()]
}

function parseTargetWeekday(q: string, now: Date): number | null {
  const map: Record<string, number> = { 일: 0, 월: 1, 화: 2, 수: 3, 목: 4, 금: 5, 토: 6 }
  const m = q.match(/([월화수목금토일])(?:요일)?/)
  if (m) return map[m[1]]
  if (/오늘/.test(q)) return now.getDay()
  if (/내일/.test(q)) return (now.getDay() + 1) % 7
  return null
}

function nextDateOnWeekday(now: Date, weekday: number) {
  const d = new Date(now)
  d.setHours(12, 0, 0, 0)
  const diff = (weekday - d.getDay() + 7) % 7
  d.setDate(d.getDate() + (diff === 0 && now.getHours() >= 20 ? 7 : diff))
  return d
}

function hm(totalMin: number) {
  const h = Math.floor(((totalMin % (24 * 60)) + 24 * 60) % (24 * 60) / 60)
  const m = ((totalMin % 60) + 60) % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function dueLabel(due: Date, now: Date) {
  const same = due.toDateString() === now.toDateString()
  if (same) return `오늘 ${hm(due.getHours() * 60 + due.getMinutes())}`
  return `${due.getMonth() + 1}/${due.getDate()}(${weekdayLabel(due)})`
}

function pickPlace(seed: number, night: boolean) {
  const pool = night
    ? STUDY_PLACES.filter((p) => /기숙사|창업|열람/.test(p.name))
    : STUDY_PLACES
  return pool[Math.abs(seed) % pool.length] || STUDY_PLACES[0]
}

/** DB naive / Z 붙은 시각에서 시·분만 추출 */
function wallParts(raw: string) {
  const m = String(raw || '').match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})/)
  if (!m) return null
  const local = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0, 0)
  return { hours: Number(m[4]), minutes: Number(m[5]), dow: local.getDay() }
}

function projectOntoDay(schedules: any[], targetDay: Date) {
  const day = new Date(targetDay.getFullYear(), targetDay.getMonth(), targetDay.getDate(), 12)
  const dow = day.getDay()
  const dayKey = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`
  const out: { title: string; startMin: number; endMin: number; type?: string }[] = []
  for (const item of schedules || []) {
    if (!item?.startAt) continue
    const wall = wallParts(item.startAt)
    const wallEnd = wallParts(item.endAt || item.startAt)
    const startSrc = new Date(item.startAt)
    const endSrc = new Date(item.endAt || item.startAt)
    if (Number.isNaN(startSrc.getTime())) continue

    if (item.type === 'CLASS' || item.type === 'WEEKLY' || !item.type) {
      const srcDow = wall ? wall.dow : startSrc.getDay()
      if (srcDow !== dow) continue
      const sh = wall ? wall.hours : startSrc.getHours()
      const sm = wall ? wall.minutes : startSrc.getMinutes()
      let eh = wallEnd ? wallEnd.hours : endSrc.getHours()
      let em = wallEnd ? wallEnd.minutes : endSrc.getMinutes()
      let startMin = sh * 60 + sm
      let endMin = eh * 60 + em
      if (endMin <= startMin) endMin = startMin + 60
      out.push({ title: String(item.title || '일정'), startMin, endMin, type: item.type })
      continue
    }
    const srcKey = `${startSrc.getFullYear()}-${String(startSrc.getMonth() + 1).padStart(2, '0')}-${String(startSrc.getDate()).padStart(2, '0')}`
    if (srcKey === dayKey) {
      const startMin = startSrc.getHours() * 60 + startSrc.getMinutes()
      let endMin = endSrc.getHours() * 60 + endSrc.getMinutes()
      if (endMin <= startMin) endMin = startMin + 60
      out.push({ title: String(item.title || '일정'), startMin, endMin, type: item.type })
    }
  }
  return out.sort((a, b) => a.startMin - b.startMin)
}

function overlapsBusy(start: number, end: number, busy: { startMin: number; endMin: number }[]) {
  return busy.some((b) => start < b.endMin && end > b.startMin)
}

function findMealSlots(
  busy: { startMin: number; endMin: number; title: string }[],
  windowFrom: number,
  windowTo: number,
  preferAfter: number,
) {
  const candidates: { start: number; end: number; reason: string }[] = []
  // 1) 수업 사이 공강이 식사 창과 겹치면 그 공강 시작+5분
  for (let i = 0; i < busy.length - 1; i += 1) {
    const gapStart = busy[i].endMin
    const gapEnd = busy[i + 1].startMin
    const gap = gapEnd - gapStart
    if (gap < MEAL_BLOCK) continue
    const start = Math.max(gapStart + 5, windowFrom)
    const end = start + MEAL_BLOCK
    if (end <= Math.min(gapEnd - 5, windowTo) && start >= windowFrom) {
      candidates.push({
        start,
        end,
        reason: `「${busy[i].title.replace(/\s*\([^)]*\)\s*$/, '')}」 끝나고 「${busy[i + 1].title.replace(/\s*\([^)]*\)\s*$/, '')}」 전 공강`,
      })
    }
  }
  // 2) 창 안에서 비는 정시 슬롯
  for (let t = windowFrom; t + MEAL_BLOCK <= windowTo; t += 15) {
    if (t + MEAL_BLOCK <= preferAfter) continue
    if (overlapsBusy(t, t + MEAL_BLOCK, busy)) continue
    if (candidates.some((c) => Math.abs(c.start - t) < 20)) continue
    candidates.push({
      start: t,
      end: t + MEAL_BLOCK,
      reason: '등록된 수업·일정과 안 겹침',
    })
    if (candidates.length >= 4) break
  }
  return candidates.slice(0, 3)
}

type TaskRow = {
  id?: string
  title?: string
  dueAt?: string
  done?: boolean
  status?: string
}

async function loadOpenTasks(userId?: string | null): Promise<TaskRow[]> {
  if (!userId) return []
  try {
    const rows = await getTasks(userId)
    const list = Array.isArray(rows) ? rows : []
    const now = Date.now()
    return list
      .filter((t: TaskRow) => {
        if (t.done === true) return false
        const st = String(t.status || '').toUpperCase()
        if (st === 'COMPLETED' || st === 'DONE' || st === 'SUBMITTED') return false
        if (!t.dueAt) return true
        const due = new Date(t.dueAt).getTime()
        if (Number.isNaN(due)) return true
        return due >= now - 3 * 86400000 && due <= now + 14 * 86400000
      })
      .sort((a: TaskRow, b: TaskRow) => {
        const da = a.dueAt ? new Date(a.dueAt).getTime() : Infinity
        const db = b.dueAt ? new Date(b.dueAt).getTime() : Infinity
        return da - db
      })
      .slice(0, 5)
  } catch {
    return []
  }
}

function shortTitle(title = '') {
  const raw = String(title).trim()
  const m = raw.match(/^(.+?)\s*·\s*(\d+주차)/)
  if (m) return `${m[1].trim()} ${m[2]}`
  return raw.length > 28 ? `${raw.slice(0, 28)}…` : raw
}

async function handleMealSlotIntent(input: {
  question: string
  now: Date
  userId?: string | null
}): Promise<GapIntentResult> {
  const q = input.question
  const now = input.now
  const targetWd = parseTargetWeekday(q, now)
  const day = targetWd == null ? now : nextDateOnWeekday(now, targetWd)
  const dayLabel = /오늘/.test(q)
    ? '오늘'
    : /내일/.test(q)
      ? '내일'
      : targetWd != null
        ? `${weekdayLabel(day)}요일`
        : '오늘'

  const namedLunch = /점심|런치/.test(q)
  const namedDinner = /저녁|디너/.test(q)
  const windows: { label: string; from: number; to: number }[] = []
  if (namedLunch && !namedDinner) {
    windows.push({ label: '점심', from: LUNCH_FROM, to: LUNCH_TO })
  } else if (namedDinner && !namedLunch) {
    windows.push({ label: '저녁', from: DINNER_FROM, to: DINNER_TO })
  } else if (now.getHours() < 15) {
    // 「밥」만 → 지금이 오전이면 점심 우선, 저녁도 한 줄
    windows.push({ label: '점심', from: LUNCH_FROM, to: LUNCH_TO })
    windows.push({ label: '저녁', from: DINNER_FROM, to: DINNER_TO })
  } else {
    windows.push({ label: '저녁', from: DINNER_FROM, to: DINNER_TO })
  }

  let busy: { title: string; startMin: number; endMin: number }[] = []
  if (input.userId) {
    try {
      const raw = await getSchedules(input.userId)
      busy = projectOntoDay(Array.isArray(raw) ? raw : [], day)
    } catch {
      busy = []
    }
  }

  const preferAfter = day.toDateString() === now.toDateString()
    ? now.getHours() * 60 + now.getMinutes()
    : 0

  const lines: string[] = [
    `${dayLabel} 일정 기준으로 **밥 넣기 좋은 시각**을 골랐어요.`,
    '',
  ]

  if (busy.length) {
    lines.push('그날 잡혀 있는 일정:')
    for (const b of busy.slice(0, 8)) {
      lines.push(`· ${hm(b.startMin)}–${hm(b.endMin)} ${shortTitle(b.title)}`)
    }
    lines.push('')
  } else {
    lines.push(
      input.userId
        ? '그날 등록된 수업·일정이 거의 없어요. 일반 식사 시간대로 제안할게요.'
        : '로그인하면 내 시간표 공강에 맞춰 더 정확히 짜 줄게요. 일단 흔한 식사 시간대로 제안해요.',
      '',
    )
  }

  let any = false
  for (const w of windows) {
    const slots = findMealSlots(busy, w.from, w.to, preferAfter)
    if (!slots.length) {
      lines.push(`· ${w.label}: ${hm(w.from)}–${hm(w.to)} 창 안에 비는 ${MEAL_BLOCK}분 자리를 못 찾았어요.`)
      continue
    }
    any = true
    lines.push(`【${w.label} 추천】`)
    slots.forEach((s, i) => {
      lines.push(
        `${i + 1}. **${hm(s.start)}–${hm(s.end)}** (${s.reason})`,
      )
    })
    lines.push('')
  }

  if (!any) {
    lines.push('비는 식사 틈이 빡빡해요. 수업 직후 20~30분만 짧게 편의점·학식으로 해결하는 것도 방법이에요.')
  } else {
    lines.push('학식은 보통 11:00~13:30이 붐벼요. 여유 있으면 그 전·후가 편합니다.')
  }

  const top = findMealSlots(busy, windows[0].from, windows[0].to, preferAfter)[0]
  lines.push('')
  if (top) {
    lines.push(
      `캘린더에 넣으려면 예: 「${dayLabel} ${hm(top.start)}에 밥 일정 등록」`,
    )
  } else {
    lines.push('등록하려면 「오늘 12시에 밥 일정 등록」처럼 말해 주세요.')
  }

  return {
    handled: true,
    badge: '비서 추천 · 식사 시간',
    answer: lines.join('\n'),
    choices: top
      ? [
          `${dayLabel} ${hm(top.start)}에 밥 일정 등록`,
          '저녁은 몇 시가 좋아?',
          '학식 어디야',
        ]
      : ['학식 어디야', '오늘 일정 있어?', '과제 추천'],
  }
}

/**
 * 과제·공강·장소 의견 → 비서처럼 시간표를 「말로」짜 줌 (DB 일정 등록 아님)
 * 밥/식사 시각 질문은 오늘 시간표 공강 기준으로 따로 답함
 */
export async function tryHandleGapIntent(input: {
  question: string
  now?: Date
  userId?: string | null
}): Promise<GapIntentResult> {
  const question = String(input.question || '')
  if (!looksLikeGapCandidate(question)) return { handled: false }

  const now = input.now || new Date()
  const q = question

  if (isMealSlotQuestion(q)) {
    return handleMealSlotIntent({ question: q, now, userId: input.userId })
  }

  const wantPlace = /어디|장소|가서|앉|카페|도서관|열람|라운지/.test(q)
  const wantTask = /과제|사강|사이버|할\s*일|추천|시간\s*짜|짜\s*|계획|붕|공강|수업\s*(끝나|후|뒤)|뭐\s*하/.test(q)
    || (!wantPlace && !MEAL_SLOT_RE.test(q))
  const night = now.getHours() >= 20
  const targetWd = parseTargetWeekday(q, now)
  const day = targetWd == null ? now : nextDateOnWeekday(now, targetWd)
  const dayLabel = targetWd == null
    ? (/오늘|내일/.test(q) ? (/내일/.test(q) ? '내일' : '오늘') : '지금')
    : `${weekdayLabel(day)}요일`

  const tasks = wantTask ? await loadOpenTasks(input.userId) : []
  const seed = Math.floor(now.getTime() / 60000) + q.length
  const place = pickPlace(seed, night)

  let busy: { title: string; startMin: number; endMin: number }[] = []
  if (input.userId) {
    try {
      const raw = await getSchedules(input.userId)
      busy = projectOntoDay(Array.isArray(raw) ? raw : [], day)
    } catch {
      busy = []
    }
  }

  let cursor = now.getHours() * 60 + now.getMinutes() + 10
  if (targetWd != null && targetWd !== now.getDay()) {
    cursor = 9 * 60
  }
  if (/끝나|끝나고|후|뒤|붕/.test(q) && cursor < 12 * 60) cursor = 14 * 60
  cursor = Math.max(cursor, 9 * 60)
  // 지금이 수업 중이면 수업 끝난 뒤부터
  const inClass = busy.find((b) => cursor >= b.startMin && cursor < b.endMin)
  if (inClass) cursor = inClass.endMin + 5

  const lines: string[] = []
  lines.push(
    `${dayLabel} 남는 시간을 이렇게 잡아 봤어요. (일정 등록이 아니라 **추천 타임테이블**이에요.)`,
    '',
  )
  if (busy.length) {
    lines.push('참고 · 그날 수업·일정과 안 겹치게 배치했어요.')
    lines.push('')
  }

  const planRows: string[] = []
  if (wantTask && tasks.length) {
    const pick = tasks.slice(0, 2)
    for (const t of pick) {
      const cyber = isCyberLecture(t)
      const block = cyber ? 40 : 35
      const start = nextFreeSlot(cursor, block, busy)
      if (start == null) {
        planRows.push(`· (빈 틈 부족) 「${shortTitle(t.title)}」은 수업 사이 짧은 공강에 나눠 보세요`)
        continue
      }
      const end = start + block
      const due = t.dueAt ? dueLabel(new Date(t.dueAt), now) : '마감 미확인'
      planRows.push(
        `· ${hm(start)}–${hm(end)} 「${shortTitle(t.title)}」 ${cyber ? '사이버강의' : '과제'} (마감 ${due})`,
      )
      cursor = end + 5
    }
  } else if (wantTask) {
    const block = 40
    const start = nextFreeSlot(cursor, block, busy)
    if (start != null) {
      planRows.push(`· ${hm(start)}–${hm(start + block)} 밀린 사강·과제 LMS에서 1개만 골라 손대기`)
      cursor = start + block + 5
    } else {
      planRows.push('· 오늘은 수업이 빡빡해서 긴 과제 블록을 넣기 어려워요. 짧은 복습만 추천해요.')
    }
  }

  if (wantPlace || wantTask) {
    const stay = 25
    const start = nextFreeSlot(cursor, stay, busy)
    if (start != null) {
      planRows.push(
        `· ${hm(start)}–${hm(start + stay)} ${place.name}에서 이어서 (${place.tip})`,
      )
      cursor = start + stay + 5
    }
  }

  if (!night) {
    const buf = nextFreeSlot(cursor, 30, busy, 18 * 60)
    if (buf != null && buf < 18 * 60) {
      planRows.push(`· ${hm(buf)}–${hm(buf + 30)} 짧은 휴식·이동 (다음 일정 전 버퍼)`)
    }
  } else {
    planRows.push(`· ${hm(Math.max(cursor, 23 * 60))} 전후 취침 준비 (알람·가방만)`)
  }

  if (!planRows.length) {
    planRows.push('· 오늘(그날) 비는 긴 공강이 거의 없어요. 수업 직후 15분만 짧게 사강 1개 듣는 걸 추천해요.')
  }

  lines.push(...planRows)
  lines.push(
    '',
    wantPlace
      ? `장소는 **${place.name}** 을 먼저 추천해요. 다른 곳도 원하면 「도서관」「창업카페」처럼 말해 주세요.`
      : `어디서 할지 궁금하면 「어디서 하면 좋아?」라고 물어봐 주세요.`,
    '',
    '밥 넣을 시각만 궁금하면 「오늘 밥 몇 시가 좋아?」라고 물어보세요. 지금은 과제·공강 추천이에요.',
  )

  return {
    handled: true,
    badge: '비서 추천 · 시간 계획',
    answer: lines.join('\n'),
    choices: [
      '오늘 밥 몇 시가 좋아?',
      '어디서 하면 좋을까?',
      '과제 남은 거 있어?',
      '홈 공강 추천 보기',
    ],
  }
}
