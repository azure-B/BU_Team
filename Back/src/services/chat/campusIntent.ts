import {
  CAMPUS_WALK_MINUTES,
  RUN_TIME_FACTOR,
  findCampusBuilding,
  findCampusBuildings,
  formatBuildingAnswer,
  walkMinutesBetween,
  type CampusBuildingProfile,
  CAMPUS_BUILDINGS,
} from '../../data/campusBuildings'
import {
  formatFacilityAnswer,
  looksLikeFacilityQuestion,
  searchCampusFacilities,
} from '../../data/campusFacilities'
import {
  adjustCampusEdgeMinutes,
  getCampusWalkWeather,
  rainSpeedFactor,
  type RainBand,
  type WalkWeather,
} from '../../utils/walk-speed'

export type CampusIntentResult = {
  handled: boolean
  answer?: string
  badge?: string
  choices?: string[]
  /** true면 라우터가 GPT로 넘김 */
  deferToLlm?: boolean
}

const ETA_RE =
  /얼마나\s*(걸|걸려|걸려요)|몇\s*분|소요|이동\s*시간|거리|가는\s*길|가는\s*데|걸림|걸려요/
const RUN_RE = /뛰어|뛰면|달려|달리기|러닝|조깅/
const RAIN_RE = /비\s*오|비오면|우천|비\s*올|장마|소나기/
const INFO_RE =
  /정보|알려|어때|뭐\s*있|시설|휴게|몇\s*층|층수|편의점|CU|붐비|혼잡|엘리베이터|라운지|학습|소개|뭐야|어디|정시|몇\s*명|유동/
const CROWD_RE = /붐비|혼잡|엘리베이터|정시|몇\s*명|유동|피크|대기/
const ROUTE_RE = /까지|부터|에서|가면|가서/
const VIA_RE = /찍고|찍어서|거쳐|들러|들렀|경유|지나서|들렀다\s*가|들렀다가/

function rainLabel(band: RainBand) {
  if (band === 'heavy') return '폭우'
  if (band === 'rain') return '비'
  if (band === 'drizzle') return '이슬비'
  return '맑음'
}

function fakeWeather(factor: number, band: RainBand): WalkWeather {
  return {
    precipitationMmH: band === 'clear' ? 0 : 5,
    weatherCode: band === 'clear' ? 0 : 61,
    rainBand: band,
    speedFactor: factor,
    speedMPerMin: 50 * factor,
    source: 'fallback',
    fetchedAt: new Date().toISOString(),
  }
}

/** 질문에 나온 건물 순서 (경유지 포함) */
function orderedBuildings(question: string): CampusBuildingProfile[] {
  const q = String(question || '')
  const positions: { b: CampusBuildingProfile; i: number; len: number }[] = []
  for (const b of CAMPUS_BUILDINGS) {
    for (const n of [b.name, ...b.aliases]) {
      let from = 0
      while (from < q.length) {
        const i = q.indexOf(n, from)
        if (i < 0) break
        positions.push({ b, i, len: n.length })
        from = i + n.length
      }
    }
  }
  // 같은 위치면 긴 이름 우선 (본부동 > 본부)
  positions.sort((a, c) => a.i - c.i || c.len - a.len)
  const ordered: CampusBuildingProfile[] = []
  let lastEnd = -1
  for (const p of positions) {
    if (p.i < lastEnd) continue
    if (ordered.find((x) => x.id === p.b.id)) {
      // 같은 건물이 다시 나오면(왕복) 경로에 추가
      if (ordered[ordered.length - 1]?.id !== p.b.id) ordered.push(p.b)
      lastEnd = p.i + p.len
      continue
    }
    ordered.push(p.b)
    lastEnd = p.i + p.len
  }
  if (ordered.length >= 2) return ordered
  return findCampusBuildings(question)
}

function pairBuildings(question: string): [CampusBuildingProfile, CampusBuildingProfile] | null {
  const ordered = orderedBuildings(question)
  if (ordered.length >= 2) return [ordered[0], ordered[1]]
  return null
}

function sumPathMinutes(path: CampusBuildingProfile[]) {
  const legs: { from: string; to: string; min: number }[] = []
  for (let i = 0; i < path.length - 1; i += 1) {
    const min = walkMinutesBetween(path[i].name, path[i + 1].name)
    if (min == null) return null
    legs.push({ from: path[i].name, to: path[i + 1].name, min })
  }
  const total = legs.reduce((s, l) => s + l.min, 0)
  return { legs, total }
}

function formatEtaAnswer(input: {
  from: CampusBuildingProfile
  to: CampusBuildingProfile
  baseMin: number
  wantRun: boolean
  wantRain: boolean
  live: WalkWeather
}): string {
  const { from, to, baseMin, wantRun, wantRain, live } = input
  const rainFactor = rainSpeedFactor(5, 61).speedFactor
  const walkClear = Math.max(1, Math.round(baseMin))
  const walkRain = adjustCampusEdgeMinutes(baseMin, fakeWeather(rainFactor, 'rain'))
  const walkLive = adjustCampusEdgeMinutes(baseMin, live)
  const runClear = Math.max(1, Math.round(baseMin * RUN_TIME_FACTOR))
  const runRain = Math.max(runClear + 1, Math.round((baseMin * RUN_TIME_FACTOR) / rainFactor))

  const lines = [
    `【${from.name} → ${to.name}】`,
    `캠퍼스 기준 도보 약 ${walkClear}분 (언덕 반영)`,
  ]

  if (wantRun || wantRain) {
    lines.push('')
    if (wantRun) {
      lines.push(`· 뛰어가면 대략 ${runClear}분 전후 (도보의 약 ${Math.round(RUN_TIME_FACTOR * 100)}% 시간)`)
    }
    if (wantRain) {
      lines.push(`· 비 오면 걷기는 대략 ${walkRain}분 (미끄러움·우산)`)
      lines.push(`· 비 오며 뛰면 대략 ${runRain}분 (안전 우선, 언덕+비)`)
    } else if (wantRun) {
      lines.push(`· 비 오면 걷기 ${walkRain}분 · 뛰면 ${runRain}분쯤`)
    }
  } else {
    lines.push(
      '',
      '참고)',
      `· 뛰어가면 ≈ ${runClear}분`,
      `· 비 오면 걷기 ≈ ${walkRain}분`,
      `· 지금 날씨: ${rainLabel(live.rainBand)} → 도보 약 ${walkLive}분`,
    )
  }

  lines.push('', '엘리베이터·실내 이동은 별도입니다. 건물 시설은 이름만 물어봐도 안내해요.')
  return lines.join('\n')
}

function formatMultiEtaAnswer(input: {
  path: CampusBuildingProfile[]
  legs: { from: string; to: string; min: number }[]
  total: number
  wantRun: boolean
  wantRain: boolean
  live: WalkWeather
}): string {
  const { path, legs, total, wantRun, wantRain, live } = input
  const rainFactor = rainSpeedFactor(5, 61).speedFactor
  const walkClear = Math.max(1, Math.round(total))
  const walkRain = adjustCampusEdgeMinutes(total, fakeWeather(rainFactor, 'rain'))
  const walkLive = adjustCampusEdgeMinutes(total, live)
  const runClear = Math.max(1, Math.round(total * RUN_TIME_FACTOR))
  const runRain = Math.max(runClear + 1, Math.round((total * RUN_TIME_FACTOR) / rainFactor))
  const routeLabel = path.map((b) => b.name).join(' → ')

  const lines = [
    `【경유 경로】 ${routeLabel}`,
    `구간 합산 도보 약 ${walkClear}분 (언덕 반영)`,
    '',
    ...legs.map((l, i) => `${i + 1}. ${l.from} → ${l.to} · 약 ${l.min}분`),
  ]

  if (wantRun || wantRain) {
    lines.push('')
    if (wantRun) lines.push(`· 전 구간 뛰어가면 대략 ${runClear}분 전후`)
    if (wantRain) {
      lines.push(`· 비 오면 걷기 대략 ${walkRain}분`)
      lines.push(`· 비 오며 뛰면 대략 ${runRain}분`)
    } else if (wantRun) {
      lines.push(`· 비 오면 걷기 ${walkRain}분 · 뛰면 ${runRain}분쯤`)
    }
  } else {
    lines.push(
      '',
      '참고)',
      `· 뛰어가면 ≈ ${runClear}분`,
      `· 비 오면 걷기 ≈ ${walkRain}분`,
      `· 지금 날씨: ${rainLabel(live.rainBand)} → 도보 약 ${walkLive}분`,
    )
  }

  lines.push('', '엘리베이터·실내 이동·잠깐 머무는 시간은 별도입니다.')
  return lines.join('\n')
}

export function looksLikeCampusCandidate(question: string) {
  const q = String(question || '')
  // 「편의점 어딨어」처럼 건물명 없이 시설만 물어보는 경우
  if (looksLikeFacilityQuestion(q) && (/어디|위치|몇\s*층|있어|있나요|알려|찾아|가려면/.test(q) || findCampusBuildings(q).length > 0)) {
    return true
  }
  if (looksLikeFacilityQuestion(q) && !ETA_RE.test(q) && !VIA_RE.test(q)) {
    return true
  }
  const buildings = findCampusBuildings(q)
  if (buildings.length === 0) return false
  if (buildings.length >= 2 && (ETA_RE.test(q) || RUN_RE.test(q) || RAIN_RE.test(q) || ROUTE_RE.test(q) || VIA_RE.test(q))) {
    return true
  }
  if (INFO_RE.test(q) || ETA_RE.test(q) || RUN_RE.test(q) || RAIN_RE.test(q)) return true
  const stripped = q.replace(/[?\s.!！？]/g, '')
  return buildings.some((b) => [b.name, ...b.aliases].some((n) => stripped === n || stripped === `${n}정보`))
}

export async function tryHandleCampusIntent(input: {
  question: string
  now?: Date
}): Promise<CampusIntentResult> {
  const question = String(input.question || '').trim()
  if (!looksLikeCampusCandidate(question)) {
    return { handled: false }
  }

  const path = orderedBuildings(question)
  const wantEta = path.length >= 2 && (
    ETA_RE.test(question)
    || RUN_RE.test(question)
    || RAIN_RE.test(question)
    || ROUTE_RE.test(question)
    || VIA_RE.test(question)
  )

  // 시설 위치 (편의점·학식·카페·열람실) — 이동 ETA보다 우선하되 경유·도보 질문은 제외
  if (looksLikeFacilityQuestion(question) && !wantEta && !VIA_RE.test(question)) {
    const buildingHint = findCampusBuilding(question)?.name || null
    let hits = searchCampusFacilities(question, buildingHint, 6)
    // 「편의점 어딨어」만 있으면 전체 편의점 목록
    if (/편의점/.test(question) && !buildingHint) {
      hits = searchCampusFacilities('편의점 CU 세븐 GS', null, 8)
        .filter((f) => f.kinds.includes('편의점'))
    }
    if (hits.length) {
      return {
        handled: true,
        badge: '캠퍼스 시설',
        answer: formatFacilityAnswer(hits, { buildingHint }),
        choices: [
          '본부동 편의점',
          '진리관 CU',
          '학식 어디야',
          '창업카페 어디야',
        ],
      }
    }
  }

  // 경유지(찍고·거쳐)인데 건물이 2개만 잡히면 GPT에게
  if (wantEta && VIA_RE.test(question) && path.length < 3) {
    return { handled: false, deferToLlm: true }
  }

  // 3개 이상: 구간 합산
  if (wantEta && path.length >= 3) {
    const summed = sumPathMinutes(path)
    if (!summed) {
      // 표에 없는 구간 → GPT
      return { handled: false, deferToLlm: true }
    }
    const live = await getCampusWalkWeather().catch(() => fakeWeather(1, 'clear'))
    const last = path[path.length - 1]
    return {
      handled: true,
      badge: '캠퍼스 이동 · 경유',
      answer: formatMultiEtaAnswer({
        path,
        legs: summed.legs,
        total: summed.total,
        wantRun: RUN_RE.test(question),
        wantRain: RAIN_RE.test(question),
        live,
      }),
      choices: [
        `${path[0].name}에서 ${last.name}까지`,
        `${path.map((b) => b.name).join('→')} 뛰어가면?`,
        `${last.name} 정보`,
      ],
    }
  }

  const pair = path.length >= 2 ? [path[0], path[1]] as const : pairBuildings(question)

  if (wantEta && pair) {
    const [from, to] = pair
    const base = walkMinutesBetween(from.name, to.name)
    if (base == null) {
      return { handled: false, deferToLlm: true }
    }
    const live = await getCampusWalkWeather().catch(() => fakeWeather(1, 'clear'))
    return {
      handled: true,
      badge: '캠퍼스 이동',
      answer: formatEtaAnswer({
        from,
        to,
        baseMin: base,
        wantRun: RUN_RE.test(question),
        wantRain: RAIN_RE.test(question),
        live,
      }),
      choices: [
        `${from.name}에서 ${to.name} 뛰어가면?`,
        `${from.name}에서 ${to.name} 비 오면?`,
        `${from.name}에서 ${to.name} 찍고 목양관`,
        `${to.name} 정보`,
      ],
    }
  }

  const building = findCampusBuilding(question)
  if (!building) return { handled: false }

  const now = input.now || new Date()
  const crowdOnly = CROWD_RE.test(question) && !/시설|층|휴게|CU|편의|사무실/.test(question)
  const neighbors = Object.entries(CAMPUS_WALK_MINUTES[building.name] || {})
    .sort((a, b) => a[1] - b[1])
    .slice(0, 3)
    .map(([name]) => `${building.name}에서 ${name}까지`)

  return {
    handled: true,
    badge: crowdOnly ? '캠퍼스 붐빔' : '캠퍼스 건물',
    answer: formatBuildingAnswer(building, { now, crowdOnly }),
    choices: crowdOnly
      ? [`${building.name} 정보`, `${building.name}에서 진리관까지`, '본부동 붐빔']
      : neighbors.length
        ? [...neighbors, `${building.name} 붐빔`]
        : ['진리관에서 본부동까지', '본부동 정보', '본부동 붐빔'],
  }
}
