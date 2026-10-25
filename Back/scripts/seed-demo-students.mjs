/**
 * 데모 5계정 시드 — Course(수강 책자) 실제 과목·강의실·시간으로 시간표 구성
 *
 * 사용: cd Back && node scripts/seed-demo-students.mjs
 * 비밀번호 공통: password123
 *
 * 화요일 12:30 대시보드 케이스 (과목명은 Course.title 그대로)
 * - 이승빈: 정보보안컨설팅 10:00–12:50 → 수업 마무리
 * - 곽두팔: C언어프로그래밍 12:00–14:50 → 수업 중 체크인
 * - 김갑순: 자료구조론 10:00–11:50 → 14:00 자료구조론 → 공강·식사
 * - 조박필: 자료구조론 10:00–11:50 → 14:00 정보보호관리체계 → 긴 공강·과제
 * - 엄가영: 자료구조론 10:00–11:50 → 12:00 C언어프로그래밍 → 짧은 이동
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

/** 데모 주간: 월 10/26 ~ 금 10/30 (화=day 2) */
const WEEK_DATE = { 1: '2026-10-26', 2: '2026-10-27', 3: '2026-10-28', 4: '2026-10-29', 5: '2026-10-30' }

function roomToBuilding(room = '') {
  if (/진리/.test(room)) return 'bldg-truth'
  if (/조형/.test(room)) return 'bldg-art'
  if (/목양/.test(room)) return 'bldg-mogyang'
  if (/지혜/.test(room)) return 'bldg-wisdom'
  if (/백석홀|체육관/.test(room)) return /체육관/.test(room) ? 'bldg-gym' : 'bldg-hall'
  if (/학생/.test(room)) return 'bldg-stu'
  return 'bldg-hq' // 본부*
}

async function rest(path, { method = 'GET', body, prefer } = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      ...headers,
      ...(prefer ? { Prefer: prefer } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`${method} ${path} ${res.status} ${text}`)
  return text ? JSON.parse(text) : null
}

const courses = await rest(
  'Course?select=id,title,day,startTime,endTime,room,credit,major,department&department=eq.컴퓨터공학부&limit=800',
)

function findCourse({ title, day, startTime, room, majorIncludes }) {
  const hit = courses.find((c) => {
    if (c.title !== title || c.day !== day || c.startTime !== startTime) return false
    if (room && c.room !== room) return false
    if (majorIncludes && !String(c.major || '').includes(majorIncludes)) return false
    return true
  })
  if (!hit) {
    throw new Error(`Course 없음: ${title} day=${day} ${startTime} ${room || ''} ${majorIncludes || ''}`)
  }
  return hit
}

function toSchedule(id, course) {
  const date = WEEK_DATE[course.day]
  if (!date) throw new Error(`day ${course.day} 날짜 없음`)
  return {
    id,
    title: `${course.title} (${course.room})`,
    startAt: `${date}T${course.startTime}:00`,
    endAt: `${date}T${course.endTime}:00`,
    buildingId: roomToBuilding(course.room),
    type: 'CLASS',
  }
}

/** 픽: 실제 Course 행 */
const PICK = {
  // 화
  secConsulting: () => findCourse({ title: '정보보안컨설팅', day: 2, startTime: '10:00', room: '본부206' }),
  cLangTue: () => findCourse({ title: 'C언어프로그래밍', day: 2, startTime: '12:00', room: '본부505', majorIncludes: '소프트웨어' }),
  dsTueAm: () => findCourse({ title: '자료구조론', day: 2, startTime: '10:00', room: '본부513', majorIncludes: '소프트웨어' }),
  dsTuePm: () => findCourse({ title: '자료구조론', day: 2, startTime: '14:00', room: '본부513', majorIncludes: '소프트웨어' }),
  infoSecMgmt: () => findCourse({ title: '정보보호관리체계', day: 2, startTime: '14:00', room: '본부516' }),
  aiTue: () => findCourse({ title: '인공지능', day: 2, startTime: '13:00', room: '본부514', majorIncludes: '인공지능' }),
  // 월
  netMon: () => findCourse({ title: '컴퓨터네트워크', day: 1, startTime: '09:00', room: '본부510' }),
  seMon: () => findCourse({ title: '소프트웨어공학', day: 1, startTime: '12:00', room: '본부107' }),
  osMon: () => findCourse({ title: '운영체제론', day: 1, startTime: '13:00', room: '본부516', majorIncludes: '소프트웨어' }),
  dbMon: () => findCourse({ title: '데이터베이스이론 및 실습', day: 1, startTime: '14:00', room: '본부520', majorIncludes: '소프트웨어' }),
  // 수
  algoWed: () => findCourse({ title: '알고리즘 및 실습', day: 3, startTime: '09:00', room: '본부515', majorIncludes: '소프트웨어' }),
  dsWed: () => findCourse({ title: '자료구조론', day: 3, startTime: '13:00', room: '본부516', majorIncludes: '소프트웨어' }),
  javaWed: () => findCourse({ title: 'JAVA프로그래밍', day: 3, startTime: '14:00', room: '본부206', majorIncludes: '소프트웨어' }),
  // 목
  linAlg: () => findCourse({ title: '선형대수학', day: 4, startTime: '09:00', room: '본부513', majorIncludes: '인공지능' }),
  webThu: () => findCourse({ title: '웹프로그래밍', day: 4, startTime: '14:00', room: '본부510', majorIncludes: '소프트웨어' }),
  capThu: () => findCourse({ title: '캡스톤디자인', day: 4, startTime: '13:00', room: '본부515', majorIncludes: '소프트웨어' }),
  // 금
  webAppFri: () => findCourse({ title: '웹응용프로그래밍', day: 5, startTime: '15:00', room: '본부518', majorIncludes: '소프트웨어' }),
}

const STUDENTS = [
  {
    id: 'mocked_user_id',
    studentId: '20221001',
    name: '이승빈',
    department: '컴퓨터공학부',
    grade: 3,
    caseLabel: '화 12:30 wind-down (정보보안컨설팅 종료 임박)',
    scheduleIds: [
      ['sch-lee-net', PICK.netMon],
      ['sch-lee-sec', PICK.secConsulting],
      ['sch-lee-algo', PICK.algoWed],
      ['sch-lee-lin', PICK.linAlg],
      ['sch-lee-web', PICK.webThu],
      ['sch-lee-webapp', PICK.webAppFri],
    ],
    tasks: [
      { id: 'task-lee-ai-w9-today', title: '인공지능 · 9주차: CNN 실습 노트 제출', dueAt: '2026-10-27T23:59:00', importance: 5, status: 'PENDING' },
    ],
  },
  {
    id: 'demo-user-kwak',
    studentId: '20221002',
    name: '곽두팔',
    department: '컴퓨터공학부',
    grade: 3,
    caseLabel: '화 12:30 수업 중 체크인 (C언어프로그래밍)',
    scheduleIds: [
      ['sch-kwak-os', PICK.osMon],
      ['sch-kwak-clang', PICK.cLangTue],
      ['sch-kwak-ds', PICK.dsWed],
      ['sch-kwak-lin', PICK.linAlg],
      ['sch-kwak-web', PICK.webThu],
      ['sch-kwak-webapp', PICK.webAppFri],
    ],
    tasks: [
      { id: 'task-kwak-os-w9', title: '운영체제론 · 9주차: 스케줄러 시뮬 보고서', dueAt: '2026-10-31T23:59:00', importance: 4, status: 'PENDING' },
      { id: 'task-kwak-ds-w9', title: '자료구조론 · 9주차: 그래프 탐색 과제', dueAt: '2026-11-02T23:59:00', importance: 4, status: 'IN_PROGRESS' },
      { id: 'task-kwak-ds-quiz-w9', title: '자료구조론 · 9주차: 스택·큐 퀴즈 제출', dueAt: '2026-10-27T23:59:00', importance: 4, status: 'PENDING' },
    ],
  },
  {
    id: 'demo-user-kim',
    studentId: '20221003',
    name: '김갑순',
    department: '컴퓨터공학부',
    grade: 2,
    caseLabel: '화 12:30 공강·식사 (자료구조론 → 자료구조론)',
    scheduleIds: [
      ['sch-kim-se', PICK.seMon],
      ['sch-kim-ds-am', PICK.dsTueAm],
      ['sch-kim-ds-pm', PICK.dsTuePm],
      ['sch-kim-java', PICK.javaWed],
      ['sch-kim-lin', PICK.linAlg],
      ['sch-kim-web', PICK.webThu],
    ],
    tasks: [
      { id: 'task-kim-net-w9', title: '컴퓨터네트워크 · 9주차: TCP 혼잡제어 요약', dueAt: '2026-11-01T23:59:00', importance: 3, status: 'PENDING' },
    ],
  },
  {
    id: 'demo-user-jo',
    studentId: '20221004',
    name: '조박필',
    department: '컴퓨터공학부',
    grade: 4,
    caseLabel: '화 12:30 긴 공강·과제 (자료구조론 → 정보보호관리체계)',
    scheduleIds: [
      ['sch-jo-db', PICK.dbMon],
      ['sch-jo-ds', PICK.dsTueAm],
      ['sch-jo-sec', PICK.infoSecMgmt],
      ['sch-jo-algo', PICK.algoWed],
      ['sch-jo-cap', PICK.capThu],
      ['sch-jo-webapp', PICK.webAppFri],
    ],
    tasks: [
      { id: 'task-jo-cap-w9', title: '캡스톤디자인 · 9주차: 핵심 기능 구현 체크리스트', dueAt: '2026-10-28T23:59:00', importance: 5, status: 'IN_PROGRESS' },
      { id: 'task-jo-web-w9', title: '웹프로그래밍 · 9주차: REST API 미니프로젝트', dueAt: '2026-10-29T23:59:00', importance: 5, status: 'PENDING' },
      { id: 'task-jo-algo-w8', title: '알고리즘 및 실습 · 8주차: 동적계획법 연습세트', dueAt: '2026-10-27T23:59:00', importance: 4, status: 'PENDING' },
    ],
  },
  {
    id: 'demo-user-um',
    studentId: '20221005',
    name: '엄가영',
    department: '컴퓨터공학부',
    grade: 3,
    caseLabel: '화 12:30 짧은 이동 (자료구조론 → C언어프로그래밍)',
    scheduleIds: [
      ['sch-um-net', PICK.netMon],
      ['sch-um-ds', PICK.dsTueAm],
      ['sch-um-clang', PICK.cLangTue],
      ['sch-um-ds-wed', PICK.dsWed],
      ['sch-um-web', PICK.webThu],
      ['sch-um-webapp', PICK.webAppFri],
    ],
    tasks: [
      { id: 'task-um-sec-w9', title: '정보보안컨설팅 · 9주차: 취약점 리포트', dueAt: '2026-11-03T23:59:00', importance: 4, status: 'PENDING' },
    ],
  },
]

const userIds = STUDENTS.map((s) => s.id)

console.log(`Course ${courses.length}건 로드`)

console.log('upsert User…')
await rest('User?on_conflict=id', {
  method: 'POST',
  body: STUDENTS.map((s) => ({
    id: s.id,
    studentId: s.studentId,
    name: s.name,
    department: s.department,
    grade: s.grade,
    passwordHash,
  })),
})

// 데모 계정 기존 시간표·데모 과제 정리 후 재삽입
const inUsers = `userId=in.(${userIds.join(',')})`
console.log('clear Schedule…')
await rest(`Schedule?${inUsers}`, { method: 'DELETE', prefer: 'return=minimal' })

const schedules = []
for (const s of STUDENTS) {
  for (const [id, pick] of s.scheduleIds) {
    schedules.push({ ...toSchedule(id, pick()), userId: s.id })
  }
}
console.log(`upsert Schedule ${schedules.length}…`)
await rest('Schedule?on_conflict=id', { method: 'POST', body: schedules })

const tasks = STUDENTS.flatMap((s) => (s.tasks || []).map((t) => ({ ...t, userId: s.id })))
console.log(`upsert Task ${tasks.length}…`)
await rest('Task?on_conflict=id', { method: 'POST', body: tasks })

console.log('\n완료 — 공통 비밀번호:', PASSWORD)
for (const s of STUDENTS) {
  const titles = s.scheduleIds.map(([, pick]) => pick().title)
  const credits = s.scheduleIds.reduce((sum, [, pick]) => sum + (Number(pick().credit) || 0), 0)
  console.log(`- ${s.name} (${s.studentId}) · ${credits}학점 · ${s.caseLabel}`)
  console.log(`  ${titles.join(' / ')}`)
}
