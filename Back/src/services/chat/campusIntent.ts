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
}

const ETA_RE =
  /얼마나\s*(걸|걸려|걸려요)|몇\s*분|소요|이동\s*시간|거리|가는\s*길|가는\s*데/
const RUN_RE = /뛰어|뛰면|달려|달리기|러닝|조깅/
const RAIN_RE = /비\s*오|비오면|우천|비\s*올|장마|소나기/
const INFO_RE =
  /정보|알려|어때|뭐\s*있|시설|휴게|몇\s*층|층수|편의점|CU|붐비|혼잡|엘리베이터|라운지|학습|소개|뭐야|어디|정시|몇\s*명|유동/
const CROWD_RE = /붐비|혼잡|엘리베이터|정시|몇\s*명|유동|피크|대기/
const ROUTE_RE = /까지|부터|에서/

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

function pairBuildings(question: string): [CampusBuildingProfile, CampusBuildingProfile] | null {
  const q = String(question || '')
  const positions: { b: CampusBuildingProfile; i: number }[] = []
  for (const b of CAMPUS_BUILDINGS) {
    for (const n of [b.name, ...b.aliases]) {
      const i = q.indexOf(n)
      if (i >= 0) {
        positions.push({ b, i })
        break
      }
    }
  }
  positions.sort((a, c) => a.i - c.i)
  const ordered: CampusBuildingProfile[] = []
  for (const p of positions) {
    if (!ordered.find((x) => x.id === p.b.id)) ordered.push(p.b)
  }
  if (ordered.length >= 2) return [ordered[0], ordered[1]]
  const hits = findCampusBuildings(question)
  if (hits.length >= 2) return [hits[0], hits[1]]
  return null
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
  const runRain = Math.max(runClear + 1, Math.round(baseMin * RUN_TIME_FACTOR / rainFactor))

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

export function looksLikeCampusCandidate(question: string) {
  const q = String(question || '')
  const buildings = findCampusBuildings(q)
  if (buildings.length === 0) return false
  if (buildings.length >= 2 && (ETA_RE.test(q) || RUN_RE.test(q) || RAIN_RE.test(q) || ROUTE_RE.test(q))) {
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

  const pair = pairBuildings(question)
  const wantEta = Boolean(pair) && (
    ETA_RE.test(question)
    || RUN_RE.test(question)
    || RAIN_RE.test(question)
    || ROUTE_RE.test(question)
  )

  if (wantEta && pair) {
    const [from, to] = pair
    const base = walkMinutesBetween(from.name, to.name)
    if (base == null) {
      return {
        handled: true,
        badge: '캠퍼스 안내',
        answer:
          `${from.name} ↔ ${to.name} 도보 시간은 아직 표에 없어요.\n`
          + '예: 「진리관에서 본부동까지」',
        choices: ['진리관에서 본부동까지', '본부동에서 지혜관까지', '진리관 정보'],
      }
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
