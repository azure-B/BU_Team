export const COURSE_CATALOG_CACHE_TTL = 10 * 60 * 1000

export function createCourseCatalogCache(fetchCourses, { now = Date.now } = {}) {
  let courses = null
  let loadedAt = 0
  let pending = null

  const read = () => courses !== null && now() - loadedAt < COURSE_CATALOG_CACHE_TTL ? courses : null

  const load = () => {
    const cached = read()
    if (cached !== null) return Promise.resolve(cached)
    // 모달이 닫혀도 진행 중인 조회는 완료해 다음 진입에서 재사용한다.
    if (!pending) {
      pending = Promise.resolve().then(fetchCourses).then((data) => {
        courses = data
        loadedAt = now()
        return data
      }).finally(() => { pending = null })
    }
    return pending
  }

  return { read, load }
}
