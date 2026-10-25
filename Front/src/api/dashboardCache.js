/**
 * 대시보드 카드가 동시에 같은 API를 여러 번 치지 않도록
 * in-flight 공유 + 짧은 TTL 캐시.
 */

const TTL_MS = 45_000

function makeSlot() {
  return { at: 0, data: null, inflight: null }
}

const slots = {
  schedules: makeSlot(),
  buildings: makeSlot(),
  facilities: makeSlot(),
  tasks: makeSlot(),
  prioritized: makeSlot(),
}

function readFresh(slot) {
  return slot.data != null && Date.now() - slot.at < TTL_MS
}

async function cached(slot, loader, { force = false } = {}) {
  if (!force && readFresh(slot)) return slot.data
  if (!force && slot.inflight) return slot.inflight
  const run = Promise.resolve()
    .then(loader)
    .then((data) => {
      slot.data = data
      slot.at = Date.now()
      slot.inflight = null
      return data
    })
    .catch((err) => {
      slot.inflight = null
      throw err
    })
  slot.inflight = run
  return run
}

export function invalidateDashboardCache(keys) {
  const list = keys?.length ? keys : Object.keys(slots)
  for (const key of list) {
    if (slots[key]) slots[key] = makeSlot()
  }
}

export function cachedSchedules(loader, opts) {
  return cached(slots.schedules, loader, opts)
}

export function cachedBuildings(loader, opts) {
  return cached(slots.buildings, loader, opts)
}

export function cachedFacilities(loader, opts) {
  return cached(slots.facilities, loader, opts)
}

export function cachedTasks(loader, opts) {
  return cached(slots.tasks, loader, opts)
}

export function cachedPrioritizedTasks(loader, opts) {
  return cached(slots.prioritized, loader, opts)
}
