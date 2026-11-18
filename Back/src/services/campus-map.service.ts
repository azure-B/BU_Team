import { AppError } from '../utils/app-error';

export type MapPoint = { lat: number; lng: number };
export type WalkingRouteInput = { origin: MapPoint; destination: MapPoint };

export function getMapConfig() {
  return {
    javascriptKey: process.env.KAKAO_JAVASCRIPT_KEY?.trim() || '',
    walkingConfigured: Boolean(process.env.KAKAO_REST_API_KEY?.trim()),
    center: { lat: 36.8391, lng: 127.1855 },
  };
}

export async function getWalkingRoute(input: WalkingRouteInput, request: typeof fetch = fetch) {
  const key = process.env.KAKAO_REST_API_KEY?.trim();
  if (!key) {
    console.warn('[campus-map] walking unavailable: key_missing');
    throw new AppError('카카오 도보 길찾기 키가 설정되지 않았습니다.', 503);
  }
  const query = new URLSearchParams({
    origin: `${input.origin.lng},${input.origin.lat}`,
    destination: `${input.destination.lng},${input.destination.lat}`,
    priority: 'DISTANCE', summary: 'false',
  });
  let response: Response;
  try {
    response = await request(`https://apis-navi.kakaomobility.com/affiliate/walking/v1/directions?${query}`, {
      headers: { Authorization: `KakaoAK ${key}`, accept: 'application/json' },
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    console.warn('[campus-map] walking request failed: network_or_timeout');
    throw new AppError('도보 길찾기 서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.', 504);
  }
  console.info('[campus-map] walking response', { httpStatus: response.status });
  if (response.status === 401 || response.status === 403) {
    throw new AppError('카카오 REST 키 또는 도보 길찾기 제휴 권한을 확인해 주세요.', 503);
  }
  if (response.status === 429) throw new AppError('길찾기 요청 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.', 429);
  if (!response.ok) throw new AppError('카카오 도보 길찾기 요청에 실패했습니다.', 502);
  let body: any;
  try { body = await response.json(); } catch { throw new AppError('길찾기 응답을 읽을 수 없습니다.', 502); }
  const route = body?.routes?.[0];
  console.info('[campus-map] walking result', { resultCode: typeof route?.result_code === 'number' ? route.result_code : null });
  if (!route || route.result_code !== 0) throw new AppError('이 위치 사이의 도보 경로를 찾지 못했습니다.', 422);
  const distanceMeters = route.summary?.distance;
  const durationSeconds = route.summary?.duration;
  const path: MapPoint[] = [];
  for (const section of route.sections || []) {
    for (const road of section.roads || []) {
      const points = road.vertexes;
      if (!Array.isArray(points) || points.length % 2 !== 0) throw new AppError('길찾기 경로 좌표가 올바르지 않습니다.', 502);
      for (let i = 0; i < points.length; i += 2) {
        const [lng, lat] = [points[i], points[i + 1]];
        if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
          throw new AppError('길찾기 경로 좌표가 올바르지 않습니다.', 502);
        }
        const previous = path[path.length - 1];
        if (!previous || previous.lat !== lat || previous.lng !== lng) path.push({ lat, lng });
      }
    }
  }
  if (!Number.isFinite(distanceMeters) || distanceMeters < 0 || !Number.isFinite(durationSeconds) || durationSeconds < 0 || path.length < 2) {
    throw new AppError('지도에 표시할 상세 경로를 받지 못했습니다.', 502);
  }
  return { source: 'kakao' as const, distanceMeters, durationSeconds, path };
}
