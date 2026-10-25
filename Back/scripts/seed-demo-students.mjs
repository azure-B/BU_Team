/**
 * 데모 5계정(이승빈 + 4명) 시드 — 컴공 ~18학점, 화 12:30 케이스별 시간표
 *
 * 사용: cd Back && node scripts/seed-demo-students.mjs
 * 비밀번호 공통: password123
 *
 * 화요일 12:30 기준 대시보드 케이스
 * - 이승빈: 수업 마무리(wind-down) — 인공지능 10:00–12:50
 * - 곽두팔: 수업 중 체크인(engage) — 운영체제 10:00–14:50
 * - 김갑순: 공강+식사 추천 — 오전 종료 후 14:00 수업
 * - 조박필: 공강+과제/식사 — 긴 여유 + 임박 과제
 * - 엄가영: 짧은 이동 여유 — 12:00 종료 → 12:50 조형관
 */
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import bcrypt from 'bcryptjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const envText = readFileSync(resolve(root, '.env'), 'utf8')
const env = Object.fromEntries(
  envText
    .split(/\r?\n/)
    .filter((line) => line && !line.trimStart().startsWith('#') && line.includes('='))
    .map((line) => {
      const i = line.indexOf('=')
      return [line.slice(0, i).trim(), line.slice(i + 1).trim()]
    }),
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

const PASSWORD = 'password123'
const passwordHash = await bcrypt.hash(PASSWORD, 10)

/** @type {{ id: string, studentId: string, name: string, department: string, grade: number, caseLabel: string, schedules: object[], tasks?: object[] }[]} */
const STUDENTS = [
  {
    id: 'mocked_user_id',
    studentId: '20221001',
    name: '이승빈',
    department: '컴퓨터공학부',
    grade: 3,
    caseLabel: '화 12:30 wind-down (인공지능 종료 임박)',
    // 기존 8과목 유지 — 시드에서 스케줄은 건드리지 않음(이미 존재)
    schedules: null,
    tasks: null,
  },
  {
    id: 'demo-user-kwak',
    studentId: '20221002',
    name: '곽두팔',
    department: '컴퓨터공학부',
    grade: 3,
    caseLabel: '화 12:30 수업 중 체크인',
    schedules: [
      // Mon 3
      { id: 'sch-kwak-lin', title: '선형대수학 (본부513)', startAt: '2026-10-26T09:00:00', endAt: '2026-10-26T11:50:00', buildingId: 'bldg-hq' },
      // Tue 3 — mid-class at 12:30
      { id: 'sch-kwak-os', title: '운영체제 (본부412)', startAt: '2026-10-27T10:00:00', endAt: '2026-10-27T14:50:00', buildingId: 'bldg-hq' },
      // Wed 3
      { id: 'sch-kwak-ds', title: '자료구조 (진리305)', startAt: '2026-10-28T13:00:00', endAt: '2026-10-28T15:50:00', buildingId: 'bldg-truth' },
      // Thu 6
      { id: 'sch-kwak-db', title: '데이터베이스 (본부510)', startAt: '2026-10-29T09:00:00', endAt: '2026-10-29T11:50:00', buildingId: 'bldg-hq' },
      { id: 'sch-kwak-web', title: '웹프로그래밍 (본부505)', startAt: '2026-10-29T14:00:00', endAt: '2026-10-29T16:50:00', buildingId: 'bldg-hq' },
      // Fri 3
      { id: 'sch-kwak-net', title: '컴퓨터네트워크 (조형208)', startAt: '2026-10-30T10:00:00', endAt: '2026-10-30T12:50:00', buildingId: 'bldg-art' },
    ],
    tasks: [
      { id: 'task-kwak-os-w9', title: '운영체제 · 9주차: 스케줄러 시뮬 보고서', dueAt: '2026-10-31T23:59:00+09:00', importance: 4, status: 'PENDING' },
      { id: 'task-kwak-ds-w9', title: '자료구조 · 9주차: 그래프 탐색 과제', dueAt: '2026-11-02T23:59:00+09:00', importance: 4, status: 'IN_PROGRESS' },
    ],
  },
  {
    id: 'demo-user-kim',
    studentId: '20221003',
    name: '김갑순',
    department: '컴퓨터공학부',
    grade: 2,
    caseLabel: '화 12:30 공강·식사 추천',
    schedules: [
      { id: 'sch-kim-algo', title: '알고리즘 (본부514)', startAt: '2026-10-26T09:00:00', endAt: '2026-10-26T11:50:00', buildingId: 'bldg-hq' },
      { id: 'sch-kim-ds', title: '자료구조 (본부210)', startAt: '2026-10-27T09:00:00', endAt: '2026-10-27T11:50:00', buildingId: 'bldg-hq' },
      { id: 'sch-kim-net', title: '컴퓨터네트워크 (진리401)', startAt: '2026-10-27T14:00:00', endAt: '2026-10-27T16:50:00', buildingId: 'bldg-truth' },
      { id: 'sch-kim-os', title: '운영체제 (본부412)', startAt: '2026-10-28T13:00:00', endAt: '2026-10-28T15:50:00', buildingId: 'bldg-hq' },
      { id: 'sch-kim-db', title: '데이터베이스 (본부510)', startAt: '2026-10-29T10:00:00', endAt: '2026-10-29T12:50:00', buildingId: 'bldg-hq' },
      { id: 'sch-kim-se', title: '소프트웨어공학 (본부515)', startAt: '2026-10-29T14:00:00', endAt: '2026-10-29T16:50:00', buildingId: 'bldg-hq' },
    ],
    tasks: [
      { id: 'task-kim-net-w9', title: '컴퓨터네트워크 · 9주차: TCP 혼잡제어 요약', dueAt: '2026-11-01T23:59:00+09:00', importance: 3, status: 'PENDING' },
    ],
  },
  {
    id: 'demo-user-jo',
    studentId: '20221004',
    name: '조박필',
    department: '컴퓨터공학부',
    grade: 4,
    caseLabel: '화 12:30 공강·과제(학습존) 추천',
    schedules: [
      { id: 'sch-jo-comp', title: '컴파일러 (본부513)', startAt: '2026-10-26T09:00:00', endAt: '2026-10-26T11:50:00', buildingId: 'bldg-hq' },
      { id: 'sch-jo-web', title: '웹프로그래밍 (본부505)', startAt: '2026-10-27T09:00:00', endAt: '2026-10-27T11:50:00', buildingId: 'bldg-hq' },
      { id: 'sch-jo-cap', title: '캡스톤디자인 (본부515)', startAt: '2026-10-27T16:00:00', endAt: '2026-10-27T17:50:00', buildingId: 'bldg-hq' },
      { id: 'sch-jo-algo', title: '알고리즘 (진리305)', startAt: '2026-10-28T13:00:00', endAt: '2026-10-28T15:50:00', buildingId: 'bldg-truth' },
      { id: 'sch-jo-os', title: '운영체제 (본부412)', startAt: '2026-10-29T09:00:00', endAt: '2026-10-29T11:50:00', buildingId: 'bldg-hq' },
      { id: 'sch-jo-net', title: '컴퓨터네트워크 (조형208)', startAt: '2026-10-29T14:00:00', endAt: '2026-10-29T16:50:00', buildingId: 'bldg-art' },
    ],
    tasks: [
      { id: 'task-jo-cap-w9', title: '캡스톤디자인 · 9주차: 핵심 기능 구현 체크리스트', dueAt: '2026-10-28T23:59:00+09:00', importance: 5, status: 'IN_PROGRESS' },
      { id: 'task-jo-web-w9', title: '웹프로그래밍 · 9주차: REST API 미니프로젝트', dueAt: '2026-10-29T23:59:00+09:00', importance: 5, status: 'PENDING' },
      { id: 'task-jo-algo-w8', title: '알고리즘 · 8주차: 동적계획법 연습세트', dueAt: '2026-10-27T23:59:00+09:00', importance: 4, status: 'PENDING' },
    ],
  },
  {
    id: 'demo-user-um',
    studentId: '20221005',
    name: '엄가영',
    department: '컴퓨터공학부',
    grade: 3,
    caseLabel: '화 12:30 짧은 이동 여유(다음 12:50)',
    schedules: [
      { id: 'sch-um-ai', title: '인공지능 (본부514)', startAt: '2026-10-26T13:00:00', endAt: '2026-10-26T15:50:00', buildingId: 'bldg-hq' },
      { id: 'sch-um-mobile', title: '모바일프로그래밍 (진리502)', startAt: '2026-10-27T09:00:00', endAt: '2026-10-27T12:00:00', buildingId: 'bldg-truth' },
      { id: 'sch-um-sec', title: '정보보안 (조형308)', startAt: '2026-10-27T12:50:00', endAt: '2026-10-27T14:50:00', buildingId: 'bldg-art' },
      { id: 'sch-um-db', title: '데이터베이스 (본부510)', startAt: '2026-10-28T10:00:00', endAt: '2026-10-28T12:50:00', buildingId: 'bldg-hq' },
      { id: 'sch-um-os', title: '운영체제 (본부412)', startAt: '2026-10-29T13:00:00', endAt: '2026-10-29T15:50:00', buildingId: 'bldg-hq' },
      { id: 'sch-um-se', title: '소프트웨어공학 (본부515)', startAt: '2026-10-30T09:00:00', endAt: '2026-10-30T11:50:00', buildingId: 'bldg-hq' },
    ],
    tasks: [
      { id: 'task-um-sec-w9', title: '정보보안 · 9주차: 취약점 리포트', dueAt: '2026-11-03T23:59:00+09:00', importance: 4, status: 'PENDING' },
    ],
  },
]

async function upsert(table, rows, onConflict = 'id') {
  if (!rows?.length) return []
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?on_conflict=${onConflict}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(rows),
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`${table} ${res.status} ${text}`)
  return text ? JSON.parse(text) : []
}

const users = STUDENTS.map((s) => ({
  id: s.id,
  studentId: s.studentId,
  name: s.name,
  department: s.department,
  grade: s.grade,
  passwordHash,
}))

console.log('upsert User…')
await upsert('User', users)

const schedules = []
const tasks = []
for (const s of STUDENTS) {
  if (s.schedules) {
    for (const sch of s.schedules) {
      schedules.push({
        ...sch,
        userId: s.id,
        type: 'CLASS',
      })
    }
  }
  if (s.tasks) {
    for (const t of s.tasks) {
      tasks.push({ ...t, userId: s.id })
    }
  }
}

console.log(`upsert Schedule ${schedules.length}…`)
await upsert('Schedule', schedules)
console.log(`upsert Task ${tasks.length}…`)
await upsert('Task', tasks)

console.log('\n완료 — 공통 비밀번호:', PASSWORD)
for (const s of STUDENTS) {
  const creditHint = s.schedules ? `${s.schedules.length}과목` : '기존 유지'
  console.log(`- ${s.name} (${s.studentId}) · ${creditHint} · ${s.caseLabel}`)
}
