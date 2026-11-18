const KST_MS = 9 * 3600000

// 한국 시각 오늘의 종료되지 않은 수업만 반환한다.
export function getNextClassMoves(courses = [], buildings = [], now = new Date(), removedIds = []) {
  const shifted = new Date(now.getTime() + KST_MS)
  const today = new Date(Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate()))
  return courses.filter((course) => !removedIds.includes(course.id) && course.day % 7 === today.getUTCDay()
    && Number.isFinite(course.start) && Number.isFinite(course.end) && course.end > course.start)
    .map((course) => ({ ...course, key: `${course.id}-${today.toISOString()}`,
      startAt: new Date(today.getTime() - KST_MS + Math.round(course.start * 3600000)),
      endAt: new Date(today.getTime() - KST_MS + Math.round(course.end * 3600000)),
      building: resolveClassBuilding(course, buildings), online: /온라인|사이버|비대면/.test(`${course.title || ''} ${course.location || ''}`),
    })).filter((item) => item.endAt > now).sort((a, b) => a.startAt - b.startAt)
}

export function resolveClassBuilding(course, buildings) {
  if (/온라인|사이버|비대면/.test(`${course.title || ''} ${course.location || ''}`)) return null
  if (course.buildingId) return buildings.find((b) => b.id === course.buildingId) || null
  const location = String(course.location || '').replace(/\s/g, '')
  if (!location) return null
  const matches = buildings.filter((b) => {
    const aliases = [b.name, b.name.replace(/동$/, '')]
    if (b.name === '도서관') aliases.push('학술정보관', '백석학술정보관')
    return aliases.some((name) => name && location.startsWith(name))
  })
  return matches.length === 1 ? matches[0] : null
}
