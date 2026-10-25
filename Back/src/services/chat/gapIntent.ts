import { getTasks } from '../task.service'

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

/** 공강·과제 추천·어디서 할지 의견 (일정 등록 아님) */
const RECOMMEND_RE =
  /추천|뭐\s*하|뭐하|어떻게\s*보내|시간\s*짜|짜\s*(줘|달|봐|주)|짜줘|짜달|계획|루틴|붕\s*뜨|붕뜨|남는\s*시간|비는\s*시간|빈\s*시간|틈새|공강|다음\s*수업\s*전|수업\s*(끝나|끝나고|후|뒤)|어디서|어디\s*서|어디가\s*좋|하면\s*좋|좋을까|좋을지|할\s*과제|과제\s*(할|추천)|사강|사이버/

const STUDY_PLACES = [
  { name: '백석학술정보관 열람실', tip: '좌석·집중용 · 클리커로 좌석 선택' },
  { name: '본부동 창업카페', tip: '음료 없이도 이용 · 노트북·PC' },
  { name: '진리관 1층·지하 학습존', tip: '수업 직후 가깝고 짧게 앉기 좋음' },
  { name: '목양관 2층 라운지', tip: '조용히 과제용' },
  { name: '기숙사 1층 라운지', tip: '밤·늦게까지 남았을 때' },
]

function isRecommendQuestion(q: string) {
  if (/등록해|넣어\s*줘|넣어줘|추가해|스케줄에\s*넣|일정에\s*넣|시간표에\s*넣/.test(q)) {
    return false
  }
  return RECOMMEND_RE.test(q)
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
  const h = Math.floor(totalMin / 60) % 24
  const m = totalMin % 60
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

/**
 * 과제·공강·장소 의견 → 비서처럼 시간표를 「말로」짜 줌 (DB 일정 등록 아님)
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
  const wantPlace = /어디|장소|가서|앉|카페|도서관|열람|라운지/.test(q)
  const wantTask = /과제|사강|사이버|할\s*일|추천/.test(q) || !wantPlace
  const night = now.getHours() >= 20
  const targetWd = parseTargetWeekday(q, now)
  const day = targetWd == null ? now : nextDateOnWeekday(now, targetWd)
  const dayLabel = targetWd == null
    ? ( /오늘|내일/.test(q) ? (/내일/.test(q) ? '내일' : '오늘') : '지금' )
    : `${weekdayLabel(day)}요일`

  const tasks = wantTask ? await loadOpenTasks(input.userId) : []
  const seed = Math.floor(now.getTime() / 60000) + q.length
  const place = pickPlace(seed, night)

  // 기본 블록: 수업 직후라고 가정하면 14:00 시작, 아니면 지금+10분
  let cursor = now.getHours() * 60 + now.getMinutes() + 10
  if (targetWd != null && targetWd !== now.getDay()) {
    cursor = 14 * 60 // 해당 요일 오후 가정 (구체 수업 시각 모르면)
  }
  if (/끝나|끝나고|후|뒤|붕/.test(q) && cursor < 12 * 60) cursor = 14 * 60
  cursor = Math.max(cursor, 9 * 60)

  const lines: string[] = []
  lines.push(
    `${dayLabel} 남는 시간을 이렇게 잡아 봤어요. (일정 등록이 아니라 **추천 타임테이블**이에요.)`,
    '',
  )

  const planRows: string[] = []
  if (wantTask && tasks.length) {
    const pick = tasks.slice(0, 2)
    for (const t of pick) {
      const cyber = isCyberLecture(t)
      const block = cyber ? 40 : 35
      const start = cursor
      const end = cursor + block
      const due = t.dueAt ? dueLabel(new Date(t.dueAt), now) : '마감 미확인'
      planRows.push(
        `· ${hm(start)}–${hm(end)} 「${shortTitle(t.title)}」 ${cyber ? '사이버강의' : '과제'} (마감 ${due})`,
      )
      cursor = end + 5
    }
  } else if (wantTask) {
    const start = cursor
    const end = cursor + 40
    planRows.push(`· ${hm(start)}–${hm(end)} 밀린 사강·과제 LMS에서 1개만 골라 손대기`)
    cursor = end + 5
  }

  if (wantPlace || wantTask) {
    const stay = 25
    planRows.push(
      `· ${hm(cursor)}–${hm(cursor + stay)} ${place.name}에서 이어서 (${place.tip})`,
    )
    cursor += stay + 5
  }

  if (!night && cursor < 18 * 60) {
    planRows.push(`· ${hm(cursor)}–${hm(cursor + 30)} 짧은 휴식·이동 (다음 일정 전 버퍼)`)
  } else if (night) {
    planRows.push(`· ${hm(Math.max(cursor, 23 * 60))} 전후 취침 준비 (알람·가방만)`)
  }

  lines.push(...planRows)
  lines.push(
    '',
    wantPlace
      ? `장소는 **${place.name}** 을 먼저 추천해요. 다른 곳도 원하면 「도서관」「창업카페」처럼 말해 주세요.`
      : `어디서 할지 궁금하면 「어디서 하면 좋아?」라고 물어봐 주세요.`,
    '',
    '이 블록을 캘린더에 넣고 싶으면 「목요일 15시에 과제 등록」처럼 말해 주세요. 지금은 추천만 했어요.',
  )

  return {
    handled: true,
    badge: '비서 추천 · 시간 계획',
    answer: lines.join('\n'),
    choices: [
      '어디서 하면 좋을까?',
      '과제 남은 거 있어?',
      '다른 코스 추천',
      '홈 공강 추천 보기',
    ],
  }
}
