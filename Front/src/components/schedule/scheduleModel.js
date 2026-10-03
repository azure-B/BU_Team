export const SCHEDULE_STORAGE_KEY = 'baekseok.schedule.v1'
export const DEFAULT_SCHEDULE = { view: 'weekly', selectedDate: '2026-09-17', events: [] }

export function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function parseDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day, 12)
  return year >= 1900 && year <= 9999 && dateKey(date) === value ? date : null
}

export function shiftDate(value, amount, unit = 'day') {
  const date = parseDate(value)
  if (unit === 'month') {
    const day = date.getDate()
    date.setDate(1)
    date.setMonth(date.getMonth() + amount)
    date.setDate(Math.min(day, new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()))
  } else date.setDate(date.getDate() + amount)
  return dateKey(date)
}

export function monthDates(value) {
  const date = parseDate(value)
  const first = new Date(date.getFullYear(), date.getMonth(), 1, 12)
  const days = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  const length = Math.ceil((first.getDay() + days) / 7) * 7
  return Array.from({ length }, (_, index) => shiftDate(dateKey(first), index - first.getDay()))
}

export function weekDates(value) {
  const day = parseDate(value).getDay()
  const monday = shiftDate(value, -((day + 6) % 7))
  return Array.from({ length: 5 }, (_, index) => shiftDate(monday, index))
}

export function monthWeek(value) {
  const date = parseDate(value)
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  return Math.ceil((date.getDate() + (firstDay + 6) % 7) / 7)
}

export function readSchedule(storage) {
  try {
    const saved = JSON.parse(storage?.getItem(SCHEDULE_STORAGE_KEY) ?? 'null')
    return {
      view: saved?.view === 'monthly' ? 'monthly' : 'weekly',
      selectedDate: parseDate(saved?.selectedDate) ? saved.selectedDate : DEFAULT_SCHEDULE.selectedDate,
      events: Array.isArray(saved?.events) ? saved.events.filter((event) => event && typeof event.id === 'string' && typeof event.title === 'string' && event.title.trim() && parseDate(event.date) && /^([01]\d|2[0-3]):[0-5]\d$/.test(event.time) && ['task', 'notice', 'recommend'].includes(event.kind)) : [],
    }
  } catch {
    return { ...DEFAULT_SCHEDULE, events: [] }
  }
}

export function saveSchedule(storage, state) {
  try { storage?.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(state)) } catch { /* 저장이 제한되어도 현재 세션은 유지한다. */ }
}

// 두 HTML의 예시 시간표를 공통 데이터로 관리한다. 목요일 시간은 월간 상세와 맞춘다.
export const COURSES = [
  { id: 'biology', day: 1, start: 9, end: 11, title: '생명과학', location: '지리 304', credits: '2학점', color: 'rose' },
  { id: 'physics', day: 1, start: 11, end: 13, title: '일반물리학', location: '진리 204', credits: '2학점', color: 'amber' },
  { id: 'ncs', day: 1, start: 14, end: 16, title: 'NCS직무 기초', location: '본부 207', credits: '2학점', color: 'blue' },
  { id: 'design', day: 2, start: 9, end: 12, title: '설계제작 실습', location: '본부 203', credits: '3학점', color: 'orange' },
  { id: 'calligraphy', day: 2, start: 13, end: 15, title: '캘리그라피', location: '예술 105', credits: '2학점', color: 'emerald' },
  { id: 'literature', day: 3, start: 11, end: 13, title: '문학과젠더', location: '지혜 202', credits: '2학점', color: 'indigo' },
  { id: 'folklore', day: 3, start: 13, end: 15, title: '한국민속학', location: '본부 401', credits: '2학점', color: 'teal' },
  { id: 'data', day: 4, start: 10, end: 11.5, title: '자료구조', location: '본부동 201호', credits: '2학점', color: 'emerald' },
  { id: 'ai', day: 4, start: 15, end: 16.5, title: '인공지능', location: '본부동 302호', credits: '2학점', color: 'blue' },
  { id: 'bible', day: 5, start: 9, end: 11, title: '현대인과 성서', location: '본부 203', credits: '채플', color: 'teal' },
  { id: 'lab', day: 5, start: 12, end: 15, title: '물리학실험', location: '진리 403', credits: '3학점', color: 'rose' },
]

const SAMPLE_EVENTS = [
  { id: 'deadline', date: '2026-09-17', time: '23:59', title: '인공지능 과제 초안 작성', location: '컴퓨터공학부 포털 과제방 제출', kind: 'task' },
  { id: 'review', date: '2026-09-17', time: '17:00', title: '자료구조 중간고사 대비 요약', location: '3~5주차 트리/그래프 알고리즘 복습', kind: 'recommend' },
  { id: 'scholarship', date: '2026-09-22', time: '18:00', title: '백석드림 장학금 신청 마감', location: '장학복지팀 · 온라인 접수', kind: 'notice' },
  { id: 'study', date: '2026-09-24', time: '17:00', title: '중간고사 대비 스터디', location: '학술정보관', kind: 'recommend' },
]

export function coursesForDate(value) {
  if (value < '2026-09-01' || value > '2026-12-21') return []
  return COURSES.filter((course) => course.day === parseDate(value).getDay())
}

export function eventsForDate(value, events = []) {
  return [...SAMPLE_EVENTS, ...events].filter((event) => event.date === value).sort((a, b) => a.time.localeCompare(b.time))
}

export function hourLabel(hour) {
  return `${String(Math.floor(hour)).padStart(2, '0')}:${hour % 1 ? '30' : '00'}`
}
