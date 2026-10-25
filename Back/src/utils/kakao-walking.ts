/**
 * 카카오 도보 길찾기 (서버 전용 — 지도 UI 미사용)
 * Building DB: x=위도(lat), y=경도(lng)
 * Kakao origin/destination: "lng,lat"
 *
 * 시간은 walk-speed(언덕·날씨)로 보정한다.
 */
import {
  adjustKakaoMinutes,
  getCampusWalkWeather,
  minutesFromMeters,
  type WalkWeather,
} from './walk-speed'

const WALKING_URL = 'https://apis-navi.kakaomobility.com/affiliate/walking/v1/directions'

export type WalkingEstimate = {
  walkingMinutes: number
  walkingMeters: number
  source: 'kakao' | 'haversine'
  weather: WalkWeather
}

export function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

/** GPS → 목적지 도보 분. 키 없거나 실패 시 직선거리 + 언덕·날씨 속도 */
export async function estimateWalkingMinutes(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
  weather?: WalkWeather,
): Promise<WalkingEstimate> {
  const wx = weather || (await getCampusWalkWeather())
  const meters = haversineMeters(originLat, originLng, destLat, destLng)
  const fallback: WalkingEstimate = {
    walkingMinutes: minutesFromMeters(meters, wx.speedMPerMin),
    walkingMeters: Math.round(meters),
    source: 'haversine',
    weather: wx,
  }

  const key = process.env.KAKAO_REST_API_KEY?.trim()
  if (!key) return fallback

  try {
    const qs = new URLSearchParams({
      origin: `${originLng},${originLat}`,
      destination: `${destLng},${destLat}`,
      priority: 'DISTANCE',
      summary: 'true',
    })
    const res = await fetch(`${WALKING_URL}?${qs}`, {
      headers: {
        Authorization: `KakaoAK ${key}`,
        accept: 'application/json',
      },
    })
    if (!res.ok) return fallback
    const body = await res.json()
    const route = Array.isArray(body?.routes) ? body.routes[0] : null
    const durationSec = Number(route?.summary?.duration ?? route?.duration)
    const distanceM = Number(route?.summary?.distance ?? route?.distance)
    if (!Number.isFinite(durationSec) || durationSec <= 0) return fallback
    return {
      walkingMinutes: adjustKakaoMinutes(durationSec, wx),
      walkingMeters: Number.isFinite(distanceM) ? Math.round(distanceM) : fallback.walkingMeters,
      source: 'kakao',
      weather: wx,
    }
  } catch {
    return fallback
  }
}
