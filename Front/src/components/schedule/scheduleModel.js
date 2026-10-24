export const SCHEDULE_STORAGE_KEY = 'baekseok.schedule.v1'
export const DEFAULT_SCHEDULE = { view: 'weekly', selectedDate: dateKey(new Date()), events: [], courses: [], removedCourseIds: [] }

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

export function weekDates(value, length = 7) {
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
      removedCourseIds: [],
    }
  } catch {
    return { ...DEFAULT_SCHEDULE, events: [], courses: [], removedCourseIds: [] }
  }
}

export function saveSchedule(storage, state) {
  try { storage?.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(state)) } catch { /* 저장이 제한되어도 현재 세션은 유지한다. */ }
}

function normalizeCourse(course) {
  if (!course || typeof course.id !== 'string' || !course.id || typeof course.title !== 'string' || !course.title.trim() || course.title.trim().length > 100 || !Number.isInteger(course.day) || course.day < 1 || course.day > 7 || !Number.isFinite(course.start) || course.start < 0 || course.start >= 24 || !['major', 'general', 'teaching'].includes(course.kind)) return null
  const end = course.end ?? course.start + 1
  if (!Number.isFinite(end) || end <= course.start || end > 24) return null
  return { ...course, title: course.title.trim(), end, color: course.kind, location: course.location || '' }
}

export function createCourse({ id, title, day, time, kind }) {
  if (!Number.isInteger(Number(day)) || Number(day) < 1 || Number(day) > 5) return null
  if (typeof time !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return null
  const [hour, minute] = time.split(':').map(Number)
  return normalizeCourse({ id, title, day: Number(day), start: hour + minute / 60, kind })
}

export function activeCourses(courses = [], removedCourseIds = []) {
  return courses.filter((course) => !removedCourseIds.includes(course.id))
}

export function registerCourses(state, newCourses) {
  const reject = (error) => ({ state, error })
  if (!newCourses.length) return reject('등록할 수 있는 수업 시간이 없습니다.')
  const existingCourses = activeCourses(state.courses, state.removedCourseIds)
  if (existingCourses.some((existing) => existing.catalogId === newCourses[0].catalogId)) return reject('이미 추가한 수업입니다.')
  if (newCourses.some((course) => existingCourses.some((existing) => existing.day === course.day && course.start < existing.end && course.end > existing.start))) return reject('기존 수업과 시간이 겹쳐 추가할 수 없습니다.')
  return {
    state: { ...state, selectedDate: weekDates(state.selectedDate, 7)[newCourses[0].day - 1], courses: [...state.courses, ...newCourses] },
    error: null,
  }
}

export function coursesForDate(value, courses = [], removedCourseIds = []) {
  const date = parseDate(value)
  return date ? activeCourses(courses, removedCourseIds).filter((course) => course.day % 7 === date.getDay()).sort((a, b) => a.start - b.start) : []
}

export function removeCourse(state, id) {
  const catalogId = state.courses.find((course) => course.id === id)?.catalogId
  return { ...state, courses: state.courses.filter((course) => course.id !== id && (!catalogId || course.catalogId !== catalogId)) }
}

export function removeEvent(state, id) {
  return { ...state, events: state.events.filter((event) => event.id !== id) }
}

export function eventsForDate(value, events = []) {
  const date = parseDate(value)
  if (!date) return []
  return events.filter((event) => {
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

/** 50분 수업도 시간표 칸에서는 정각 단위로 맞춘다. 예: 09:00–09:50 → 09–10 */
export function snapCourseHours(course) {
  const start = Math.floor(course.start)
  const end = Math.max(start + 1, Math.ceil(course.end))
  return { start, end }
}

export const COURSE_COLOR_PALETTE = [
  'rose', 'amber', 'blue', 'orange', 'emerald', 'indigo', 'teal', 'violet', 'cyan', 'pink', 'slate', 'lime',
]

export function pickCourseColor(seed, index = 0) {
  const text = String(seed || '')
  let hash = 0
  for (let i = 0; i < text.length; i += 1) hash = (hash * 31 + text.charCodeAt(i)) >>> 0
  return COURSE_COLOR_PALETTE[(hash + index) % COURSE_COLOR_PALETTE.length]
}
