/**
 * 데모 계정 풀 (화 12:30 기준 대시보드 케이스)
 * 공통 비밀번호: password123
 *
 * URL 고정 예)
 *   ?account=0  … ?account=4   (인덱스)
 *   ?demoUser=곽두팔 / 20221002 / kwak
 *   ?time=0700&account=1
 */
export const DEMO_PASSWORD = 'password123'

export const DEMO_ACCOUNTS = [
  {
    studentId: '20221001',
    name: '이승빈',
    slug: 'lee',
    caseLabel: '수업 마무리(wind-down)',
  },
  {
    studentId: '20221002',
    name: '곽두팔',
    slug: 'kwak',
    caseLabel: '수업 중 체크인',
  },
  {
    studentId: '20221003',
    name: '김갑순',
    slug: 'kim',
    caseLabel: '공강·식사 추천',
  },
  {
    studentId: '20221004',
    name: '조박필',
    slug: 'jo',
    caseLabel: '공강·과제/식사',
  },
  {
    studentId: '20221005',
    name: '엄가영',
    slug: 'um',
    caseLabel: '짧은 이동 여유',
  },
]

export function findDemoAccount(raw) {
  if (!raw) return null
  const q = String(raw).trim().toLowerCase()
  return (
    DEMO_ACCOUNTS.find(
      (a) =>
        a.studentId === q ||
        a.slug === q ||
        a.name === raw.trim() ||
        a.name.toLowerCase() === q,
    ) || null
  )
}

export function pickRandomDemoAccount() {
  const i = Math.floor(Math.random() * DEMO_ACCOUNTS.length)
  return DEMO_ACCOUNTS[i]
}
