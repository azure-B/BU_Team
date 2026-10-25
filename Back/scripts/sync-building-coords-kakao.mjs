/**
 * 카카오 로컬 키워드 검색으로 캠퍼스 Building lat/lng 갱신
 * Building.x = 위도(lat), Building.y = 경도(lng)  ← DB 기존 관례
 * Kakao document: x=lng, y=lat
 *
 * 사용: node scripts/sync-building-coords-kakao.mjs
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
const SB_KEY = env.SUPABASE_SERVICE_ROLE_KEY
const KAKAO_KEY = env.KAKAO_REST_API_KEY
if (!URL || !SB_KEY) throw new Error('SUPABASE env missing')
if (!KAKAO_KEY) throw new Error('KAKAO_REST_API_KEY missing')

const sbHeaders = {
  apikey: SB_KEY,
  Authorization: `Bearer ${SB_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'resolution=merge-duplicates,return=representation',
}

/** 캠퍼스 중심 (검색 반경용) */
const CAMPUS_LNG = 127.1855
const CAMPUS_LAT = 36.8391

/** id → 카카오 검색 쿼리 후보 (앞쪽일수록 우선) */
const SEARCH_QUERIES = {
  'bldg-hq': ['백석대학교 본부동', '백석대 본부동'],
  'bldg-wisdom': ['백석대학교 지혜관', '백석대 지혜관'],
  'bldg-gym': ['백석대학교 체육관', '백석대 체육관'],
  'bldg-art': ['백석대학교 조형관', '백석대 조형관'],
  'bldg-stu': [
    '백석대학교 학생복지관',
    '백석대학교 학생회관',
    '백석대 학생복지관',
    '백석대 학생회관',
  ],
  'bldg-lib': ['백석대학교 도서관', '백석대 도서관', '백석대학교 백석학술정보관'],
  'bldg-hall': ['백석대학교 백석홀', '백석대 백석홀'],
  'bldg-mogyang': ['백석대학교 목양관', '백석대 목양관'],
  'bldg-truth': ['백석대학교 진리관', '백석대 진리관'],
  'bldg-arts': ['백석대학교 예술대학동', '백석대 예술대학', '백석대학교 조형예술대학'],
}

const REJECT = /충전소|주차장|카페|편의점|버스|정류장|ATM|은행|식당|매점|기숙사|생활관/
const OTHER_UNI = /상명대|단국대|호서대|선문대|나사렛|공주대/

function scoreDoc(doc, buildingName) {
  const place = doc.place_name || ''
  const cat = doc.category_name || ''
  let score = 0

  // 타 대학 시설 강력 배제
  if (OTHER_UNI.test(place) && !place.includes('백석')) return -999
  if (REJECT.test(place) || REJECT.test(cat)) score -= 80

  if (place === `백석대학교 ${buildingName}`) score += 120
  if (place === '백석대학교 학생복지관' && buildingName === '학생회관') score += 110
  if (place.includes('백석대학교') && place.includes(buildingName)) score += 80
  if (place.includes(buildingName) && place.includes('백석')) score += 50
  if (place.includes(buildingName) && Number(doc.distance) < 500) score += 35
  if (place.startsWith('백석대학교') || place.includes('백석대')) score += 25
  if (cat.includes('학교부속')) score += 30
  if (cat.includes('교육')) score += 10
  // 백석 표기 없는 일반명(예: "학생회관")은 근접할 때만 가점
  if (place === buildingName && Number(doc.distance) < 600) score += 40

  const dist = Number(doc.distance)
  if (Number.isFinite(dist)) score += Math.max(0, 20 - dist / 80)
  return score
}

async function kakaoSearch(query) {
  const qs = new URLSearchParams({
    query,
    x: String(CAMPUS_LNG),
    y: String(CAMPUS_LAT),
    radius: '3000',
    size: '15',
    sort: 'distance',
  })
  const res = await fetch(`https://dapi.kakao.com/v2/local/search/keyword.json?${qs}`, {
    headers: { Authorization: `KakaoAK ${KAKAO_KEY}` },
  })
  const body = await res.json()
  if (!res.ok) throw new Error(`Kakao ${res.status} ${JSON.stringify(body)}`)
  return Array.isArray(body.documents) ? body.documents : []
}

async function pickPlace(buildingId, buildingName) {
  const queries = SEARCH_QUERIES[buildingId] || [`백석대학교 ${buildingName}`]
  let best = null
  const tried = []
  for (const query of queries) {
    const docs = await kakaoSearch(query)
    tried.push({ query, count: docs.length, top: docs.slice(0, 3).map((d) => d.place_name) })
    for (const doc of docs) {
      const s = scoreDoc(doc, buildingName)
      if (!best || s > best.score) best = { doc, score: s, query }
    }
    if (best && best.score >= 100) break
  }
  return { best, tried }
}

const buildingsRes = await fetch(`${URL}/rest/v1/Building?select=*&order=id`, { headers: sbHeaders })
const buildings = await buildingsRes.json()
if (!Array.isArray(buildings)) throw new Error(`Building fetch failed ${JSON.stringify(buildings)}`)

const report = {
  generatedAt: new Date().toISOString(),
  source: 'Kakao Local keyword search (dapi.kakao.com/v2/local/search/keyword.json)',
  note: 'DB Building.x=lat, Building.y=lng / Kakao x=lng, y=lat',
  updates: [],
}

const patches = []
for (const b of buildings) {
  const { best, tried } = await pickPlace(b.id, b.name)
  if (!best?.doc) {
    console.warn('MISS', b.id, b.name, tried)
    report.updates.push({ id: b.id, name: b.name, ok: false, tried })
    continue
  }
  const doc = best.doc
  const lat = Number(doc.y)
  const lng = Number(doc.x)
  const prev = { x: b.x, y: b.y }
  const next = {
    id: b.id,
    name: b.name,
    code: b.code,
    x: Math.round(lat * 1e7) / 1e7,
    y: Math.round(lng * 1e7) / 1e7,
  }
  patches.push(next)
  report.updates.push({
    id: b.id,
    name: b.name,
    ok: true,
    score: best.score,
    query: best.query,
    place_name: doc.place_name,
    place_url: doc.place_url,
    address: doc.road_address_name || doc.address_name,
    category: doc.category_name,
    kakao: { lng: doc.x, lat: doc.y },
    prev,
    next: { x: next.x, y: next.y },
    deltaM: (() => {
      const R = 6371000
      const toRad = (d) => (d * Math.PI) / 180
      const dLat = toRad(next.x - Number(prev.x))
      const dLng = toRad(next.y - Number(prev.y))
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(Number(prev.x))) * Math.cos(toRad(next.x)) * Math.sin(dLng / 2) ** 2
      return Math.round(2 * R * Math.asin(Math.sqrt(a)))
    })(),
    tried,
  })
  console.log(
    `OK ${b.name}: ${doc.place_name} → lat ${next.x}, lng ${next.y} (Δ${report.updates.at(-1).deltaM}m)`,
  )
}

if (!patches.length) throw new Error('No patches to upsert')

const up = await fetch(`${URL}/rest/v1/Building?on_conflict=id`, {
  method: 'POST',
  headers: sbHeaders,
  body: JSON.stringify(patches),
})
const upText = await up.text()
if (!up.ok) throw new Error(`Building upsert ${up.status} ${upText}`)

const dataDir = resolve(root, 'Back/data')
mkdirSync(dataDir, { recursive: true })
const outPath = resolve(dataDir, 'building-coords-kakao.json')
writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8')
console.log('\nwrote', outPath)
console.log(`upserted ${patches.length}/${buildings.length} buildings`)
