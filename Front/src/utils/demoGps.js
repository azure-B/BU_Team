/**
 * 발표·테스트용 GPS 위치 오버라이드
 * - sessionStorage + URL ?gps=truth|hq|live
 * - live / 미설정 → 브라우저 실제 위치
 */

const STORAGE_KEY = 'bu-demo-gps'
export const DEMO_GPS_EVENT = 'bu-demo-gps'

/** Building.x=lat, Building.y=lng (수강 책자 동기화 좌표) */
export const DEMO_GPS_PRESETS = {
  truth: {
    id: 'truth',
    label: '진리관',
    buildingId: 'bldg-truth',
    lat: 36.8401635,
    lng: 127.1845025,
  },
  hq: {
    id: 'hq',
    label: '본부동',
    buildingId: 'bldg-hq',
    lat: 36.8396459,
    lng: 127.1858915,
  },
  live: {
    id: 'live',
    label: '실제위치',
    buildingId: null,
    lat: null,
    lng: null,
  },
}

function readStored() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed?.id && DEMO_GPS_PRESETS[parsed.id] ? parsed.id : null
  } catch {
    return null
  }
}

function readQuery() {
  if (typeof window === 'undefined') return null
  const q = new URLSearchParams(window.location.search).get('gps')
  if (!q) return null
  const key = String(q).trim().toLowerCase()
  if (key === 'truth' || key === '진리' || key === '진리관') return 'truth'
  if (key === 'hq' || key === '본부' || key === '본부동' || key === '본부관') return 'hq'
  if (key === 'live' || key === 'real' || key === '실제') return 'live'
  return null
}

/** @returns {'truth'|'hq'|'live'} */
export function getDemoGpsMode() {
  return readQuery() || readStored() || 'live'
}

/** @returns {{ lat: number, lng: number, buildingId?: string, id: string, label: string } | null} null이면 실제 GPS 사용 */
export function getDemoGpsOverride() {
  const mode = getDemoGpsMode()
  if (mode === 'live') return null
  const preset = DEMO_GPS_PRESETS[mode]
  if (!preset || !Number.isFinite(preset.lat)) return null
  return { ...preset }
}

export function setDemoGpsMode(mode, { reload = false } = {}) {
  const id = DEMO_GPS_PRESETS[mode] ? mode : 'live'
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ id, at: Date.now() }))
  } catch { /* ignore */ }

  if (typeof window !== 'undefined') {
    const url = new URL(window.location.href)
    if (id === 'live') url.searchParams.delete('gps')
    else url.searchParams.set('gps', id)
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`)
    window.dispatchEvent(new CustomEvent(DEMO_GPS_EVENT, { detail: { id } }))
    if (reload) window.location.assign(`${url.pathname}${url.search}${url.hash}`)
  }
}
