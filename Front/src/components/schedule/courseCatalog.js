import { hourLabel } from './scheduleModel.js'

export const COURSE_KINDS = { major: '전공', general: '교양', teaching: '교직' }
const DAYS = ['월', '화', '수', '목', '금', '토', '일']

function courseDay(value) {
  if (value === 0 || value === '0') return 7
  if (typeof value === 'string') {
    const index = DAYS.indexOf(value.replace(/요일$/, '').trim())
    if (index >= 0) return index + 1
  }
  const day = Number(value)
  return Number.isInteger(day) && day >= 1 && day <= 7 ? day : null
}

function courseHour(value) {
  if (typeof value === 'number') return value
  if (typeof value !== 'string' || !/^\d{1,2}:\d{2}(:\d{2})?$/.test(value)) return NaN
  const [hour, minute] = value.split(':').map(Number)
  return hour <= 24 && minute < 60 && (hour < 24 || minute === 0) ? hour + minute / 60 : NaN
}

export function catalogMeetings(course) {
  let source = course.meetings
  if (typeof source === 'string') {
    try { source = JSON.parse(source) } catch { return [] }
  }
  if (!Array.isArray(source) || !source.length) source = [course]
  const meetings = source.map((meeting) => ({
    day: courseDay(meeting?.day),
    start: courseHour(meeting?.startTime ?? meeting?.start),
    end: courseHour(meeting?.endTime ?? meeting?.end),
    location: meeting?.room || course.room || '',
  }))
  // 일부 시간만 등록되는 것을 막기 위해 시간 정보가 하나라도 잘못되면 선택을 제한한다.
  if (meetings.some(({ day, start, end }) => !day || !Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end > 24 || start >= end)) return []
  return meetings.filter((meeting, index) => meetings.findIndex((other) => other.day === meeting.day && other.start === meeting.start && other.end === meeting.end) === index)
}

export function catalogScheduleLabel(course) {
  const meetings = catalogMeetings(course)
  return meetings.length ? meetings.map(({ day, start, end }) => `${DAYS[day - 1]} ${hourLabel(start)}–${hourLabel(end)}`).join(' · ') : course.schedule || '시간 미정'
}

export function createCatalogCourses(course) {
  if (course?.id == null || !COURSE_KINDS[course.kind] || !course.title?.trim()) return []
  return catalogMeetings(course).map((meeting, index) => ({
    ...meeting,
    id: `catalog:${course.id}:${index}`,
    catalogId: String(course.id),
    title: course.title.trim(),
    kind: course.kind,
    color: course.kind,
    professor: course.professor || '',
    code: course.code || '',
    credit: course.credit,
  }))
}

const DEFAULT_DEPARTMENTS = ['컴퓨터공학부', '첨단 아이티 학부', '경상학부']
const areaKey = (value) => value.replace(/\s+/g, '')
const courseArea = (course) => course.kind === 'major' ? course.department || course.major || '' : course.major || course.department || ''

export function catalogAreas(courses, { includeDefaults = false } = {}) {
  const areas = new Map()
  const addArea = (kind, label) => {
    if (!label) return
    const value = JSON.stringify([kind, areaKey(label)])
    if (!areas.has(value)) areas.set(value, { value, kind, label })
  }
  if (includeDefaults) DEFAULT_DEPARTMENTS.forEach((department) => addArea('major', department))
  for (const course of courses) {
    addArea(course.kind, courseArea(course))
  }
  return [...areas.values()].sort((a, b) => a.label.localeCompare(b.label, 'ko'))
}

export function filterCatalog(courses, { area, kind, day, start, end, q }) {
  const scope = area ? JSON.parse(area) : null
  const words = q.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean)
  return courses.filter((course) => {
    if (kind && course.kind !== kind) return false
    if (scope && (course.kind !== scope[0] || areaKey(courseArea(course)) !== scope[1])) return false
    const text = [course.title, course.professor, course.code].join(' ').toLocaleLowerCase()
    if (!words.every((word) => text.includes(word))) return false
    if (day || start !== 0 || end !== 24) return catalogMeetings(course).some((meeting) => (!day || meeting.day === Number(day)) && meeting.start < end && meeting.end > start)
    return true
  })
}
