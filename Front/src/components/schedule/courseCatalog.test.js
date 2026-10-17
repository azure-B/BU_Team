import test from 'node:test'
import assert from 'node:assert/strict'
import { catalogAreas, catalogMeetings, createCatalogCourses, filterCatalog } from './courseCatalog.js'
import { coursesForDate, DEFAULT_SCHEDULE, readSchedule, removeCourse, saveSchedule } from './scheduleModel.js'

const course = {
  id: 'db-course-1', title: '컴퓨터구조', code: 'CS101', kind: 'major',
  department: '컴퓨터공학부', major: '소프트웨어', professor: '김교수', credit: 3, room: '본부 201',
  meetings: [{ day: '월', startTime: '09:30', endTime: '11:00' }, { day: 6, start: 13, end: 15 }],
}

test('개설 강의의 모든 시간을 저장·복원하고 한 강의 단위로 삭제한다', () => {
  let value
  const storage = { getItem: () => value, setItem: (_key, next) => { value = next } }
  const courses = createCatalogCourses(course)
  saveSchedule(storage, { ...DEFAULT_SCHEDULE, courses })
  const restored = readSchedule(storage)
  assert.equal(restored.courses.length, 2)
  assert.equal(restored.courses[0].end, 11)
  assert.equal(restored.courses[0].location, '본부 201')
  assert.equal(restored.courses[0].professor, '김교수')
  assert.equal(restored.courses[1].day, 6)
  assert.equal(restored.courses[1].end, 15)
  assert.deepEqual(removeCourse(restored, courses[0].id).courses, [])
})

test('전공/영역·요일/시간·구분·검색어를 함께 적용하며 경계가 닿는 시간은 겹치지 않는다', () => {
  const area = catalogAreas([course]).find((item) => item.label === '컴퓨터공학부').value
  const filters = { area, kind: 'major', day: '1', start: 10, end: 12, q: '컴퓨터 김교수' }
  assert.deepEqual(filterCatalog([course], filters), [course])
  assert.deepEqual(filterCatalog([course], { ...filters, start: 11 }), [])
  assert.deepEqual(filterCatalog([course], { ...filters, kind: 'general' }), [])
  assert.deepEqual(filterCatalog([course], { ...filters, day: '2' }), [])
})

test('잘못된 시간 정보가 섞인 강의를 부분 등록하지 않는다', () => {
  assert.deepEqual(createCatalogCourses({ ...course, meetings: [...course.meetings, { day: 2, start: 10 }] }), [])
  assert.deepEqual(catalogMeetings({ ...course, meetings: 'invalid json' }), [])
  assert.deepEqual(catalogMeetings({ ...course, meetings: [], day: 1, startTime: '09:30:00', endTime: '11:00:00' }), [{ day: 1, start: 9.5, end: 11, location: '본부 201' }])
})

test('일요일 수업을 해당 날짜에 표시한다', () => {
  const courses = createCatalogCourses({ ...course, meetings: [{ day: '일', start: 10, end: 12 }] })
  assert.equal(coursesForDate('2026-10-18', courses).find((item) => item.catalogId === course.id)?.end, 12)
  assert.equal(coursesForDate('2026-10-19', courses).some((item) => item.catalogId === course.id), false)
})

test('전공 선택지는 학부 단위로 제공하고 같은 학부의 세부 전공을 함께 검색한다', () => {
  const areas = catalogAreas([course, { ...course, department: '첨단IT학부' }])
  assert.deepEqual(areas.map((area) => area.label).sort(), ['컴퓨터공학부', '첨단IT학부'].sort())
  const area = areas.find((item) => item.label === '컴퓨터공학부').value
  const otherMajor = { ...course, id: 'db-course-2', major: '정보통신' }
  assert.deepEqual(filterCatalog([course, otherMajor], { area, kind: '', day: '', start: 0, end: 24, q: '' }), [course, otherMajor])
})

test('정상 조회 후에는 빈 결과를 포함해 DB에 있는 영역만 제공한다', () => {
  assert.equal(catalogAreas([], { includeDefaults: true }).length, 3)
  assert.deepEqual(catalogAreas([]), [])
  const areas = catalogAreas([{ ...course, department: '실제학부' }])
  assert.deepEqual(areas.map((area) => area.label), ['실제학부'])
})
