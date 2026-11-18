/**
 * Course DB → 건물·요일·시각별 예상 인원(수용 인원 합) CSV
 * 사용: node scripts/export-building-crowd-csv.mjs
 * 출력: ../others/building-crowd-by-hour.csv
 *
 * estimated_people = 해당 슬롯에 시작하는 수업들의 capacity 합
 * (실제 출석이 아니라 강의 정원 기준 쏠림 지표)
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dir = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dir, '../..')
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

const URL = env.SUPABASE_URL
const KEY = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_KEY
if (!URL || !KEY) {
  console.error('SUPABASE_URL / SERVICE_ROLE_KEY 필요')
  process.exit(1)
}
const headers = { apikey: KEY, Authorization: `Bearer ${KEY}` }

const DAYS = { 1: '월', 2: '화', 3: '수', 4: '목', 5: '금', 6: '토', 0: '일' }

/** 강의실 문자열 → 건물. 요일코드(화5·목3)처럼 강의실이 아닌 값은 null */
function buildingOf(room) {
  const r = String(room || '').trim()
  if (!r) return null
  // 시간표 요일·교시만 적힌 잘못된 room (예: 화5, 목5,6, 금1,2,3,4)
  if (/^[월화수목금토일][\d,\s]*$/.test(r)) return null
  if (/^본부|^본관/.test(r)) return '본부동'
  if (/^진리/.test(r)) return '진리관'
  if (/^지혜/.test(r)) return '지혜관'
  if (/^목양/.test(r)) return '목양관'
  if (/^조형/.test(r)) return '조형관'
  if (/^체육/.test(r)) return '체육관'
  if (/백석홀/.test(r)) return '백석홀'
  if (/^예술|^예대/.test(r)) return '예술대학동'
  if (/^글로벌/.test(r)) return '글로벌관'
  if (/^음악/.test(r)) return '음악관'
  if (/^승리/.test(r)) return '승리관'
  if (/^자유/.test(r)) return '자유관'
  if (/학술정보|도서관|열람/.test(r)) return '도서관'
  if (/학생|복지/.test(r)) return '학생회관'
  if (/기숙|생활관/.test(r)) return '기숙사'
  return null
}

function parseMeetings(raw, day, startTime, endTime) {
  let meetings = raw
  if (typeof meetings === 'string') {
    try {
      meetings = JSON.parse(meetings)
    } catch {
      meetings = []
    }
  }
  if (!Array.isArray(meetings)) meetings = []
  if (!meetings.length && day && startTime) {
    meetings = [{ day, start: startTime, end: endTime }]
  }
  return meetings
}

function csvEscape(v) {
  const s = String(v ?? '')
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

async function fetchCourses() {
  let all = []
  let offset = 0
  for (;;) {
    const rows = await fetch(
      `${URL}/rest/v1/Course?select=id,title,room,capacity,day,startTime,endTime,meetings&offset=${offset}&limit=1000`,
      { headers },
    ).then((r) => r.json())
    if (!Array.isArray(rows)) {
      console.error('Course fetch failed', rows)
      process.exit(1)
    }
    if (!rows.length) break
    all = all.concat(rows)
    offset += rows.length
    if (rows.length < 1000) break
  }
  return all
}

const courses = await fetchCourses()
/** building|day|hour -> { classCount, people, rooms:Set } */
const agg = new Map()
const skippedRooms = new Map()
let mapped = 0
let skipped = 0

for (const c of courses) {
  const building = buildingOf(c.room)
  if (!building) {
    const key = String(c.room || '(empty)')
    skippedRooms.set(key, (skippedRooms.get(key) || 0) + 1)
    skipped += 1
    continue
  }
  const meetings = parseMeetings(c.meetings, c.day, c.startTime, c.endTime)
  const capacity = Math.max(0, Number(c.capacity) || 0)
  for (const m of meetings) {
    const day = Number(m.day)
    const start = m.start || c.startTime
    if (!Number.isFinite(day) || day < 1 || day > 5 || !start) continue
    const hour = Number(String(start).slice(0, 2))
    if (!Number.isFinite(hour) || hour < 8 || hour > 21) continue
    const key = `${building}|${day}|${hour}`
    const cur = agg.get(key) || { classCount: 0, people: 0, rooms: new Set() }
    cur.classCount += 1
    cur.people += capacity
    if (c.room) cur.rooms.add(String(c.room))
    agg.set(key, cur)
    mapped += 1
  }
}

const buildings = [...new Set([...agg.keys()].map((k) => k.split('|')[0]))].sort()
const maxByBuilding = Object.fromEntries(buildings.map((b) => [b, 0]))
for (const [key, { people }] of agg) {
  const b = key.split('|')[0]
  maxByBuilding[b] = Math.max(maxByBuilding[b], people)
}

const rows = []
for (const building of buildings) {
  for (const day of [1, 2, 3, 4, 5]) {
    for (let hour = 8; hour <= 21; hour += 1) {
      const { classCount = 0, people = 0, rooms = new Set() } =
        agg.get(`${building}|${day}|${hour}`) || {}
      const peak = maxByBuilding[building] || 0
      const share = peak > 0 ? Math.round((people / peak) * 1000) / 10 : 0
      rows.push({
        building,
        day,
        day_label: DAYS[day],
        hour,
        start_label: `${String(hour).padStart(2, '0')}:00`,
        class_start_count: classCount,
        estimated_people: people,
        building_peak_people: peak,
        peak_share_pct: share,
        is_peak: people > 0 && people >= peak ? 1 : 0,
        sample_rooms: [...rooms].slice(0, 5).join('|'),
      })
    }
  }
}

// 피크만 요약용 두 번째 파일용
const peakRows = rows.filter((r) => r.is_peak === 1)

const outDir = resolve(root, 'others')
mkdirSync(outDir, { recursive: true })

const cols = [
  'building',
  'day',
  'day_label',
  'hour',
  'start_label',
  'class_start_count',
  'estimated_people',
  'building_peak_people',
  'peak_share_pct',
  'is_peak',
  'sample_rooms',
]
const header = cols.join(',')
const body = rows.map((r) => cols.map((c) => csvEscape(r[c])).join(',')).join('\n')
const mainPath = resolve(outDir, 'building-crowd-by-hour.csv')
writeFileSync(mainPath, `\uFEFF${header}\n${body}\n`, 'utf8')

const peakCols = [
  'building',
  'day_label',
  'start_label',
  'estimated_people',
  'class_start_count',
  'sample_rooms',
]
const peakPath = resolve(outDir, 'building-crowd-peaks.csv')
writeFileSync(
  peakPath,
  `\uFEFF${peakCols.join(',')}\n` +
    peakRows
      .sort((a, b) => b.estimated_people - a.estimated_people)
      .map((r) => peakCols.map((c) => csvEscape(r[c])).join(','))
      .join('\n') +
    '\n',
  'utf8',
)

const meta = {
  generatedAt: new Date().toISOString(),
  source: 'Course.capacity sum by building + weekday + start hour',
  note: 'estimated_people = 해당 시각에 시작하는 수업 정원(capacity) 합. 실제 출석·이동 중이 아님.',
  courseRows: courses.length,
  coursesSkippedNoBuilding: skipped,
  meetingSlotsMapped: mapped,
  buildings,
  maxByBuilding,
  skippedRoomTop: [...skippedRooms.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([room, count]) => ({ room, count })),
  outputs: [
    'others/building-crowd-by-hour.csv',
    'others/building-crowd-peaks.csv',
    'others/building-crowd-meta.json',
  ],
}
writeFileSync(resolve(outDir, 'building-crowd-meta.json'), JSON.stringify(meta, null, 2), 'utf8')

console.log(`Course ${courses.length}건 (건물 미매핑 skip ${skipped}) → slots ${rows.length}행`)
console.log(`CSV: ${mainPath}`)
console.log(`peaks: ${peakPath}`)
console.log('건물별 피크:', maxByBuilding)
