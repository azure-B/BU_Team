import { login, getCurrentUser } from '../api/authApi'
import {
  DEMO_ACCOUNTS,
  DEMO_PASSWORD,
  pickRandomDemoAccount,
} from '../data/demoAccounts'
import { parseDemoAccountParam } from './demoParams'

const ASSIGNED_KEY = 'bu-demo-account-assigned'

function isPageReload() {
  try {
    const nav = performance.getEntriesByType?.('navigation')?.[0]
    if (nav?.type === 'reload') return true
    // legacy
    if (typeof performance !== 'undefined' && performance.navigation?.type === 1) return true
  } catch {
    /* ignore */
  }
  return false
}

function pickDifferentFrom(studentId) {
  const others = DEMO_ACCOUNTS.filter((a) => a.studentId !== studentId)
  if (!others.length) return pickRandomDemoAccount()
  return others[Math.floor(Math.random() * others.length)]
}

/**
 * 데모 5계정 세션 보장.
 * - `?account=0`~`4` 또는 `?demoUser=` → 해당 계정 강제 (새로고침해도 유지)
 * - 파라미터 없을 때 새로고침(F5 / Ctrl+F5) → 이전과 다른 계정으로 전환
 * - 첫 진입 → 5명 중 랜덤
 */
export async function ensureDemoSession() {
  if (typeof window === 'undefined') return getCurrentUser()

  const forcedPick = parseDemoAccountParam(window.location.search)
  const forced = forcedPick?.account || null

  let pick = forced
  const remembered = sessionStorage.getItem(ASSIGNED_KEY)

  if (!pick) {
    if (isPageReload() && remembered) {
      pick = pickDifferentFrom(remembered)
    } else if (remembered) {
      pick = DEMO_ACCOUNTS.find((a) => a.studentId === remembered) || null
    }
  }
  if (!pick) {
    pick = pickRandomDemoAccount()
  }

  const current = getCurrentUser()
  if (current?.studentId === pick.studentId && localStorage.getItem('token') && (!isPageReload() || forced)) {
    sessionStorage.setItem(ASSIGNED_KEY, pick.studentId)
    return current
  }

  await login(pick.studentId, DEMO_PASSWORD)
  sessionStorage.setItem(ASSIGNED_KEY, pick.studentId)
  return getCurrentUser()
}
