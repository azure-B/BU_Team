import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  DEFAULT_SCHEDULE, SCHEDULE_STORAGE_KEY, coursesForDate, createCourse, dateKey, eventsForDate, hourLabel, removeCourse,
  monthDates, monthWeek, parseDate, readSchedule, saveSchedule, shiftDate, weekDates,
} from './scheduleModel.js'

function memoryStorage() {
  const values = new Map()
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) }
}

test('첫 진입은 오늘의 빈 시간표로 시작하고 예시 수업과 일정이 표시되지 않는다', () => {
  assert.deepEqual(readSchedule(memoryStorage()), DEFAULT_SCHEDULE)
  assert.equal(DEFAULT_SCHEDULE.selectedDate, dateKey(new Date()))
  for (const date of ['2026-09-14', '2026-09-15', '2026-09-16', '2026-09-17', '2026-09-18', '2026-09-22', '2026-09-24']) {
    assert.deepEqual(coursesForDate(date), [])
    assert.deepEqual(eventsForDate(date), [])
  }
})

test('홈으로 나갔다가 다시 진입하거나 새로고침해도 마지막 보기와 날짜를 복원한다', () => {
  const storage = memoryStorage()
  const monthly = { ...DEFAULT_SCHEDULE, view: 'monthly', selectedDate: '2026-10-22' }
  saveSchedule(storage, monthly)
  assert.deepEqual(readSchedule(storage), monthly)
  const weekly = { ...readSchedule(storage), view: 'weekly' }
  saveSchedule(storage, weekly)
  assert.deepEqual(readSchedule(storage), weekly)
  assert.equal(readSchedule(storage).selectedDate, '2026-10-22')
})

test('추가 일정은 보기 전환과 저장 상태 복원 이후에도 같은 날짜에 남는다', () => {
  const storage = memoryStorage()
  const event = { id: 'custom', title: '프로젝트 미팅', date: '2026-10-05', time: '18:00', kind: 'recommend' }
  saveSchedule(storage, { view: 'monthly', selectedDate: event.date, events: [event] })
  const restored = readSchedule(storage)
  assert.deepEqual(eventsForDate(event.date, restored.events), [event])
  assert.deepEqual(eventsForDate('2026-10-06', restored.events), [])
})

test('손상된 JSON 및 잘못된 저장 값은 안전한 기본 상태로 복원한다', () => {
  const storage = memoryStorage()
  storage.setItem(SCHEDULE_STORAGE_KEY, '{broken')
  assert.deepEqual(readSchedule(storage), DEFAULT_SCHEDULE)
  storage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify({ view: 'unknown', selectedDate: '2026-02-30', events: [null, { id: 'bad', title: '오류', date: '2026-10-05', time: '25:99', kind: 'task' }] }))
  assert.deepEqual(readSchedule(storage), DEFAULT_SCHEDULE)
})

test('저장소 접근 제한이 있어도 렌더링에 필요한 상태를 제공한다', () => {
  const storage = { getItem() { throw new Error('blocked') }, setItem() { throw new Error('blocked') } }
  assert.deepEqual(readSchedule(storage), DEFAULT_SCHEDULE)
  assert.doesNotThrow(() => saveSchedule(storage, DEFAULT_SCHEDULE))
})

test('월 이동은 윤년과 월말을 처리하고 주 이동은 연도 경계를 넘는다', () => {
  assert.equal(shiftDate('2026-01-31', 1, 'month'), '2026-02-28')
  assert.equal(shiftDate('2024-01-31', 1, 'month'), '2024-02-29')
  assert.equal(shiftDate('2026-01-15', -1, 'month'), '2025-12-15')
  assert.equal(shiftDate('2026-12-31', 7), '2027-01-07')
  assert.equal(parseDate('2026-02-29'), null)
})

test('월간 그리드는 5주와 6주 달 모두 빠짐없이 표시한다', () => {
  const september = monthDates('2026-09-17')
  assert.equal(september.length, 35)
  assert.equal(september[0], '2026-08-30')
  assert.equal(september.at(-1), '2026-10-03')
  const august = monthDates('2026-08-15')
  assert.equal(august.length, 42)
  assert.equal(august.filter((date) => date.startsWith('2026-08')).length, 31)
})

test('주간 보기는 같은 주의 날짜를 선택해도 동일한 범위와 주차를 유지한다', () => {
  const expected = ['2026-09-14', '2026-09-15', '2026-09-16', '2026-09-17', '2026-09-18']
  for (const value of expected) {
    assert.deepEqual(weekDates(value), expected)
    assert.equal(monthWeek(value), 3)
  }
  assert.deepEqual(weekDates('2026-09-20'), expected)
})

test('수업은 같은 요일에 학기 제한 없이 반복하고 주말에는 표시하지 않는다', () => {
  const courses = [createCourse({ id: 'registered', title: '등록한 수업', day: 4, time: '10:30', kind: 'major' })]
  assert.deepEqual(coursesForDate('2026-09-17', courses), courses)
  assert.deepEqual(coursesForDate('2026-09-17', courses), coursesForDate('2026-09-24', courses))
  assert.deepEqual(coursesForDate('2026-09-19', courses), [])
  assert.deepEqual(coursesForDate('2026-09-17', courses), coursesForDate('2027-01-07', courses))
})

test('기존 저장값은 일정을 보존하면서 새 수업 필드의 기본값을 적용한다', () => {
  const storage = memoryStorage()
  const event = { id: 'legacy', title: '기존 일정', date: '2026-10-05', time: '18:00', kind: 'task' }
  storage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify({ view: 'monthly', selectedDate: event.date, events: [event] }))
  const restored = readSchedule(storage)
  assert.deepEqual(restored.events, [event])
  assert.deepEqual(restored.courses, [])
  assert.deepEqual(restored.removedCourseIds, [])
})

test('수업의 분 단위 시간과 종류를 저장하며 연도를 넘겨 반복하고 삭제를 복원한다', () => {
  const storage = memoryStorage()
  const course = createCourse({ id: 'custom-class', title: '  새로운 전공  ', day: 4, time: '07:15', kind: 'major' })
  assert.equal(course.title, '새로운 전공')
  assert.equal(hourLabel(course.start), '07:15')
  assert.equal(hourLabel(course.end), '08:15')
  assert.equal(course.color, 'major')
  saveSchedule(storage, { ...DEFAULT_SCHEDULE, courses: [course] })
  let restored = readSchedule(storage)
  assert.ok(coursesForDate('2027-01-07', restored.courses).some(({ id }) => id === course.id))
  assert.ok(!coursesForDate('2027-01-08', restored.courses).some(({ id }) => id === course.id))
  restored = removeCourse(removeCourse(restored, course.id), 'data')
  saveSchedule(storage, restored)
  restored = readSchedule(storage)
  assert.ok(!coursesForDate('2027-01-07', restored.courses, restored.removedCourseIds).some(({ id }) => id === course.id || id === 'data'))
})

test('잘못된 수업 데이터는 제외하고 유효한 교양 수업은 복원한다', () => {
  const storage = memoryStorage()
  const course = createCourse({ id: 'general', title: '교양', day: 5, time: '23:00', kind: 'general' })
  assert.equal(course.color, 'general')
  assert.equal(hourLabel(course.end), '24:00')
  for (const invalid of [{ day: 0 }, { day: 6 }, { time: '23:30' }, { time: '25:00' }, { kind: 'unknown' }, { title: '  ' }]) {
    assert.equal(createCourse({ id: 'bad', title: '수업', day: 1, time: '09:00', kind: 'major', ...invalid }), null)
  }
  saveSchedule(storage, { ...DEFAULT_SCHEDULE, courses: [null, { ...course, start: -1 }, { ...course, day: 8 }, course] })
  assert.deepEqual(readSchedule(storage).courses, [course])
})
