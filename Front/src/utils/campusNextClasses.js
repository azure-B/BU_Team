const DAY_MS = 86400000
const KST_MS = 9 * 3600000

export function getTodayEndedClasses(courses = [], buildings = [], now = new Date(), removedIds = []) {
  const shifted = new Date(now.getTime() + KST_MS)
  const today = new Date(Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate()))
  return courses.filter((course) => !removedIds.includes(course.id) && course.day % 7 === today.getUTCDay()
    && Number.isFinite(course.start) && Number.isFinite(course.end) && course.end > course.start)
    .map((course) => ({ ...course, key: `${course.id}-ended`,
      startAt: new Date(today.getTime() - KST_MS + Math.round(course.start * 3600000)),
      endAt: new Date(today.getTime() - KST_MS + Math.round(course.end * 3600000)),
      building: resolveClassBuilding(course, buildings), online: /온라인|사이버|비대면/.test(`${course.title || ''} ${course.location || ''}`),
    })).filter((item) => item.endAt <= now).sort((a, b) => a.startAt - b.startAt)
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

// 시간표와 같은 주간 반복 수업을 한국 시각으로 투영한다. 지난 수업은 제외한다.
export function getNextClassMoves(courses = [], buildings = [], now = new Date(), removedIds = []) {
  const shifted = new Date(now.getTime() + KST_MS)
  const midnight = Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate())
  const rows = []
  for (let dayOffset = 0; dayOffset <= 7; dayOffset += 1) {
    const day = new Date(midnight + dayOffset * DAY_MS)
    for (const course of courses) {
      if (removedIds.includes(course.id) || course.day % 7 !== day.getUTCDay()) continue
      if (!Number.isFinite(course.start) || !Number.isFinite(course.end) || course.end <= course.start) continue
      const startAt = new Date(day.getTime() - KST_MS + Math.round(course.start * 3600000))
      const endAt = new Date(day.getTime() - KST_MS + Math.round(course.end * 3600000))
      if (startAt <= now) continue
      rows.push({ ...course, key: `${course.id}-${startAt.toISOString()}`, startAt, endAt, building: resolveClassBuilding(course, buildings), online: /온라인|사이버|비대면/.test(`${course.title || ''} ${course.location || ''}`) })
    }
  }
  return rows.sort((a, b) => a.startAt - b.startAt || a.endAt - b.endAt).slice(0, 4)
}
