import test from 'node:test'
import assert from 'node:assert/strict'
import { COURSE_CATALOG_CACHE_TTL, createCourseCatalogCache } from './courseCatalogCache.js'

test('모달 재진입은 10분 이내의 목록을 재사용하고 만료 후 새로 조회한다', async () => {
  let time = 0
  let calls = 0
  const first = [{ id: 'course-1' }]
  const next = [{ id: 'course-2' }]
  const cache = createCourseCatalogCache(async () => ++calls === 1 ? first : next, { now: () => time })
  assert.equal(cache.read(), null)
  await cache.load()
  time = COURSE_CATALOG_CACHE_TTL - 1
  assert.strictEqual(cache.read(), first)
  assert.strictEqual(await cache.load(), first)
  assert.equal(calls, 1)
  time = COURSE_CATALOG_CACHE_TTL
  assert.equal(cache.read(), null)
  assert.strictEqual(await cache.load(), next)
  assert.equal(calls, 2)
})

test('조회 중 재진입해도 한 요청을 공유하고 완료된 전체 목록을 보관한다', async () => {
  let resolve
  let calls = 0
  let time = 0
  const cache = createCourseCatalogCache(() => {
    calls++
    return new Promise((done) => { resolve = done })
  }, { now: () => time })
  const first = cache.load()
  const reopened = cache.load()
  assert.strictEqual(first, reopened)
  await Promise.resolve()
  assert.equal(calls, 1)
  time = COURSE_CATALOG_CACHE_TTL
  resolve([{ id: 'complete-catalog' }])
  await reopened
  assert.deepEqual(cache.read(), [{ id: 'complete-catalog' }])
})

test('조회 실패는 보관하지 않아 다음 시도에서 다시 요청한다', async () => {
  let calls = 0
  const cache = createCourseCatalogCache(async () => {
    if (++calls === 1) throw new Error('network error')
    return [{ id: 'retried' }]
  })
  await assert.rejects(cache.load(), /network error/)
  assert.equal(cache.read(), null)
  assert.deepEqual(await cache.load(), [{ id: 'retried' }])
  assert.equal(calls, 2)
})

test('빈 조회 결과도 보관하며 새 페이지의 캐시는 비어 있다', async () => {
  let calls = 0
  const cache = createCourseCatalogCache(async () => { calls++; return [] })
  await cache.load()
  assert.deepEqual(cache.read(), [])
  await cache.load()
  assert.equal(calls, 1)
  assert.equal(createCourseCatalogCache(async () => []).read(), null)
})
