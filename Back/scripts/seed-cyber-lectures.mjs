/**
 * 데모 5계정 사이버강의 + 오늘 마감 과제 시드
 * Task 테이블에 type 컬럼이 없어 id `cyber-…`, 제목 「과목 · N주차 사이버강의」로 구분한다.
 *
 * 사용: cd Back && node scripts/seed-cyber-lectures.mjs
 *
 * 데모일 화 2026-10-27 기준
 * - 이승빈(수업 중): 선형대수학 사강 오늘 마감
 * - 곽두팔(수업 중): 자료구조 사강 + 자료구조 퀴즈 과제 오늘 마감
 * - 김갑순(공강): 컴퓨터네트워크 사강 오늘 마감
 * - 조박필(공강): 알고리즘 과제 오늘 마감(seed-demo-students), 사강은 내일 이후
 * - 엄가영: 오늘 마감 없음 (대조군)
 */
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const env = Object.fromEntries(
  readFileSync(resolve(root, '.env'), 'utf8')
    .split(/\r?\n/)
    .filter((l) => l && !l.trimStart().startsWith('#') && l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
)
const SUPABASE_URL = env.SUPABASE_URL
const KEY = env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !KEY) {
  console.error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 필요')
  process.exit(1)
}
const headers = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'resolution=merge-duplicates,return=representation',
}

/** 9주차 마감 = 2026-10-27(화) + offsetDays. 주차마다 7일씩 */
const WEEK9_BASE = new Date(2026, 9, 27, 23, 59, 0)
const WEEKS = 10

function dueFor(week, offsetDays) {
  const d = new Date(WEEK9_BASE)
  d.setDate(d.getDate() + offsetDays + (week - 9) * 7)
  const p = (n) => String(n).padStart(2, '0')
  // timestamp without time zone → 오프셋 없이 로컬 시각 그대로
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:00`
}

const CYBER = [
  { userId: 'mocked_user_id', slug: 'lee', course: '선형대수학', offset: 0, importance: 4 },
  { userId: 'mocked_user_id', slug: 'lee', course: '사람다운 사람의 길', offset: 0, importance: 2 },
  { userId: 'demo-user-kwak', slug: 'kwak', course: '자료구조', offset: 0, importance: 4 },
  { userId: 'demo-user-kwak', slug: 'kwak', course: '컴퓨터네트워크', offset: 3, importance: 3 },
  { userId: 'demo-user-kim', slug: 'kim', course: '컴퓨터네트워크', offset: 0, importance: 3 },
  { userId: 'demo-user-kim', slug: 'kim', course: '데이터베이스', offset: 2, importance: 3 },
  { userId: 'demo-user-jo', slug: 'jo', course: '운영체제', offset: 2, importance: 4 },
  { userId: 'demo-user-jo', slug: 'jo', course: '컴퓨터네트워크', offset: 1, importance: 3 },
  { userId: 'demo-user-um', slug: 'um', course: '정보보안', offset: 1, importance: 4 },
  { userId: 'demo-user-um', slug: 'um', course: '모바일프로그래밍', offset: 3, importance: 3 },
]

const tasks = []
for (const c of CYBER) {
  for (let week = 1; week <= WEEKS; week += 1) {
    tasks.push({
      id: `cyber-${c.slug}-${c.course.replace(/\s+/g, '')}-w${String(week).padStart(2, '0')}`,
      userId: c.userId,
      title: `${c.course} · ${week}주차 사이버강의`,
      dueAt: dueFor(week, c.offset),
      importance: c.importance,
      status: week <= 8 ? 'COMPLETED' : 'PENDING',
    })
  }
}

// 오늘 마감 과제 (수업 중 케이스)
tasks.push(
  {
    id: 'task-lee-ai-w9-today',
    userId: 'mocked_user_id',
    title: '인공지능 · 9주차: CNN 실습 노트 제출',
    dueAt: '2026-10-27T23:59:00',
    importance: 5,
    status: 'PENDING',
  },
  {
    id: 'task-kwak-ds-quiz-w9',
    userId: 'demo-user-kwak',
    title: '자료구조 · 9주차: 스택·큐 퀴즈 제출',
    dueAt: '2026-10-27T23:59:00',
    importance: 4,
    status: 'PENDING',
  },
)

const res = await fetch(`${SUPABASE_URL}/rest/v1/Task?on_conflict=id`, {
  method: 'POST',
  headers,
  body: JSON.stringify(tasks),
})
const text = await res.text()
if (!res.ok) throw new Error(`${res.status} ${text}`)
const today = tasks.filter((t) => t.dueAt.startsWith('2026-10-27'))
console.log(`완료: ${tasks.length}건 upsert`)
console.log('오늘(10/27) 마감:')
for (const t of today) console.log(`- ${t.userId} · ${t.title}`)
