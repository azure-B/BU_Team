/**
 * 데모 5계정 사이버강의 + 오늘 마감 과제 시드
 * 과목명은 Course 테이블 실제 명칭 사용
 *
 * 사용: cd Back && node scripts/seed-cyber-lectures.mjs
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

const WEEK9_BASE = new Date(2026, 9, 27, 23, 59, 0)
const WEEKS = 10
const DEMO_USERS = ['mocked_user_id', 'demo-user-kwak', 'demo-user-kim', 'demo-user-jo', 'demo-user-um']

function dueFor(week, offsetDays) {
  const d = new Date(WEEK9_BASE)
  d.setDate(d.getDate() + offsetDays + (week - 9) * 7)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:00`
}

function slugCourse(name) {
  return String(name).replace(/\s+/g, '')
}

/** Course 실제 과목명 */
const CYBER = [
  { userId: 'mocked_user_id', slug: 'lee', course: '선형대수학', offset: 0, importance: 4 },
  { userId: 'mocked_user_id', slug: 'lee', course: '채플과 섬김', offset: 0, importance: 2 },
  { userId: 'demo-user-kwak', slug: 'kwak', course: '자료구조론', offset: 0, importance: 4 },
  { userId: 'demo-user-kwak', slug: 'kwak', course: '컴퓨터네트워크', offset: 3, importance: 3 },
  { userId: 'demo-user-kim', slug: 'kim', course: '컴퓨터네트워크', offset: 0, importance: 3 },
  { userId: 'demo-user-kim', slug: 'kim', course: '데이터베이스이론 및 실습', offset: 2, importance: 3 },
  { userId: 'demo-user-jo', slug: 'jo', course: '운영체제론', offset: 2, importance: 4 },
  { userId: 'demo-user-jo', slug: 'jo', course: '컴퓨터네트워크', offset: 1, importance: 3 },
  { userId: 'demo-user-um', slug: 'um', course: '정보보안컨설팅', offset: 1, importance: 4 },
  { userId: 'demo-user-um', slug: 'um', course: '스마트폰프로그래밍', offset: 3, importance: 3 },
]

// 예전 잘못된 과목명 cyber-* 정리
const del = await fetch(
  `${SUPABASE_URL}/rest/v1/Task?userId=in.(${DEMO_USERS.join(',')})&id=like.cyber-*`,
  { method: 'DELETE', headers: { ...headers, Prefer: 'return=minimal' } },
)
if (!del.ok) console.warn('cyber 삭제 경고', del.status, await del.text())
else console.log('기존 cyber-* Task 삭제')

const tasks = []
for (const c of CYBER) {
  for (let week = 1; week <= WEEKS; week += 1) {
    tasks.push({
      id: `cyber-${c.slug}-${slugCourse(c.course)}-w${String(week).padStart(2, '0')}`,
      userId: c.userId,
      title: `${c.course} · ${week}주차 사이버강의`,
      dueAt: dueFor(week, c.offset),
      importance: c.importance,
      status: week <= 8 ? 'COMPLETED' : 'PENDING',
    })
  }
}

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
