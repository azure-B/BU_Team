import test from 'node:test'
import assert from 'node:assert/strict'
import { catalogAreas, catalogMeetings, createCatalogCourses, filterCatalog } from './courseCatalog.js'
import { coursesForDate, DEFAULT_SCHEDULE, readSchedule, registerCourses, removeCourse, saveSchedule } from './scheduleModel.js'

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
  assert.deepEqual(catalogAreas([]), [])
  const areas = catalogAreas([{ ...course, department: '실제학부' }])
  assert.deepEqual(areas.map((area) => area.label), ['실제학부'])
})

const deployedCourse = {
  id: '2026_2_kyoyang-교양-0863201', title: '21세기 트렌드와 창업', kind: 'general',
  day: 2, startTime: '13:00', endTime: '13:50',
  meetings: [{ day: 2, periods: [5], start: '13:00', end: '13:50' }],
}

const occupiedSchedule = () => ({
  ...DEFAULT_SCHEDULE, selectedDate: '2026-09-17',
  courses: createCatalogCourses({ ...deployedCourse, id: 'existing-course', meetings: [{ day: 2, start: 13, end: 15 }] }),
})

test('실서버 형식의 강의가 기존 시간표와 겹치면 등록을 거부하고 상태를 보존한다', () => {
  const state = occupiedSchedule()
  const result = registerCourses(state, createCatalogCourses(deployedCourse))
  assert.match(result.error, /겹쳐/)
  assert.strictEqual(result.state, state)
  assert.equal(result.state.courses.length, 1)
})

test('충돌 수업을 삭제하면 강의를 등록하고 새로고침 후에도 실제 시간을 복원한다', () => {
  const occupied = occupiedSchedule()
  const state = removeCourse(occupied, occupied.courses[0].id)
  const meetings = createCatalogCourses(deployedCourse)
  const result = registerCourses(state, meetings)
  assert.equal(result.error, null)
  assert.equal(result.state.selectedDate, '2026-09-15')
  let saved
  const storage = { getItem: () => saved, setItem: (_key, value) => { saved = value } }
  saveSchedule(storage, result.state)
  const restored = readSchedule(storage)
  const registered = coursesForDate(restored.selectedDate, restored.courses, restored.removedCourseIds).find((item) => item.catalogId === deployedCourse.id)
  assert.equal(registered.title, deployedCourse.title)
  assert.equal(registered.start, 13)
  assert.equal(registered.end, 13 + 50 / 60)
  const duplicate = registerCourses(restored, meetings)
  assert.match(duplicate.error, /이미 추가/)
  assert.strictEqual(duplicate.state, restored)
})

test('부분 겹침·포함 관계는 거부하고 맞닿은 시간이나 다른 요일은 허용한다', () => {
  const existing = createCatalogCourses({ ...deployedCourse, id: 'existing', meetings: [{ day: 2, start: 13, end: 14 }] })
  const state = { ...DEFAULT_SCHEDULE, courses: existing }
  for (const [start, end] of [[12.5, 13.1], [13.1, 13.5], [12, 15], [13, 14], [13.5, 14.5]]) {
    const candidate = createCatalogCourses({ ...deployedCourse, meetings: [{ day: 2, start, end }] })
    const result = registerCourses(state, candidate)
    assert.match(result.error, /겹쳐/, `${start}–${end}`)
    assert.strictEqual(result.state, state)
  }
  for (const [day, start, end] of [[2, 12, 13], [2, 14, 15], [3, 13, 14]]) {
    const candidate = createCatalogCourses({ ...deployedCourse, meetings: [{ day, start, end }] })
    const result = registerCourses(state, candidate)
    assert.equal(result.error, null)
    assert.equal(result.state.courses.length, 2)
  }
})

test('여러 시간 중 하나만 충돌해도 강의 전체를 거부한다', () => {
  const state = occupiedSchedule()
  const candidate = createCatalogCourses({ ...deployedCourse, meetings: [{ day: 1, start: 18, end: 19 }, ...deployedCourse.meetings] })
  const result = registerCourses(state, candidate)
  assert.match(result.error, /겹쳐/)
  assert.strictEqual(result.state, state)
  assert.deepEqual(result.state.courses, state.courses)
})
