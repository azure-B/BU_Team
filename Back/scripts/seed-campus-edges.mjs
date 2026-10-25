/**
 * 백석대 건물 간 도보 시간 시드
 * *기준건물 아래 나열 = 기준 → 목표 소요(분)
 *
 * 사용: node scripts/seed-campus-edges.mjs
 */
import { readFileSync } from 'node:fs'
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
const headers = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
}

const B = {
  목양관: 'bldg-mogyang',
  진리관: 'bldg-truth',
  백석홀: 'bldg-hall',
  지혜관: 'bldg-wisdom',
  본부동: 'bldg-hq',
  체육관: 'bldg-gym',
  조형관: 'bldg-art',
  도서관: 'bldg-lib',
  학생회관: 'bldg-stu',
  예술대학동: 'bldg-arts',
}

/** *기준 → [목표, 분] — 사진 표기 그대로 */
const FROM_TO = {
  목양관: [
    ['진리관', 5],
    ['백석홀', 5],
    ['지혜관', 7],
    ['본부동', 10],
    ['체육관', 13],
    ['조형관', 13], // 사진 "체육관, 조형관 13분"
  ],
  진리관: [
    ['목양관', 5],
    ['백석홀', 5],
    ['지혜관', 5],
    ['본부동', 7],
    ['체육관', 13],
    ['조형관', 13],
  ],
  본부동: [
    ['지혜관', 5],
    ['진리관', 7],
    ['목양관', 10],
    ['체육관', 10],
    ['조형관', 10],
  ],
  지혜관: [
    ['진리관', 5],
    ['백석홀', 5],
    ['본부동', 5],
    ['목양관', 7],
    ['체육관', 15],
    ['조형관', 15],
  ],
  // *체육관, 조형관 — 둘 다 같은 기준 클러스터
  체육관: [
    ['본부동', 10],
    ['진리관', 13],
    ['목양관', 13],
    ['지혜관', 15],
    ['백석홀', 15],
    ['조형관', 2], // 인접 건물
  ],
  조형관: [
    ['본부동', 10],
    ['진리관', 13],
    ['목양관', 13],
    ['지혜관', 15],
    ['백석홀', 15],
    ['체육관', 2],
  ],
}

function edgeId(fromId, toId) {
  return `edge-${fromId.replace('bldg-', '')}-${toId.replace('bldg-', '')}`
}

const edges = []
const seen = new Set()
for (const [fromName, targets] of Object.entries(FROM_TO)) {
  const fromId = B[fromName]
  for (const [toName, minutes] of targets) {
    const toId = B[toName]
    if (!fromId || !toId) throw new Error(`건물 ID 없음: ${fromName} → ${toName}`)
    const key = `${fromId}>${toId}`
    if (seen.has(key)) continue
    seen.add(key)
    edges.push({
      id: edgeId(fromId, toId),
      fromBuildingId: fromId,
      toBuildingId: toId,
      walkingMinutes: minutes,
    })
  }
}

async function upsertBuildings() {
  // 좌표: scripts/sync-building-coords-kakao.mjs (카카오 키워드 검색) 기준
  const buildings = [
    { id: 'bldg-arts', name: '예술대학동', code: 'ARTS', x: 36.8388716, y: 127.1877483 },
    { id: 'bldg-lib', name: '도서관', code: 'LIB', x: 36.8380146, y: 127.1840243 },
  ]
  const res = await fetch(`${URL}/rest/v1/Building?on_conflict=id`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify(buildings),
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`Building upsert ${res.status} ${text}`)
  console.log('Building upsert OK')
}

async function clearEdges() {
  const res = await fetch(`${URL}/rest/v1/CampusEdge?fromBuildingId=not.is.null`, {
    method: 'DELETE',
    headers: { ...headers, Prefer: 'return=minimal' },
  })
  if (!res.ok) throw new Error(`delete ${res.status} ${await res.text()}`)
  console.log('CampusEdge cleared')
}

async function insertEdges() {
  const res = await fetch(`${URL}/rest/v1/CampusEdge?on_conflict=id`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify(edges),
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`insert ${res.status} ${text}`)
  const rows = text ? JSON.parse(text) : []
  console.log(`CampusEdge upsert ${Array.isArray(rows) ? rows.length : edges.length}건`)
}

await upsertBuildings()
await clearEdges()
await insertEdges()

// 검증 출력
const check = await fetch(`${URL}/rest/v1/CampusEdge?select=*&order=fromBuildingId`, {
  headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
})
const data = await check.json()
const nameById = Object.fromEntries(Object.entries(B).map(([n, id]) => [id, n]))
console.log('--- 기준 → 목표 ---')
for (const e of data) {
  console.log(`${nameById[e.fromBuildingId] || e.fromBuildingId} → ${nameById[e.toBuildingId] || e.toBuildingId}: ${e.walkingMinutes}분`)
}
