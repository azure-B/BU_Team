import { AppError } from '../utils/app-error';
import { CAMPUS_HILL_M_PER_MIN } from '../utils/walk-speed';
import { haversineMeters } from '../utils/kakao-walking';

export type MapPoint = { lat: number; lng: number };
export type WalkingRouteInput = { origin: MapPoint; destination: MapPoint };
export type WalkingRouteResult = {
  source: 'kakao' | 'osrm' | 'haversine';
  distanceMeters: number;
  durationSeconds: number;
  path: MapPoint[];
};

const KAKAO_WALKING_URL = 'https://apis-navi.kakaomobility.com/affiliate/walking/v1/directions';
const OSRM_FOOT_URL = 'https://router.project-osrm.org/route/v1/foot';

/**
 * 지도 SDK 키는 Render/루트 env의 KAKAO_JAVASCRIPT_KEY를 사용한다.
 * 도보: 카카오 제휴 → OSRM foot → 직선 추정 순으로 폴백한다.
 */
export function getMapConfig() {
  return {
    javascriptKey: process.env.KAKAO_JAVASCRIPT_KEY?.trim() || '',
    walkingConfigured: true,
    kakaoWalkingConfigured: Boolean(process.env.KAKAO_REST_API_KEY?.trim()),
    center: { lat: 36.8391, lng: 127.1855 },
  };
}

function metersBetween(a: MapPoint, b: MapPoint) {
  return haversineMeters(a.lat, a.lng, b.lat, b.lng);
}

function haversineRoute(input: WalkingRouteInput): WalkingRouteResult {
  const distanceMeters = Math.max(1, Math.round(metersBetween(input.origin, input.destination)));
  const durationSeconds = Math.max(1, Math.round((distanceMeters / CAMPUS_HILL_M_PER_MIN) * 60));
  return {
    source: 'haversine',
    distanceMeters,
    durationSeconds,
    path: [input.origin, input.destination],
  };
}

async function tryKakaoWalking(
  input: WalkingRouteInput,
  request: typeof fetch,
): Promise<WalkingRouteResult | null> {
  const key = process.env.KAKAO_REST_API_KEY?.trim();
  if (!key) return null;

  const query = new URLSearchParams({
    origin: `${input.origin.lng},${input.origin.lat}`,
    destination: `${input.destination.lng},${input.destination.lat}`,
    priority: 'DISTANCE',
    summary: 'false',
  });

  let response: Response;
  try {
    response = await request(`${KAKAO_WALKING_URL}?${query}`, {
      headers: { Authorization: `KakaoAK ${key}`, accept: 'application/json' },
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    console.warn('[campus-map] kakao walking network_or_timeout — fallback');
    return null;
  }

  console.info('[campus-map] kakao walking response', { httpStatus: response.status });
  if (response.status === 401 || response.status === 403 || response.status === 429 || !response.ok) {
    return null;
  }

  let body: any;
  try {
    body = await response.json();
  } catch {
    return null;
  }

  const route = body?.routes?.[0];
  console.info('[campus-map] kakao walking result', {
    resultCode: typeof route?.result_code === 'number' ? route.result_code : null,
  });
  if (!route || route.result_code !== 0) return null;

  const distanceMeters = route.summary?.distance;
  const durationSeconds = route.summary?.duration;
  const path: MapPoint[] = [];
  for (const section of route.sections || []) {
    for (const road of section.roads || []) {
      const points = road.vertexes;
      if (!Array.isArray(points) || points.length % 2 !== 0) return null;
      for (let i = 0; i < points.length; i += 2) {
        const [lng, lat] = [points[i], points[i + 1]];
        if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
          return null;
        }
        const previous = path[path.length - 1];
        if (!previous || previous.lat !== lat || previous.lng !== lng) path.push({ lat, lng });
      }
    }
  }

  if (
    !Number.isFinite(distanceMeters) ||
    distanceMeters < 0 ||
    !Number.isFinite(durationSeconds) ||
    durationSeconds < 0 ||
    path.length < 2
  ) {
    return null;
  }

  return { source: 'kakao', distanceMeters, durationSeconds, path };
}

async function tryOsrmWalking(
  input: WalkingRouteInput,
  request: typeof fetch,
): Promise<WalkingRouteResult | null> {
  const coords = `${input.origin.lng},${input.origin.lat};${input.destination.lng},${input.destination.lat}`;
  const url = `${OSRM_FOOT_URL}/${coords}?overview=full&geometries=geojson`;

  let response: Response;
  try {
    response = await request(url, { signal: AbortSignal.timeout(10000) });
  } catch {
    console.warn('[campus-map] osrm walking network_or_timeout — fallback');
    return null;
  }

  console.info('[campus-map] osrm walking response', { httpStatus: response.status });
  if (!response.ok) return null;

  let body: any;
  try {
    body = await response.json();
  } catch {
    return null;
  }

  const route = body?.routes?.[0];
  if (!route || body?.code !== 'Ok') return null;

  const distanceMeters = Number(route.distance);
  const durationSeconds = Number(route.duration);
  const coordinates = route.geometry?.coordinates;
  if (!Array.isArray(coordinates) || coordinates.length < 2) return null;

  const path: MapPoint[] = [];
  for (const point of coordinates) {
    if (!Array.isArray(point) || point.length < 2) return null;
    const [lng, lat] = point;
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      return null;
    }
    const previous = path[path.length - 1];
    if (!previous || previous.lat !== lat || previous.lng !== lng) path.push({ lat, lng });
  }

  if (
    !Number.isFinite(distanceMeters) ||
    distanceMeters < 0 ||
    !Number.isFinite(durationSeconds) ||
    durationSeconds < 0 ||
    path.length < 2
  ) {
    return null;
  }

  return {
    source: 'osrm',
    distanceMeters: Math.round(distanceMeters),
    durationSeconds: Math.round(durationSeconds),
    path,
  };
}

export async function getWalkingRoute(
  input: WalkingRouteInput,
  request: typeof fetch = fetch,
): Promise<WalkingRouteResult> {
  if (
    !Number.isFinite(input.origin?.lat) ||
    !Number.isFinite(input.origin?.lng) ||
    !Number.isFinite(input.destination?.lat) ||
    !Number.isFinite(input.destination?.lng)
  ) {
    throw new AppError('출발·도착 좌표가 올바르지 않습니다.', 400);
  }
  if (input.origin.lat === input.destination.lat && input.origin.lng === input.destination.lng) {
    throw new AppError('출발 위치와 다른 도착 위치를 선택해 주세요.', 400);
  }

  const kakao = await tryKakaoWalking(input, request);
  if (kakao) return kakao;

  const osrm = await tryOsrmWalking(input, request);
  if (osrm) return osrm;

  console.warn('[campus-map] using haversine walking fallback');
  return haversineRoute(input);
}
