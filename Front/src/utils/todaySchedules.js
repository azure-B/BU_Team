import { parseDemoTimeParam } from './demoParams'

/** Schedule.title 에서 강의실 괄호 추출 · 표시용 과목명 */
export function parseScheduleTitle(title = '') {
  const room = title.match(/\(([^)]+)\)\s*$/)?.[1] || ''
  const name = title.replace(/\s*\([^)]*\)\s*$/, '').trim() || title
  return { name, room }
}

/** 데모 기준일: 화요일 (2026-10-27) — 계정별 12:30 케이스 */
const DEMO_Y = 2026
const DEMO_M = 9 // 0-indexed October
const DEMO_D = 27

const DOW_LABEL = ['일', '월', '화', '수', '목', '금', '토']

/**
 * 스케줄 문자열에서 벽시계(시·분·요일)만 추출.
 * Supabase가 naive datetime에 Z를 붙여도 13:00 → 13시로 유지 (UTC 변환 방지).
 */
function wallClockParts(raw) {
  const m = String(raw || '').match(
    /^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2}))?/,
  )
  if (!m) return null
  const y = Number(m[1])
  const mo = Number(m[2]) - 1
  const d = Number(m[3])
  const hours = Number(m[4])
  const minutes = Number(m[5])
  const local = new Date(y, mo, d, 12, 0, 0, 0)
  return { hours, minutes, dow: local.getDay() }
}

/**
 * localhost 데모 시각.
 * - 기본: 화 12:30 (계정별 wind-down / 체크인 / 식사·과제 공강 등)
 * - URL `?time=0700` / `?time=12:30` / `?demoTime=10:15` 덮어쓰기
 * - `?time=live` 이면 실제 시·분을 화요일에 얹음
 */
export function getDashboardNow() {
  if (typeof window !== 'undefined') {
    const parsed = parseDemoTimeParam(window.location.search)
    if (parsed?.live) {
      const real = new Date()
      return new Date(DEMO_Y, DEMO_M, DEMO_D, real.getHours(), real.getMinutes(), real.getSeconds(), real.getMilliseconds())
    }
    if (parsed && Number.isFinite(parsed.hours)) {
      return new Date(DEMO_Y, DEMO_M, DEMO_D, parsed.hours, parsed.minutes, 0, 0)
    }
  }
  // 기본 데모: 화요일 오후 12시 30분
  return new Date(DEMO_Y, DEMO_M, DEMO_D, 12, 30, 0, 0)
}

/** 데모 시계 요일 한글 (UI 라벨용) */
export function getDemoDowLabel(date = getDashboardNow()) {
  return DOW_LABEL[date.getDay()] || ''
}

/** 고정 데모 시계 사용 중 (GPS 스킵 등 localhost 테스트용) */
export function isDashboardDemoClock() {
  if (typeof window === 'undefined') return true
  const parsed = parseDemoTimeParam(window.location.search)
  return !(parsed?.live)
}

/**
 * CLASS 일정을 템플릿(요일·시각)으로 보고 targetDay 날짜에 투영한다.
 * 개인 일정(TASK 등)은 같은 달력 날짜만 포함한다.
 */
export function projectSchedulesOntoDay(schedules = [], targetDay = new Date()) {
  const day = new Date(targetDay.getFullYear(), targetDay.getMonth(), targetDay.getDate(), 12)
  const dow = day.getDay()
  const dayKey = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`

  const projected = []
  for (const item of schedules) {
    if (!item?.startAt) continue
    const startSrc = new Date(item.startAt)
    const endSrc = new Date(item.endAt || item.startAt)
    if (Number.isNaN(startSrc.getTime())) continue

    if (item.type === 'CLASS' || item.type === 'WEEKLY' || !item.type) {
      // DB naive 벽시계(…T13:00:00)는 로컬로, 잘못 붙은 Z는 시각 숫자만 써서 투영
      const wall = wallClockParts(item.startAt)
      const wallEnd = wallClockParts(item.endAt || item.startAt)
      const srcDow = wall ? wall.dow : startSrc.getDay()
      if (srcDow !== dow) continue
      const sh = wall ? wall.hours : startSrc.getHours()
      const sm = wall ? wall.minutes : startSrc.getMinutes()
      const eh = wallEnd ? wallEnd.hours : endSrc.getHours()
      const em = wallEnd ? wallEnd.minutes : endSrc.getMinutes()
      const startAt = new Date(day.getFullYear(), day.getMonth(), day.getDate(), sh, sm, 0, 0)
      let endAt = new Date(day.getFullYear(), day.getMonth(), day.getDate(), eh, em, 0, 0)
      if (endAt <= startAt) endAt = new Date(endAt.getTime() + 60 * 60 * 1000)
      const { name, room } = parseScheduleTitle(item.title)
      projected.push({
        ...item,
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        displayTitle: name,
        room,
      })
      continue
    }

    const srcKey = `${startSrc.getFullYear()}-${String(startSrc.getMonth() + 1).padStart(2, '0')}-${String(startSrc.getDate()).padStart(2, '0')}`
    if (srcKey === dayKey) {
      const { name, room } = parseScheduleTitle(item.title)
      projected.push({ ...item, displayTitle: name || item.title, room })
    }
  }

  return projected.sort((a, b) => new Date(a.startAt) - new Date(b.startAt))
}

export function pickNextClass(schedules = [], now = new Date()) {
  if (!schedules.length) return null
  const upcoming = schedules.find((s) => new Date(s.endAt) > now)
  return upcoming || schedules[0]
}

/**
 * 아직 끝나지 않은 다음(또는 진행 중) 수업.
 * skipOngoing=true 이면 진행 중을 건너뛰고 아직 시작 전인 수업만.
 * 오늘 수업이 모두 끝났으면 null (지난 수업으로 폴백하지 않음).
 */
export function pickUpcomingClass(schedules = [], now = new Date(), { skipOngoing = false } = {}) {
  if (!schedules.length) return null
  const sorted = [...schedules].sort((a, b) => new Date(a.startAt) - new Date(b.startAt))
  if (skipOngoing) {
    return sorted.find((s) => new Date(s.startAt) > now) || null
  }
  return sorted.find((s) => new Date(s.endAt) > now) || null
}
