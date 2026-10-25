/**
 * 데모 계정 풀 (화 12:30 · Course 실제 과목 기준)
 * 공통 비밀번호: password123
 *
 * 헤더 DemoControls 또는 URL `?account=0&time=1230`
 */
export const DEMO_PASSWORD = 'password123'

export const DEMO_ACCOUNTS = [
  {
    studentId: '20221001',
    name: '이승빈',
    slug: 'lee',
    caseLabel: '정보보안컨설팅 마무리',
  },
  {
    studentId: '20221002',
    name: '곽두팔',
    slug: 'kwak',
    caseLabel: 'C언어프로그래밍 수업 중',
  },
  {
    studentId: '20221003',
    name: '김갑순',
    slug: 'kim',
    caseLabel: '자료구조론 공강·식사',
  },
  {
    studentId: '20221004',
    name: '조박필',
    slug: 'jo',
    caseLabel: '긴 공강·과제',
  },
  {
    studentId: '20221005',
    name: '엄가영',
    slug: 'um',
    caseLabel: '짧은 이동',
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
