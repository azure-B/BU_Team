import {
  detectShuttleStop,
  nextTrips,
  parseHm,
  SHUTTLE_CONTACT,
  SHUTTLE_STOP_LABEL,
  type ShuttleStop,
} from '../../data/shuttleTimetable'
import { ELEVATOR_WAIT_RULES } from '../../data/elevatorWaitSlots'
import { walkMinutesBetween } from '../../data/campusBuildings'

export type ShuttleIntentResult = {
  handled: boolean
  answer?: string
  badge?: string
  sourceUrl?: string | null
  choices?: string[]
}

const SHUTTLE_HINT_RE =
  /셔틀|통학\s*버스|통학버스|스쿨버스|교대.*버스|두정.*버스|버스.*다음|다음\s*차/

function periodStartMinutes(q: string): number | null {
  if (/1\s*교시|한\s*교시/.test(q)) return 9 * 60
  if (/2\s*교시/.test(q)) return 10 * 60 + 30
  if (/3\s*교시/.test(q)) return 12 * 60
  const m = q.match(/(\d{1,2})\s*시/)
  if (m) return Number(m[1]) * 60
  return null
}

function detectBuildingName(q: string): string | null {
  if (/본부동|본부관|본부/.test(q)) return '본부동'
  if (/진리관|진리/.test(q)) return '진리관'
  if (/창조관|창조/.test(q)) return '창조관'
  if (/목양관|목양/.test(q)) return '목양관'
  if (/백석홀|대강당/.test(q)) return '백석홀'
  if (/지혜관|지혜/.test(q)) return '지혜관'
  return null
}

function elevWait(buildingName: string) {
  const rule = (ELEVATOR_WAIT_RULES as Record<string, { high?: number; low?: number }>)[buildingName]
  return rule?.high ?? rule?.low ?? 3
}

export function looksLikeShuttleCandidate(question: string) {
  return SHUTTLE_HINT_RE.test(String(question || ''))
}

export async function tryHandleShuttleIntent(input: {
  question: string
  now?: Date
}): Promise<ShuttleIntentResult> {
  const question = String(input.question || '')
  if (!looksLikeShuttleCandidate(question)) {
    return { handled: false }
  }

  const now = input.now || new Date()
  const stopMention = detectShuttleStop(question)
  // 「교대 가는 통학버스」→ 캠퍼스→교대. 「교대에서」「교대 타는」→ 교대→캠퍼스
  const goingToStop = /가는|까지|행/.test(question) && stopMention && stopMention !== 'campus'
    && !/에서|타는|타고|승차/.test(question)

  if (goingToStop) {
    const dest = stopMention as ShuttleStop
    const upcoming = nextTrips('campus', now, dest, 3)
    if (!upcoming.length) {
      return {
        handled: true,
        badge: '셔틀 안내',
        sourceUrl: SHUTTLE_CONTACT.sourceUrl,
        answer:
          `지금 시각 기준 ${SHUTTLE_STOP_LABEL[dest]} 행 시드 배차가 없어요.\n`
          + `문의: ${SHUTTLE_CONTACT.office} ${SHUTTLE_CONTACT.phone}\n`
          + SHUTTLE_CONTACT.note,
        choices: ['두정역 다음 셔틀', '교대 다음 셔틀'],
      }
    }
    const lines = upcoming.map((t, i) =>
      `${i + 1}. ${t.departAt} 출발 → ${t.arriveAt} 도착 (${t.routeLabel})`,
    )
    return {
      handled: true,
      badge: '셔틀 안내',
      sourceUrl: SHUTTLE_CONTACT.sourceUrl,
      answer:
        `캠퍼스 → ${SHUTTLE_STOP_LABEL[dest]} 다음 차예요.\n\n`
        + `${lines.join('\n')}\n\n`
        + `문의: ${SHUTTLE_CONTACT.office} ${SHUTTLE_CONTACT.phone}`,
      choices: upcoming.map((t) => `${t.departAt} ${t.routeLabel}`),
    }
  }

  const from: ShuttleStop = stopMention === 'gyodae'
    ? 'gyodae'
    : stopMention === 'doojeong'
      ? 'doojeong'
      : /교대/.test(question) ? 'gyodae' : 'doojeong'

  const classMin = periodStartMinutes(question)
  const buildingName = detectBuildingName(question)
  const upcoming = nextTrips(from, now, 'campus', 5)

  if (!upcoming.length) {
    return {
      handled: true,
      badge: '셔틀 안내',
      sourceUrl: SHUTTLE_CONTACT.sourceUrl,
      answer:
        `${SHUTTLE_STOP_LABEL[from]} 출발 시드 배차를 찾지 못했어요.\n`
        + `문의: ${SHUTTLE_CONTACT.office} ${SHUTTLE_CONTACT.phone}\n`
        + SHUTTLE_CONTACT.note,
    }
  }

  if (classMin != null && buildingName) {
    // 하차 ≈ 진리관 인근 가정 → 목표 건물 도보
    const walk = walkMinutesBetween('진리관', buildingName)
      ?? walkMinutesBetween('본부동', buildingName)
      ?? 8
    const elev = elevWait(buildingName)
    const buffer = walk + elev + 5
    const needArriveBy = classMin - buffer
    const ok = upcoming.filter((t) => parseHm(t.arriveAt) <= needArriveBy)
    const pick = ok.length ? ok[ok.length - 1] : upcoming[0]
    const late = parseHm(pick.arriveAt) > needArriveBy
    const periodLabel = /1\s*교시/.test(question) ? '1교시(09:00)' : `${Math.floor(classMin / 60)}시`

    return {
      handled: true,
      badge: '셔틀·지각 안내',
      sourceUrl: SHUTTLE_CONTACT.sourceUrl,
      answer:
        `${SHUTTLE_STOP_LABEL[from]} ${pick.departAt} 셔틀을 타면 `
        + `캠퍼스 약 ${pick.arriveAt} 도착 → ${buildingName}까지 도보·엘리베이터 약 ${walk + elev}분 `
        + `(여유 포함 약 ${buffer}분)으로 ${periodLabel} `
        + `${late ? '빠듯하거나 늦을 수 있어요' : '맞춰 가기 좋아요'}.\n\n`
        + (ok.length
          ? `추천: ${SHUTTLE_STOP_LABEL[from]} ${pick.departAt} 승차\n`
          : `가장 가까운 차: ${pick.departAt} (여유 ${buffer}분 기준으로는 더 이른 배가 안전해요)\n`)
        + `문의: ${SHUTTLE_CONTACT.office} ${SHUTTLE_CONTACT.phone}`,
      choices: upcoming.slice(0, 3).map((t) => `${t.departAt} 승차`),
    }
  }

  const lines = upcoming.slice(0, 3).map((t, i) =>
    `${i + 1}. ${t.departAt} 출발 → ${t.arriveAt} 도착 (${t.routeLabel})`,
  )

  return {
    handled: true,
    badge: '셔틀 안내',
    sourceUrl: SHUTTLE_CONTACT.sourceUrl,
    answer:
      `${SHUTTLE_STOP_LABEL[from]}에서 캠퍼스 가는 다음 차예요.\n\n`
      + `${lines.join('\n')}\n\n`
      + `운행은 학기·교통에 따라 달라질 수 있어요.\n`
      + `문의: ${SHUTTLE_CONTACT.office} ${SHUTTLE_CONTACT.phone}\n`
      + SHUTTLE_CONTACT.note,
    choices: [
      '1교시 본부동이면 몇 시 셔틀?',
      '교대 다음 셔틀',
      '두정역 다음 셔틀',
    ],
  }
}
