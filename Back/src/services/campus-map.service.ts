import { AppError } from '../utils/app-error';
import { CAMPUS_BUILDINGS, CAMPUS_WALK_MINUTES, walkMinutesBetween } from '../data/campusBuildings';
import { CAMPUS_HILL_M_PER_MIN } from '../utils/walk-speed';
import { haversineMeters } from '../utils/kakao-walking';

export type MapPoint = {
  lat: number;
  lng: number;
  buildingId?: string;
  name?: string;
};
export type WalkingRouteInput = { origin: MapPoint; destination: MapPoint };
export type WalkingRouteResult = {
  source: 'kakao' | 'osrm' | 'haversine' | 'campus';
  distanceMeters: number;
  durationSeconds: number;
  path: MapPoint[];
  walkMinutes?: number;
};

const KAKAO_WALKING_URL = 'https://apis-navi.kakaomobility.com/affiliate/walking/v1/directions';
const OSRM_FOOT_URL = 'https://router.project-osrm.org/route/v1/foot';
/** OSRM 평지 ETA 대비 캠퍼스 언덕·가방 보행 보정 (대시보드 5분 ≈ OSRM 2분의 ~2.5~3배) */
const CAMPUS_OSRM_FACTOR = 3;

/**
 * 지도 SDK 키는 Render/루트 env의 KAKAO_JAVASCRIPT_KEY를 사용한다.
 * 도보 경로 geometry: 카카오 제휴 → OSRM foot → 직선.
 * 시간·거리는 가능하면 대시보드 CampusEdge(CAMPUS_WALK_MINUTES)를 우선한다.
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

export function resolveBuildingName(point: MapPoint): string | null {
  const named = point.name?.trim();
  if (named && CAMPUS_WALK_MINUTES[named]) return named;
  if (named) {
    const byName = CAMPUS_BUILDINGS.find((b) => b.name === named || b.aliases.includes(named));
    if (byName) return byName.name;
  }
  if (point.buildingId) {
    const byId = CAMPUS_BUILDINGS.find((b) => b.id === point.buildingId);
    if (byId) return byId.name;
  }
  return null;
}

/** 대시보드와 동일한 교내 도보 분 → 초·미터(언덕 50m/min) */
export function campusEdgeTiming(fromName: string, toName: string) {
  const walkMinutes = walkMinutesBetween(fromName, toName);
  if (walkMinutes == null || walkMinutes < 0) return null;
  return {
    walkMinutes,
    durationSeconds: Math.max(1, walkMinutes * 60),
    distanceMeters: Math.max(1, walkMinutes * CAMPUS_HILL_M_PER_MIN),
  };
}

function applyDashboardTiming(
  geometry: WalkingRouteResult,
  input: WalkingRouteInput,
): WalkingRouteResult {
  const fromName = resolveBuildingName(input.origin);
  const toName = resolveBuildingName(input.destination);
  if (fromName && toName) {
    const edge = campusEdgeTiming(fromName, toName);
    if (edge) {
      return {
        ...geometry,
        source: 'campus',
        walkMinutes: edge.walkMinutes,
        durationSeconds: edge.durationSeconds,
        distanceMeters: edge.distanceMeters,
      };
    }
  }

  // 건물 표에 없으면 OSRM/카카오 평지 ETA를 캠퍼스 기준으로 ~3배
  if (geometry.source === 'osrm' || geometry.source === 'kakao') {
    return {
      ...geometry,
      durationSeconds: Math.max(1, Math.round(geometry.durationSeconds * CAMPUS_OSRM_FACTOR)),
      distanceMeters: Math.max(1, Math.round(geometry.distanceMeters * CAMPUS_OSRM_FACTOR)),
    };
  }
  return geometry;
}

function haversineRoute(input: WalkingRouteInput): WalkingRouteResult {
  const distanceMeters = Math.max(1, Math.round(metersBetween(input.origin, input.destination)));
  const durationSeconds = Math.max(1, Math.round((distanceMeters / CAMPUS_HILL_M_PER_MIN) * 60));
  return {
    source: 'haversine',
    distanceMeters,
    durationSeconds,
    path: [
      { lat: input.origin.lat, lng: input.origin.lng },
      { lat: input.destination.lat, lng: input.destination.lng },
    ],
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
  const geometry = kakao || (await tryOsrmWalking(input, request)) || haversineRoute(input);
  if (!kakao && geometry.source === 'haversine') {
    console.warn('[campus-map] using haversine walking fallback');
  }

  const timed = applyDashboardTiming(geometry, input);
  console.info('[campus-map] walking timing', {
    geometrySource: geometry.source,
    timingSource: timed.source,
    walkMinutes: timed.walkMinutes ?? null,
    durationSeconds: timed.durationSeconds,
    distanceMeters: timed.distanceMeters,
  });
  return timed;
}
