import test from 'node:test'
import assert from 'node:assert/strict'
import { getNextClassMoves, getTodayEndedClasses, resolveClassBuilding } from './campusNextClasses.js'

const buildings = [{ id: 'hq', name: '본부동' }, { id: 'lib', name: '도서관' }]
const course = { id: 'one', title: '자료구조', day: 3, start: 10, end: 12, location: '본부510', buildingId: 'hq' }

test('shows only today remaining classes, including an ongoing class', () => {
  const now = new Date('2026-11-18T02:00Z') // 수 11시 KST
  const rows = getNextClassMoves([course, { ...course, id: 'ended', start: 8, end: 11 }, { ...course, id: 'later', start: 13, end: 14 }, { ...course, id: 'tomorrow', day: 4 }], buildings, now)
  assert.deepEqual(rows.map(r => r.id), ['one', 'later'])
  assert.equal(rows[0].startAt.toISOString(), '2026-11-18T01:00:00.000Z')
})

test('empty today or all finished returns empty, never tomorrow or next week', () => {
  assert.deepEqual(getNextClassMoves([], buildings), [])
  assert.deepEqual(getNextClassMoves([course], buildings, new Date('2026-11-18T03:00Z')), [])
  assert.deepEqual(getNextClassMoves([{ ...course, day: 4 }], buildings, new Date('2026-11-18T00:00Z')), [])
})

test('excludes removed and invalid classes and does not cap today at four', () => {
  const courses = Array.from({ length: 6 }, (_, i) => ({ ...course, id: String(i), start: 10 + i, end: 11 + i }))
  const now = new Date('2026-11-18T00:00Z')
  assert.equal(getNextClassMoves(courses, buildings, now).length, 6)
  assert.equal(getNextClassMoves(courses, buildings, now, ['0']).length, 5)
  assert.deepEqual(getNextClassMoves([{ ...course, end: 9 }], buildings, now), [])
})

test('KST midnight changes the day', () => {
  const rows = getNextClassMoves([course, { ...course, id: 'thu', day: 4 }], buildings, new Date('2026-11-18T15:00Z'))
  assert.deepEqual(rows.map(r => r.id), ['thu'])
})

test('matches building IDs and aliases without fabricating locations', () => {
  assert.equal(resolveClassBuilding({ location: '본부510' }, buildings)?.id, 'hq')
  assert.equal(resolveClassBuilding({ location: '학술정보관 201' }, buildings)?.id, 'lib')
  assert.equal(resolveClassBuilding({ location: '알수없음' }, buildings), null)
  assert.equal(resolveClassBuilding({ ...course, title: '온라인 수업' }, buildings), null)
})

test('ended list includes today finished classes in time order, excludes ongoing, removed and tomorrow', () => {
  const now = new Date('2026-11-18T03:00Z') // 수 12:00 KST
  const rows = getTodayEndedClasses([course, { ...course, id: 'early', start: 8, end: 9 }, { ...course, id: 'ongoing', start: 11, end: 13 }, { ...course, id: 'removed' }, { ...course, id: 'tomorrow', day: 4 }], buildings, now, ['removed'])
  assert.deepEqual(rows.map(r => r.id), ['early', 'one'])
  assert.equal(rows[1].endAt.toISOString(), '2026-11-18T03:00:00.000Z')
  assert.equal(rows[1].building.id, 'hq')
})

test('ended list stays empty for no classes or at KST midnight rather than showing yesterday', () => {
  assert.deepEqual(getTodayEndedClasses([], buildings), [])
  assert.deepEqual(getTodayEndedClasses([course], buildings, new Date('2026-11-18T15:00Z')), [])
})
