const STORAGE_KEY = 'bu-class-early-end'

export function markClassEarlyEnd(classId) {
  if (!classId) return
  const payload = { classId: String(classId), at: Date.now() }
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch { /* ignore */ }
  window.dispatchEvent(new CustomEvent('bu-class-early-end', { detail: payload }))
}

export function clearClassEarlyEnd({ silent = false } = {}) {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch { /* ignore */ }
  if (!silent) {
    window.dispatchEvent(new CustomEvent('bu-class-early-end', { detail: null }))
  }
}

/** 데모 시계로 들어올 때 이전 클릭 잔상 제거 */
export function resetEarlyEndForDemo() {
  clearClassEarlyEnd({ silent: true })
}

export function getEarlyEndRecord() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.classId) return null
    // 하루 지나면 무시
    if (Date.now() - Number(parsed.at || 0) > 12 * 60 * 60 * 1000) return null
    return parsed
  } catch {
    return null
  }
}

export function isClassMarkedEarly(classId) {
  const rec = getEarlyEndRecord()
  return Boolean(rec && classId && String(rec.classId) === String(classId))
}
