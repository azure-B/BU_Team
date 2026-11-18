import test from 'node:test'
import assert from 'node:assert/strict'
import { getNextClassMoves, getTodayEndedClasses, resolveClassBuilding } from './campusNextClasses.js'

const buildings = [{ id: 'hq', name: '본부동' }, { id: 'lib', name: '도서관' }]
const course = { id: 'one', title: '자료구조', day: 3, start: 10, end: 12, location: '본부510', buildingId: 'hq' }
test('KST timetable excludes started courses and finds tomorrow across midnight', () => {
  const now = new Date('2026-11-18T00:00:00Z') // 수 09:00 KST
  const rows = getNextClassMoves([course, { ...course, id: 'past', start: 8, end: 9 }, { ...course, id: 'next', day: 4, start: 8, end: 9 }], buildings, now)
  assert.equal(rows[0].id, 'one')
  assert.equal(rows[0].startAt.toISOString(), '2026-11-18T01:00:00.000Z')
  assert.equal(rows[1].id, 'next')
  assert.equal(rows[1].startAt.toISOString(), '2026-11-18T23:00:00.000Z')
  assert.equal(rows[0].building.id, 'hq')
})
test('removed courses and invalid periods are excluded; at most four rows', () => {
  const rows = getNextClassMoves(Array.from({ length: 7 }, (_, i) => ({ ...course, id: String(i), start: 10 + i, end: 11 + i })), buildings, new Date('2026-11-18T00:00Z'), ['0'])
  assert.equal(rows.length, 4)
  assert.equal(rows[0].id, '1')
  assert.deepEqual(getNextClassMoves([{ ...course, end: 9 }], buildings), [])
})
test('uses known building IDs, classroom prefixes and library alias without inventing a destination', () => {
  assert.equal(resolveClassBuilding({ location: '본부510' }, buildings)?.id, 'hq')
  assert.equal(resolveClassBuilding({ location: '학술정보관 201' }, buildings)?.id, 'lib')
  assert.equal(resolveClassBuilding({ location: '정체불명 301' }, buildings), null)
  assert.equal(resolveClassBuilding({ ...course, title: '사이버 수업' }, buildings), null)
  assert.equal(resolveClassBuilding({ ...course, buildingId: 'missing' }, buildings), null)
})
test('week boundary retains Monday date correctly', () => {
  const rows = getNextClassMoves([{ ...course, day: 1 }], buildings, new Date('2026-11-22T14:30:00Z'))
  assert.equal(rows[0].startAt.toISOString(), '2026-11-23T01:00:00.000Z')
})

test('today ended rows include completed classes only and exclude removed courses', () => {
  const now = new Date('2026-11-18T04:00:00Z') // 수 13:00 KST
  const rows = getTodayEndedClasses([course, { ...course, id: 'ongoing', start: 12, end: 14 }, { ...course, id: 'tomorrow', day: 4 }, { ...course, id: 'removed' }], buildings, now, ['removed'])
  assert.deepEqual(rows.map((r) => r.id), ['one'])
  assert.equal(rows[0].endAt.toISOString(), '2026-11-18T03:00:00.000Z')
  assert.equal(rows[0].building.id, 'hq')
})

test('empty timetable and KST day boundary do not reuse yesterday ended classes', () => {
  assert.deepEqual(getTodayEndedClasses([], buildings), [])
  assert.deepEqual(getTodayEndedClasses([course], buildings, new Date('2026-11-18T15:00:00Z')), []) // 목 00:00
  assert.deepEqual(getTodayEndedClasses([{ ...course, end: 9 }], buildings, new Date('2026-11-18T04:00:00Z')), [])
})
