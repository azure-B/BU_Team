/**
 * 캠퍼스 도보 속도 (언덕 + 날씨)
 *
 * 평지 일반 보행 ≈ 67 m/min (4 km/h).
 * 백석대는 경사 구간이 많아 맑은 날 기준을 낮춤: 50 m/min ≈ 3.0 km/h.
 *
 * 비 영향 (문헌):
 * - Chang et al. (2011, Hong Kong crosswalk): 맑음 1.22 m/s → 비 0.85 m/s (약 −30%)
 * - Deng / Lam et al. (HKSTS·교차로 실험): 강수강도↑ → free-flow 속도↓
 *   약 0.1 mm/h → 73.6 m/min, 15 mm/h → 55.5 m/min (강수 구간 내 ≈ −25%)
 * - Shi / Tam / Lam (2017): 강수강도에 따라 free-flow가 75.6 → 54.7 m/min 수준으로 감소
 *
 * → 캠퍼스 언덕 맑은 날 50 m/min 기준에, 강수강도별 배율(1.0~0.70)을 곱해 사용.
 */

/** 카카오 도보 ETA가 가정하는 대략 속도 (평지 4 km/h) */
export const KAKAO_ASSUMED_M_PER_MIN = 67

/** 백석 캠퍼스 언덕·가방 보행 (맑은 날) */
export const CAMPUS_HILL_M_PER_MIN = 50

/** 천안 백석대 본부 근처 */
const CAMPUS_LAT = 36.8391
const CAMPUS_LNG = 127.1855

export type RainBand = 'clear' | 'drizzle' | 'rain' | 'heavy'

export type WalkWeather = {
  precipitationMmH: number
  weatherCode: number | null
  rainBand: RainBand
  /** 맑은 날=1, 폭우≈0.70 (Chang 비율에 맞춤) */
  speedFactor: number
  speedMPerMin: number
  source: 'open-meteo' | 'fallback'
  fetchedAt: string
}

type Cache = { at: number; value: WalkWeather }
let cache: Cache | null = null
const CACHE_MS = 5 * 60 * 1000

/** WMO weather_code + 강수(mm/h) → 배율 */
export function rainSpeedFactor(precipitationMmH: number, weatherCode?: number | null): {
  rainBand: RainBand
  speedFactor: number
} {
  const code = weatherCode ?? 0
  const precip = Math.max(0, precipitationMmH)

  // 뇌우·폭우 코드는 강수량이 작아도 보수적으로
  const stormy = code >= 95 || (code >= 82 && code <= 86)
  const rainyCode = (code >= 51 && code <= 67) || (code >= 80 && code <= 82) || stormy

  let rainBand: RainBand = 'clear'
  let speedFactor = 1

  if (precip >= 15 || stormy) {
    // Chang ≈ 0.85/1.22 ≈ 0.70, Deng 15 mm/h 근처
    rainBand = 'heavy'
    speedFactor = 0.7
  } else if (precip >= 5 || (rainyCode && precip >= 2)) {
    rainBand = 'rain'
    speedFactor = 0.8
  } else if (precip >= 0.2 || rainyCode) {
    // 이슬비·약한 비: 미끄러움·우산으로 소폭 감소
    rainBand = 'drizzle'
    speedFactor = 0.9
  }

  return { rainBand, speedFactor }
}

export function speedMPerMinFromFactor(speedFactor: number) {
  return Math.max(28, CAMPUS_HILL_M_PER_MIN * speedFactor)
}

function fallbackWeather(): WalkWeather {
  const { rainBand, speedFactor } = rainSpeedFactor(0, 0)
  return {
    precipitationMmH: 0,
    weatherCode: 0,
    rainBand,
    speedFactor,
    speedMPerMin: speedMPerMinFromFactor(speedFactor),
    source: 'fallback',
    fetchedAt: new Date().toISOString(),
  }
}

/** Open-Meteo 현재 강수 (키 불필요). 5분 캐시. */
export async function getCampusWalkWeather(): Promise<WalkWeather> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.value

  try {
    const qs = new URLSearchParams({
      latitude: String(CAMPUS_LAT),
      longitude: String(CAMPUS_LNG),
      current: 'precipitation,weather_code,rain,showers',
      timezone: 'Asia/Seoul',
    })
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?${qs}`, {
      signal: AbortSignal.timeout(4000),
    })
    if (!res.ok) throw new Error(`weather ${res.status}`)
    const body = await res.json()
    const cur = body?.current || {}
    const precip = Number(cur.precipitation ?? cur.rain ?? cur.showers ?? 0) || 0
    const weatherCode = Number.isFinite(Number(cur.weather_code)) ? Number(cur.weather_code) : null
    const { rainBand, speedFactor } = rainSpeedFactor(precip, weatherCode)
    const value: WalkWeather = {
      precipitationMmH: Math.round(precip * 100) / 100,
      weatherCode,
      rainBand,
      speedFactor,
      speedMPerMin: speedMPerMinFromFactor(speedFactor),
      source: 'open-meteo',
      fetchedAt: new Date().toISOString(),
    }
    cache = { at: Date.now(), value }
    return value
  } catch {
    const value = fallbackWeather()
    cache = { at: Date.now(), value }
    return value
  }
}

/** 직선거리 → 분 (언덕+날씨 속도) */
export function minutesFromMeters(meters: number, speedMPerMin: number) {
  const speed = Math.max(20, speedMPerMin)
  return Math.max(1, Math.round(meters / speed))
}

/**
 * 카카오 ETA(초) → 캠퍼스 언덕·날씨 보정 분
 * (카카오는 평지 가정 → 언덕 비율 × 비 배율)
 */
export function adjustKakaoMinutes(durationSec: number, weather: WalkWeather) {
  const kakaoMin = durationSec / 60
  const hillRatio = KAKAO_ASSUMED_M_PER_MIN / CAMPUS_HILL_M_PER_MIN
  return Math.max(1, Math.round((kakaoMin * hillRatio) / weather.speedFactor))
}

/** CampusEdge(이미 언덕 반영)에는 비만 반영 */
export function adjustCampusEdgeMinutes(edgeMinutes: number, weather: WalkWeather) {
  return Math.max(0, Math.round(edgeMinutes / weather.speedFactor))
}
