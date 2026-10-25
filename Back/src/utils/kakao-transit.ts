/**
 * 카카오 대중교통 통합 길찾기 (서버 전용)
 * 제휴 미승인 시 403 → 거리·도보분 기반 추정으로 폴백
 *
 * GET .../affiliate/publictransit/v1/multimodal/directions
 * journeys[].summary.total_time (초)
 */

const TRANSIT_URL =
  'https://apis-navi.kakaomobility.com/affiliate/publictransit/v1/multimodal/directions'

export type TransitEstimate = {
  transitMinutes: number
  source: 'kakao' | 'estimate'
  transferCount?: number | null
}

/** 도보 분·거리로 대중교통 소요 추정 (대기·환승 포함) */
export function estimateTransitFromWalk(walkingMinutes: number, meters?: number | null): number {
  const waitAndBoard = 10
  const fromWalk = Math.round(walkingMinutes * 0.42 + waitAndBoard)
  const fromDist =
    Number.isFinite(meters) && (meters as number) > 0
      ? Math.round((meters as number) / 280) + waitAndBoard // 유효 ~17 km/h + 대기
      : fromWalk
  const raw = Math.min(fromWalk, fromDist)
  // 도보 30분 이상일 때만 쓰이므로 하한 12분, 상한은 도보보다 짧게
  return Math.max(12, Math.min(raw, walkingMinutes - 1))
}

export async function estimateTransitMinutes(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
  walkingMinutes: number,
  walkingMeters?: number | null,
): Promise<TransitEstimate> {
  const fallback: TransitEstimate = {
    transitMinutes: estimateTransitFromWalk(walkingMinutes, walkingMeters),
    source: 'estimate',
    transferCount: null,
  }

  const key = process.env.KAKAO_REST_API_KEY?.trim()
  if (!key) return fallback

  try {
    const qs = new URLSearchParams({
      start: `${originLng},${originLat}`,
      goal: `${destLng},${destLat}`,
      date: '-1',
      hhmmss: '-1',
      day_type: 'Weekday',
      route_type: 'All',
    })
    const res = await fetch(`${TRANSIT_URL}?${qs}`, {
      headers: {
        Authorization: `KakaoAK ${key}`,
        accept: 'application/json',
      },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return fallback
    const body = await res.json()
    const journeys = Array.isArray(body?.journeys) ? body.journeys : []
    if (!journeys.length) return fallback

    let bestSec = Infinity
    let transfers: number | null = null
    for (const j of journeys) {
      const sec = Number(j?.summary?.total_time)
      if (!Number.isFinite(sec) || sec <= 0) continue
      if (sec < bestSec) {
        bestSec = sec
        transfers = Number.isFinite(Number(j?.summary?.transfer_count))
          ? Number(j.summary.transfer_count)
          : null
      }
    }
    if (!Number.isFinite(bestSec) || bestSec === Infinity) return fallback

    return {
      transitMinutes: Math.max(1, Math.round(bestSec / 60)),
      source: 'kakao',
      transferCount: transfers,
    }
  } catch {
    return fallback
  }
}
