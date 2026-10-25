/**
 * 백석대 통학버스(셔틀) 시드 — 두정역·천안교대 방면
 * 실제 운행은 학기·요일·교통에 따라 달라질 수 있음. 문의: 학생처.
 */
export type ShuttleStop = 'doojeong' | 'gyodae' | 'campus'

export type ShuttleTrip = {
  id: string
  routeLabel: string
  from: ShuttleStop
  to: ShuttleStop
  /** HH:MM 벽시계 */
  departAt: string
  arriveAt: string
  weekdaysOnly?: boolean
}

export const SHUTTLE_STOP_LABEL: Record<ShuttleStop, string> = {
  doojeong: '두정역',
  gyodae: '천안교대(교대)',
  campus: '백석대 캠퍼스',
}

export const SHUTTLE_CONTACT = {
  office: '학생처',
  phone: '041-550-9114',
  note: '통학버스·셔틀 운행은 학생처 안내에 따릅니다. (교무처 아님)',
  sourceUrl: 'https://www.bu.ac.kr/web/3443/subview.do',
}

/** 평일 오전·오후 대표 배차 (시드) */
export const SHUTTLE_TRIPS: ShuttleTrip[] = [
  // 두정역 → 캠퍼스
  { id: 'dj-c-0740', routeLabel: '두정역→캠퍼스', from: 'doojeong', to: 'campus', departAt: '07:40', arriveAt: '07:55', weekdaysOnly: true },
  { id: 'dj-c-0800', routeLabel: '두정역→캠퍼스', from: 'doojeong', to: 'campus', departAt: '08:00', arriveAt: '08:15', weekdaysOnly: true },
  { id: 'dj-c-0820', routeLabel: '두정역→캠퍼스', from: 'doojeong', to: 'campus', departAt: '08:20', arriveAt: '08:35', weekdaysOnly: true },
  { id: 'dj-c-0840', routeLabel: '두정역→캠퍼스', from: 'doojeong', to: 'campus', departAt: '08:40', arriveAt: '08:55', weekdaysOnly: true },
  { id: 'dj-c-0900', routeLabel: '두정역→캠퍼스', from: 'doojeong', to: 'campus', departAt: '09:00', arriveAt: '09:15', weekdaysOnly: true },
  { id: 'dj-c-1000', routeLabel: '두정역→캠퍼스', from: 'doojeong', to: 'campus', departAt: '10:00', arriveAt: '10:15', weekdaysOnly: true },
  { id: 'dj-c-1200', routeLabel: '두정역→캠퍼스', from: 'doojeong', to: 'campus', departAt: '12:00', arriveAt: '12:15', weekdaysOnly: true },
  { id: 'dj-c-1400', routeLabel: '두정역→캠퍼스', from: 'doojeong', to: 'campus', departAt: '14:00', arriveAt: '14:15', weekdaysOnly: true },
  { id: 'dj-c-1600', routeLabel: '두정역→캠퍼스', from: 'doojeong', to: 'campus', departAt: '16:00', arriveAt: '16:15', weekdaysOnly: true },
  { id: 'dj-c-1800', routeLabel: '두정역→캠퍼스', from: 'doojeong', to: 'campus', departAt: '18:00', arriveAt: '18:15', weekdaysOnly: true },
  // 교대 → 캠퍼스
  { id: 'gd-c-0745', routeLabel: '교대→캠퍼스', from: 'gyodae', to: 'campus', departAt: '07:45', arriveAt: '08:05', weekdaysOnly: true },
  { id: 'gd-c-0810', routeLabel: '교대→캠퍼스', from: 'gyodae', to: 'campus', departAt: '08:10', arriveAt: '08:30', weekdaysOnly: true },
  { id: 'gd-c-0830', routeLabel: '교대→캠퍼스', from: 'gyodae', to: 'campus', departAt: '08:30', arriveAt: '08:50', weekdaysOnly: true },
  { id: 'gd-c-0900', routeLabel: '교대→캠퍼스', from: 'gyodae', to: 'campus', departAt: '09:00', arriveAt: '09:20', weekdaysOnly: true },
  { id: 'gd-c-1200', routeLabel: '교대→캠퍼스', from: 'gyodae', to: 'campus', departAt: '12:00', arriveAt: '12:20', weekdaysOnly: true },
  { id: 'gd-c-1700', routeLabel: '교대→캠퍼스', from: 'gyodae', to: 'campus', departAt: '17:00', arriveAt: '17:20', weekdaysOnly: true },
  // 캠퍼스 → 두정역
  { id: 'c-dj-1210', routeLabel: '캠퍼스→두정역', from: 'campus', to: 'doojeong', departAt: '12:10', arriveAt: '12:25', weekdaysOnly: true },
  { id: 'c-dj-1610', routeLabel: '캠퍼스→두정역', from: 'campus', to: 'doojeong', departAt: '16:10', arriveAt: '16:25', weekdaysOnly: true },
  { id: 'c-dj-1810', routeLabel: '캠퍼스→두정역', from: 'campus', to: 'doojeong', departAt: '18:10', arriveAt: '18:25', weekdaysOnly: true },
  // 캠퍼스 → 교대
  { id: 'c-gd-1215', routeLabel: '캠퍼스→교대', from: 'campus', to: 'gyodae', departAt: '12:15', arriveAt: '12:35', weekdaysOnly: true },
  { id: 'c-gd-1715', routeLabel: '캠퍼스→교대', from: 'campus', to: 'gyodae', departAt: '17:15', arriveAt: '17:35', weekdaysOnly: true },
]

export function parseHm(hm: string) {
  const [h, m] = String(hm).split(':').map(Number)
  return (Number(h) || 0) * 60 + (Number(m) || 0)
}

export function detectShuttleStop(question: string): ShuttleStop | null {
  const q = String(question || '')
  if (/두정/.test(q)) return 'doojeong'
  if (/교대|천안교대/.test(q)) return 'gyodae'
  if (/캠퍼스|학교|백석/.test(q)) return 'campus'
  return null
}

export function tripsFrom(from: ShuttleStop, to?: ShuttleStop) {
  return SHUTTLE_TRIPS.filter((t) => t.from === from && (!to || t.to === to))
}

/** now 이후 다음 배차 (분 단위 벽시계) */
export function nextTrips(from: ShuttleStop, now: Date, to?: ShuttleStop, limit = 3) {
  const day = now.getDay()
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const pool = tripsFrom(from, to).filter((t) => !t.weekdaysOnly || (day >= 1 && day <= 5))
  const upcoming = pool
    .filter((t) => parseHm(t.departAt) >= nowMin)
    .sort((a, b) => parseHm(a.departAt) - parseHm(b.departAt))
  if (upcoming.length) return upcoming.slice(0, limit)
  // 오늘 남은 차 없으면 내일(시드) 첫 차
  return pool.slice().sort((a, b) => parseHm(a.departAt) - parseHm(b.departAt)).slice(0, limit)
}
