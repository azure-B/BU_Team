const STORAGE_KEY = 'bu-chat-stats-v1'

const LLM_FREE = new Set(['faq', 'faq_clarify', 'engine', 'campus', 'shuttle', 'gap', 'notice', 'schedule'])

function empty() {
  return {
    total: 0,
    byRoute: {},
    latencySum: 0,
    latencyCount: 0,
    llmFree: 0,
    llm: 0,
  }
}

export function readChatStats() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return empty()
    const parsed = JSON.parse(raw)
    return { ...empty(), ...parsed, byRoute: parsed.byRoute || {} }
  } catch {
    return empty()
  }
}

export function recordChatStat({ route, latencyMs } = {}) {
  const stats = readChatStats()
  const r = route || 'unknown'
  stats.total += 1
  stats.byRoute[r] = (stats.byRoute[r] || 0) + 1
  if (typeof latencyMs === 'number' && latencyMs >= 0) {
    stats.latencySum += latencyMs
    stats.latencyCount += 1
  }
  if (LLM_FREE.has(r)) stats.llmFree += 1
  else if (r === 'rag_llm') stats.llm += 1
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats))
  } catch { /* ignore */ }
  return stats
}

export function llmFreePercent(stats = readChatStats()) {
  if (!stats.total) return 0
  return Math.round((stats.llmFree / stats.total) * 100)
}

export function avgLatencyMs(stats = readChatStats()) {
  if (!stats.latencyCount) return null
  return Math.round(stats.latencySum / stats.latencyCount)
}

/** 대략 토큰 비용 추정 (표시용) — LLM 호출만 */
export function estimatedCostKrw(stats = readChatStats()) {
  // gpt-5-mini 대략 가정: 호출당 ~₩5 (데모 숫자)
  return (stats.llm || 0) * 5
}
