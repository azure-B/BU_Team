/**
 * Course DB 기준 건물·요일·시작시각별 예상 유동인구 → 엘리베이터 대기/이용 분 산출
 * 사용: node scripts/generate-elevator-wait-slots.mjs
 *
 * 유동인구 = 해당 슬롯에서 시작하는 수업들의 capacity(수용 인원) 합
 * 강의 "개수"는 참고용이며, 피크·비례 매핑 기준은 아님.
 *
 * 규칙(추후 개발용 기록):
 * - 본부동·조형관: 피크 10분, 그 외 유동 비례 3~7분
 * - 지혜관: 피크 7분, 그 외 3~5분
 * - 체육관: 피크 5분, 그 외 2~5분
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

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

const URL = env.SUPABASE_URL
const KEY = env.SUPABASE_SERVICE_ROLE_KEY
const headers = { apikey: KEY, Authorization: `Bearer ${KEY}` }

const DAYS = { 1: '월', 2: '화', 3: '수', 4: '목', 5: '금' }
const TARGET = ['본부동', '지혜관', '체육관', '조형관']
const BUILDING_ID = {
  본부동: 'bldg-hq',
  지혜관: 'bldg-wisdom',
  체육관: 'bldg-gym',
  조형관: 'bldg-art',
}

/** peak = 최다 유동인구 슬롯, high~low = 그 외 유동 비례 구간 */
const RULES = {
  본부동: { peak: 13, high: 7, low: 3 },
  조형관: { peak: 10, high: 7, low: 3 },
  지혜관: { peak: 7, high: 5, low: 3 },
  체육관: { peak: 5, high: 5, low: 2 },
}

function buildingOf(room) {
  const r = String(room || '')
  if (r.startsWith('본부')) return '본부동'
  if (r.startsWith('지혜')) return '지혜관'
  if (r.startsWith('체육')) return '체육관'
  if (r.startsWith('조형')) return '조형관'
  return null
}

function parseMeetings(raw, day, startTime) {
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
    meetings = [{ day, start: startTime }]
  }
  return meetings
}

/** 유동인구 비율로 분 산출. 피크 슬롯만 peak분, 그 외 low~high 선형 */
function elevatorMinutes(building, traffic, maxTraffic) {
  const rule = RULES[building]
  if (!rule || traffic <= 0) return rule?.low ?? 3
  if (traffic >= maxTraffic) return rule.peak
  const t = maxTraffic <= 1 ? 0 : traffic / maxTraffic
  return Math.round(rule.low + (rule.high - rule.low) * t)
}

async function fetchCourses() {
  let all = []
  let offset = 0
  for (;;) {
    const rows = await fetch(
      `${URL}/rest/v1/Course?select=room,capacity,day,startTime,meetings&offset=${offset}&limit=1000`,
      { headers },
    ).then((r) => r.json())
    if (!Array.isArray(rows) || !rows.length) break
    all = all.concat(rows)
    offset += rows.length
    if (rows.length < 1000) break
  }
  return all
}

const courses = await fetchCourses()
/** building|day|hour -> { classCount, traffic } */
const agg = new Map()

for (const c of courses) {
  const building = buildingOf(c.room)
  if (!building || !TARGET.includes(building)) continue
  const meetings = parseMeetings(c.meetings, c.day, c.startTime)
  const capacity = Math.max(0, Number(c.capacity) || 0)
  for (const m of meetings) {
    const day = Number(m.day)
    const start = m.start || c.startTime
    if (!day || day < 1 || day > 5 || !start) continue
    const hour = Number(String(start).slice(0, 2))
    if (!Number.isFinite(hour) || hour < 8 || hour > 21) continue
    const key = `${building}|${day}|${hour}`
    const cur = agg.get(key) || { classCount: 0, traffic: 0 }
    cur.classCount += 1
    cur.traffic += capacity
    agg.set(key, cur)
  }
}

const maxByBuilding = Object.fromEntries(TARGET.map((b) => [b, 1]))
for (const [key, { traffic }] of agg) {
  const building = key.split('|')[0]
  maxByBuilding[building] = Math.max(maxByBuilding[building], traffic)
}

const slots = []
for (const building of TARGET) {
  for (const day of [1, 2, 3, 4, 5]) {
    for (let hour = 9; hour <= 18; hour += 1) {
      const { classCount = 0, traffic = 0 } = agg.get(`${building}|${day}|${hour}`) || {}
      const maxTraffic = maxByBuilding[building]
      const minutes = elevatorMinutes(building, traffic, maxTraffic)
      slots.push({
        id: `elev-${BUILDING_ID[building].replace('bldg-', '')}-d${day}-h${String(hour).padStart(2, '0')}`,
        buildingId: BUILDING_ID[building],
        buildingName: building,
        day,
        dayLabel: DAYS[day],
        hour,
        startLabel: `${String(hour).padStart(2, '0')}:00`,
        classStartCount: classCount,
        estimatedTraffic: traffic,
        buildingPeakTraffic: maxTraffic,
        elevatorMinutes: minutes,
        isPeak: traffic > 0 && traffic >= maxTraffic,
      })
    }
  }
}

const peaks = TARGET.map((building) => {
  const maxTraffic = maxByBuilding[building]
  const peakSlots = slots.filter((s) => s.buildingName === building && s.isPeak)
  return {
    building,
    buildingId: BUILDING_ID[building],
    peakEstimatedTraffic: maxTraffic,
    peakSlots: peakSlots.map(
      (s) =>
        `${s.dayLabel} ${s.startLabel} (예상 ${s.estimatedTraffic}명 / ${s.classStartCount}강)`,
    ),
    rule: RULES[building],
  }
})

const payload = {
  generatedAt: new Date().toISOString(),
  source: 'Course.capacity 합(예상 유동) + meetings + room prefix',
  note: '피크·비례 기준은 강의 개수가 아니라 해당 슬롯 수업 capacity 합(예상 유동인구). 강의 수는 참고 필드.',
  rules: RULES,
  peaks,
  slots,
}

const dataDir = resolve(root, 'Back/data')
mkdirSync(dataDir, { recursive: true })
const jsonPath = resolve(dataDir, 'elevator-wait-by-slot.json')
writeFileSync(jsonPath, JSON.stringify(payload, null, 2), 'utf8')

const tsPath = resolve(root, 'Back/src/data/elevatorWaitSlots.ts')
mkdirSync(dirname(tsPath), { recursive: true })
writeFileSync(
  tsPath,
  `/** Auto-generated by scripts/generate-elevator-wait-slots.mjs — do not edit by hand */\n` +
    `export const ELEVATOR_WAIT_RULES = ${JSON.stringify(RULES, null, 2)} as const\n\n` +
    `export const ELEVATOR_WAIT_PEAKS = ${JSON.stringify(peaks, null, 2)} as const\n\n` +
    `export type ElevatorWaitSlot = {\n` +
    `  id: string\n` +
    `  buildingId: string\n` +
    `  buildingName: string\n` +
    `  day: number\n` +
    `  dayLabel: string\n` +
    `  hour: number\n` +
    `  startLabel: string\n` +
    `  classStartCount: number\n` +
    `  estimatedTraffic: number\n` +
    `  buildingPeakTraffic: number\n` +
    `  elevatorMinutes: number\n` +
    `  isPeak: boolean\n` +
    `}\n\n` +
    `export const ELEVATOR_WAIT_SLOTS: ElevatorWaitSlot[] = ${JSON.stringify(slots, null, 2)}\n`,
  'utf8',
)

console.log('wrote', jsonPath)
console.log('wrote', tsPath)
console.log('\n피크 요약 (예상 유동 = capacity 합)')
for (const p of peaks) {
  console.log(
    `- ${p.building}: 최대 ${p.peakEstimatedTraffic}명 → ${p.rule.peak}분 | ${p.peakSlots.join(', ')}`,
  )
}
console.log('\n샘플(수 09시)')
for (const b of TARGET) {
  const s = slots.find((x) => x.buildingName === b && x.day === 3 && x.hour === 9)
  console.log(
    `  ${b}: 수업 ${s.classStartCount}건 / 예상 ${s.estimatedTraffic}명 → 엘리베이터 ${s.elevatorMinutes}분`,
  )
}
