/**
 * 발표용 URL 파라미터
 *
 * 예)
 *   /?time=0700&account=0
 *   /?time=12:30&account=2
 *   /?demoTime=live&demoUser=곽두팔   (기존 별칭도 유지)
 *
 * time / demoTime
 *   - 0700, 7:00, 12:30 → 데모 화요일 해당 시각
 *   - live → 실제 시·분을 데모 화요일에 얹음
 *
 * account / demoUser
 *   - 0~4 → DEMO_ACCOUNTS 인덱스 (0 이승빈 … 4 엄가영)
 *   - 이름·학번·slug → 기존 findDemoAccount
 */

import { DEMO_ACCOUNTS, findDemoAccount } from '../data/demoAccounts'

export function getDemoSearchParams(search = typeof window !== 'undefined' ? window.location.search : '') {
  return new URLSearchParams(typeof search === 'string' ? search : '')
}

/** @returns {{ live: true } | { hours: number, minutes: number } | null } */
export function parseDemoTimeParam(search) {
  const params = getDemoSearchParams(search)
  const raw = params.get('time') ?? params.get('demoTime')
  if (raw == null || raw === '') return null
  const v = String(raw).trim()
  if (v.toLowerCase() === 'live') return { live: true }

  // 0700 / 1230 / 700
  if (/^\d{3,4}$/.test(v)) {
    const padded = v.padStart(4, '0')
    const hours = Number(padded.slice(0, 2))
    const minutes = Number(padded.slice(2))
    if (hours <= 23 && minutes <= 59) return { hours, minutes }
    return null
  }

  // 7:00 / 12:30
  const m = v.match(/^(\d{1,2}):(\d{2})$/)
  if (m) {
    const hours = Number(m[1])
    const minutes = Number(m[2])
    if (hours <= 23 && minutes <= 59) return { hours, minutes }
  }
  return null
}

/**
 * @returns {{ account: object, index: number } | null}
 * account 쿼리가 숫자면 인덱스, 아니면 이름/학번/slug
 */
export function parseDemoAccountParam(search) {
  const params = getDemoSearchParams(search)
  const raw = params.get('account') ?? params.get('demoUser')
  if (raw == null || raw === '') return null

  const q = String(raw).trim()
  if (/^\d+$/.test(q)) {
    const index = Number(q)
    if (index >= 0 && index < DEMO_ACCOUNTS.length) {
      return { account: DEMO_ACCOUNTS[index], index }
    }
    return null
  }

  const account = findDemoAccount(q)
  if (!account) return null
  const index = DEMO_ACCOUNTS.findIndex((a) => a.studentId === account.studentId)
  return { account, index }
}

export function demoAccountIndexLabel(studentId) {
  const index = DEMO_ACCOUNTS.findIndex((a) => a.studentId === studentId)
  return index >= 0 ? index : null
}
