export const SCHEDULE_STORAGE_KEY = 'baekseok.schedule.v1'
export const DEFAULT_SCHEDULE = { view: 'weekly', selectedDate: '2026-09-17', events: [], courses: [], removedCourseIds: [] }

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

export function weekDates(value, length = 5) {
  const day = parseDate(value).getDay()
  const monday = shiftDate(value, -((day + 6) % 7))
  return Array.from({ length }, (_, index) => shiftDate(monday, index))
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
      courses: Array.isArray(saved?.courses) ? saved.courses.map(normalizeCourse).filter(Boolean) : [],
      removedCourseIds: Array.isArray(saved?.removedCourseIds) ? saved.removedCourseIds.filter((id) => COURSES.some((course) => course.id === id)) : [],
    }
  } catch {
    return { ...DEFAULT_SCHEDULE, events: [], courses: [], removedCourseIds: [] }
  }
}

export function saveSchedule(storage, state) {
  try { storage?.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(state)) } catch { /* 저장이 제한되어도 현재 세션은 유지한다. */ }
}

// 두 HTML의 예시 시간표를 공통 데이터로 관리한다. 목요일 시간은 월간 상세와 맞춘다.
export const COURSES = [
  { id: 'biology', day: 1, start: 9, end: 11, title: '생명과학', location: '지리 304', color: 'rose' },
  { id: 'physics', day: 1, start: 11, end: 13, title: '일반물리학', location: '진리 204', color: 'amber' },
  { id: 'ncs', day: 1, start: 14, end: 16, title: 'NCS직무 기초', location: '본부 207', color: 'blue' },
  { id: 'design', day: 2, start: 9, end: 12, title: '설계제작 실습', location: '본부 203', color: 'orange' },
  { id: 'calligraphy', day: 2, start: 13, end: 15, title: '캘리그라피', location: '예술 105', color: 'emerald' },
  { id: 'literature', day: 3, start: 11, end: 13, title: '문학과젠더', location: '지혜 202', color: 'indigo' },
  { id: 'folklore', day: 3, start: 13, end: 15, title: '한국민속학', location: '본부 401', color: 'teal' },
  { id: 'data', day: 4, start: 10, end: 11.5, title: '자료구조', location: '본부동 201호', color: 'emerald' },
  { id: 'ai', day: 4, start: 15, end: 16.5, title: '인공지능', location: '본부동 302호', color: 'blue' },
  { id: 'bible', day: 5, start: 9, end: 11, title: '현대인과 성서', location: '본부 203', color: 'teal' },
  { id: 'lab', day: 5, start: 12, end: 15, title: '물리학실험', location: '진리 403', color: 'rose' },
]

const SAMPLE_EVENTS = [
  { id: 'deadline', date: '2026-09-17', time: '23:59', title: '인공지능 과제 초안 작성', location: '컴퓨터공학부 포털 과제방 제출', kind: 'task' },
  { id: 'review', date: '2026-09-17', time: '17:00', title: '자료구조 중간고사 대비 요약', location: '3~5주차 트리/그래프 알고리즘 복습', kind: 'recommend' },
  { id: 'scholarship', date: '2026-09-22', time: '18:00', title: '백석드림 장학금 신청 마감', location: '장학복지팀 · 온라인 접수', kind: 'notice' },
  { id: 'study', date: '2026-09-24', time: '17:00', title: '중간고사 대비 스터디', location: '학술정보관', kind: 'recommend' },
]

function normalizeCourse(course) {
  if (!course || typeof course.id !== 'string' || !course.id || typeof course.title !== 'string' || !course.title.trim() || course.title.trim().length > 100 || !Number.isInteger(course.day) || course.day < 1 || course.day > 7 || !Number.isFinite(course.start) || course.start < 0 || course.start >= 24 || !['major', 'general', 'teaching'].includes(course.kind)) return null
  const end = course.end ?? course.start + 1
  if (!Number.isFinite(end) || end <= course.start || end > 24) return null
  return { ...course, title: course.title.trim(), end, color: course.kind, location: course.location || '매주 반복' }
}

export function createCourse({ id, title, day, time, kind }) {
  if (!Number.isInteger(Number(day)) || Number(day) < 1 || Number(day) > 5) return null
  if (typeof time !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return null
  const [hour, minute] = time.split(':').map(Number)
  return normalizeCourse({ id, title, day: Number(day), start: hour + minute / 60, kind })
}

export function activeCourses(courses = [], removedCourseIds = []) {
  return [...COURSES, ...courses].filter((course) => !removedCourseIds.includes(course.id))
}

export function coursesForDate(value, courses = [], removedCourseIds = []) {
  const date = parseDate(value)
  return date ? activeCourses(courses, removedCourseIds).filter((course) => course.day % 7 === date.getDay()).sort((a, b) => a.start - b.start) : []
}

export function removeCourse(state, id) {
  const catalogId = state.courses.find((course) => course.id === id)?.catalogId
  return { ...state, courses: state.courses.filter((course) => course.id !== id && (!catalogId || course.catalogId !== catalogId)), removedCourseIds: COURSES.some((course) => course.id === id) ? [...new Set([...state.removedCourseIds, id])] : state.removedCourseIds }
}

export function removeEvent(state, id) {
  return { ...state, events: state.events.filter((event) => event.id !== id) }
}

export function eventsForDate(value, events = []) {
  const date = parseDate(value)
  if (!date) return []
  return [...SAMPLE_EVENTS, ...events].filter((event) => {
    if (event.date === value) return true
    if (event.repeatWeekly !== true || event.date > value) return false
    const startDate = parseDate(event.date)
    return startDate?.getDay() === date.getDay()
  }).sort((a, b) => a.time.localeCompare(b.time))
}

export function hourLabel(hour) {
  const minutes = Math.round(hour * 60)
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}
