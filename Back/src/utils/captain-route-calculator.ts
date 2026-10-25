import supabase, { unwrap } from '../config/supabase';
import { ELEVATOR_WAIT_SLOTS } from '../data/elevatorWaitSlots';
import { estimateTransitMinutes } from './kakao-transit';
import { estimateWalkingMinutes, haversineMeters } from './kakao-walking';
import { adjustCampusEdgeMinutes, getCampusWalkWeather } from './walk-speed';

/** 캠퍼스 내 스냅 반경 (m) — 이내면 CampusEdge 건물간 분 우선 */
const CAMPUS_SNAP_METERS = 180;
/** 도보 이 이상이면 대중교통 안내로 전환 */
const WALK_TO_TRANSIT_MIN = 30;

export type RouteLatenessInput = {
  currentBuildingId?: string;
  lat?: number;
  lng?: number;
  nextClassBuildingId: string;
  nextClassStartAt: string;
  /** 대시보드 데모 시각 등 — 없으면 서버 now */
  nowAt?: string;
};

type Situation =
  | 'LATE'
  | 'CRITICAL'
  | 'URGENT'
  | 'HURRY'
  | 'STEADY'
  | 'RELAXED';

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function formatHm(date: Date) {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

function weekdayMon1(date: Date) {
  const d = date.getDay();
  return d === 0 ? 7 : d;
}

function lookupElevator(buildingId: string, classStart: Date) {
  const day = weekdayMon1(classStart);
  const hour = classStart.getHours();
  const slot = ELEVATOR_WAIT_SLOTS.find(
    (s) => s.buildingId === buildingId && s.day === day && s.hour === hour,
  );
  if (slot) {
    return {
      elevatorMinutes: slot.elevatorMinutes,
      isPeak: slot.isPeak,
      estimatedTraffic: slot.estimatedTraffic,
      buildingName: slot.buildingName,
    };
  }
  return {
    elevatorMinutes: 3,
    isPeak: false,
    estimatedTraffic: 0,
    buildingName: '',
  };
}

async function getCampusEdgeMinutes(fromId: string, toId: string) {
  if (!fromId || !toId || fromId === toId) return fromId === toId ? 0 : null;
  const edge = await unwrap(
    supabase
      .from('CampusEdge')
      .select('*')
      .or(
        `and(fromBuildingId.eq.${fromId},toBuildingId.eq.${toId}),and(fromBuildingId.eq.${toId},toBuildingId.eq.${fromId})`,
      )
      .limit(1)
      .maybeSingle(),
  );
  return typeof edge?.walkingMinutes === 'number' ? edge.walkingMinutes : null;
}

function pickSituation(minutesLeft: number, totalNeeded: number): Situation {
  const slack = minutesLeft - totalNeeded;
  if (minutesLeft <= 0) return 'LATE';
  if (slack < 0) return 'CRITICAL';
  if (slack < 3) return 'URGENT';
  if (slack < 8) return 'HURRY';
  if (slack < 20) return 'STEADY';
  return 'RELAXED';
}

function weatherHint(rainBand: string) {
  if (rainBand === 'heavy') return '폭우라 걸음이 더 느려져요. '
  if (rainBand === 'rain') return '비로 이동이 조금 더뎌요. '
  if (rainBand === 'drizzle') return '이슬비라 미끄러울 수 있어요. '
  return ''
}

function buildTips(opts: {
  situation: Situation;
  buildingName: string;
  arriveLabel: string;
  isPeak: boolean;
  totalMinutes: number;
  travelMode: 'walk' | 'transit';
  slack: number;
  rainBand: string;
}) {
  const {
    situation,
    buildingName,
    arriveLabel,
    isPeak,
    totalMinutes,
    travelMode,
    slack,
    rainBand,
  } = opts;
  const place = buildingName || '강의실';
  const wx = weatherHint(rainBand);
  const movePhrase =
    travelMode === 'transit'
      ? `대중교통 포함 강의실까지 총 ${totalMinutes}분 예상되어져요`
      : `강의실까지 총 ${totalMinutes}분 예상되어져요`;
  const peakHint = isPeak
    ? `${wx}${place} 붐빔이 예상돼요. 적어도 ${arriveLabel}까지는 도착하세요.`
    : `${wx}${movePhrase}. ${arriveLabel}까지 도착을 권장해요.`;

  const pool: Record<Situation, { highlight: string; sub: string }> = {
    LATE: {
      highlight: '수업이 이미 시작했어요',
      sub: `${wx}지금이라도 ${place}로 이동하세요. ${movePhrase}.`,
    },
    CRITICAL: {
      highlight: '지금 출발해도 빠듯해요',
      sub: isPeak
        ? `${wx}${place} 혼잡 피크예요. ${arriveLabel} 도착이 이상적이지만 서둘러 이동하세요.`
        : `${wx}남은 여유가 없어요. ${arriveLabel} 전 도착을 목표로 바로 이동하세요.`,
    },
    URGENT: {
      highlight: '지금 바로 출발하세요',
      sub: peakHint,
    },
    HURRY: {
      highlight: '조금 서두르는 게 좋아요',
      sub: peakHint,
    },
    STEADY: {
      highlight:
        isPeak
          ? `${place} 붐빔 대비가 필요해요`
          : travelMode === 'transit'
            ? '대중교통으로 여유 있게 이동해요'
            : '여유 있게 걸어가도 돼요',
      sub: isPeak
        ? `${wx}적어도 ${arriveLabel}까지는 도착하세요. ${movePhrase}.`
        : `${wx}${movePhrase}. ${arriveLabel} 전 도착이면 충분해요.`,
    },
    RELAXED: {
      highlight:
        travelMode === 'transit' ? '대중교통으로 천천히 가도 충분해요' : '천천히 걸어도 충분해요',
      sub: isPeak
        ? `${wx}${place}은 붐빌 수 있어요. ${arriveLabel}쯤 맞춰 가면 여유로워요. (여유 ${Math.max(0, Math.round(slack))}분)`
        : `${wx}${movePhrase}. ${arriveLabel} 전만 도착하면 괜찮아요.`,
    },
  };

  return pool[situation];
}

export const calculateRouteAndLateness = async (input: RouteLatenessInput) => {
  const {
    currentBuildingId,
    lat,
    lng,
    nextClassBuildingId,
    nextClassStartAt,
    nowAt,
  } = input;

  const buildings = await unwrap(supabase.from('Building').select('*'));
  const dest = (buildings || []).find((b: any) => b.id === nextClassBuildingId);
  const destLat = Number(dest?.x);
  const destLng = Number(dest?.y);
  const buildingName = dest?.name || '';

  const hasGps = Number.isFinite(lat) && Number.isFinite(lng);
  let fromBuildingId = currentBuildingId || '';
  let nearestDistanceM: number | null = null;

  if (hasGps) {
    let best: { id: string; dist: number } | null = null;
    for (const b of buildings || []) {
      const bLat = Number(b.x);
      const bLng = Number(b.y);
      if (!Number.isFinite(bLat) || !Number.isFinite(bLng)) continue;
      const dist = haversineMeters(lat as number, lng as number, bLat, bLng);
      if (!best || dist < best.dist) best = { id: b.id, dist };
    }
    if (best) {
      nearestDistanceM = Math.round(best.dist);
      if (best.dist <= CAMPUS_SNAP_METERS) fromBuildingId = best.id;
    }
  }

  const weather = await getCampusWalkWeather();

  let walkingMinutes = 10;
  let walkingMeters: number | null = null;
  let walkingSource: 'kakao' | 'campus-edge' | 'haversine' | 'default' = 'default';
  let campusEdgeMinutes: number | null = null;
  let campusEdgeRaw: number | null = null;

  if (fromBuildingId) {
    campusEdgeRaw = await getCampusEdgeMinutes(fromBuildingId, nextClassBuildingId);
    if (typeof campusEdgeRaw === 'number') {
      campusEdgeMinutes = adjustCampusEdgeMinutes(campusEdgeRaw, weather);
    }
  }

  if (hasGps && Number.isFinite(destLat) && Number.isFinite(destLng)) {
    const walk = await estimateWalkingMinutes(
      lat as number,
      lng as number,
      destLat,
      destLng,
      weather,
    );
    walkingMinutes = walk.walkingMinutes;
    walkingMeters = walk.walkingMeters;
    walkingSource = walk.source;

    // 캠퍼스 안이면 우리가 뽑은 건물간 분(날씨 보정) 우선
    if (
      fromBuildingId &&
      typeof campusEdgeMinutes === 'number' &&
      nearestDistanceM !== null &&
      nearestDistanceM <= CAMPUS_SNAP_METERS
    ) {
      walkingMinutes = campusEdgeMinutes;
      walkingSource = 'campus-edge';
    }
  } else if (typeof campusEdgeMinutes === 'number') {
    walkingMinutes = campusEdgeMinutes;
    walkingSource = 'campus-edge';
  }

  let travelMode: 'walk' | 'transit' = 'walk';
  let travelMinutes = walkingMinutes;
  let transitMinutes: number | null = null;
  let transitSource: 'kakao' | 'estimate' | null = null;

  if (
    walkingMinutes >= WALK_TO_TRANSIT_MIN &&
    hasGps &&
    Number.isFinite(destLat) &&
    Number.isFinite(destLng)
  ) {
    const transit = await estimateTransitMinutes(
      lat as number,
      lng as number,
      destLat,
      destLng,
      walkingMinutes,
      walkingMeters,
    );
    travelMode = 'transit';
    transitMinutes = transit.transitMinutes;
    transitSource = transit.source;
    travelMinutes = transit.transitMinutes;
  }

  const classStart = new Date(nextClassStartAt);
  const now = nowAt ? new Date(nowAt) : new Date();
  const minutesLeft = Number.isNaN(classStart.getTime())
    ? 0
    : (classStart.getTime() - now.getTime()) / (1000 * 60);

  const elev = lookupElevator(nextClassBuildingId, classStart);
  const elevatorMinutes = elev.elevatorMinutes;
  const totalMinutes = travelMinutes + elevatorMinutes;

  const recommendArriveAt = Number.isNaN(classStart.getTime())
    ? null
    : new Date(classStart.getTime() - elevatorMinutes * 60 * 1000);
  const arriveLabel = recommendArriveAt ? formatHm(recommendArriveAt) : '--:--';

  const situation = pickSituation(minutesLeft, totalMinutes);
  const slack = minutesLeft - totalMinutes;
  const tip = buildTips({
    situation,
    buildingName: elev.buildingName || buildingName,
    arriveLabel,
    isPeak: elev.isPeak,
    totalMinutes,
    travelMode,
    slack,
    rainBand: weather.rainBand,
  });

  let latenessRisk = 10;
  if (situation === 'LATE' || situation === 'CRITICAL') latenessRisk = 100;
  else if (situation === 'URGENT') latenessRisk = 90;
  else if (situation === 'HURRY') latenessRisk = 50;
  else if (situation === 'STEADY') latenessRisk = 25;
  else latenessRisk = 10;

  const latenessLevel =
    latenessRisk >= 90 ? 'DANGER' : latenessRisk >= 50 ? 'WARNING' : 'SAFE';

  const facilityBuildingId = fromBuildingId || currentBuildingId || nextClassBuildingId;
  const facilities = await unwrap(
    supabase.from('Facility').select('*').eq('buildingId', facilityBuildingId).limit(3),
  );

  const fromPhrase = hasGps ? '현재 위치에서' : '근처에서';
  const travelLabel =
    travelMode === 'transit'
      ? `${fromPhrase} 대중교통 포함 강의실까지 총 ${totalMinutes}분`
      : `${fromPhrase} 강의실까지 총 ${totalMinutes}분`;

  return {
    walkingMinutes,
    walkingMeters,
    walkingSource,
    travelMode,
    travelMinutes,
    transitMinutes,
    transitSource,
    campusEdgeMinutes,
    campusEdgeRawMinutes: campusEdgeRaw,
    walkSpeedMPerMin: weather.speedMPerMin,
    walkSpeedFactor: weather.speedFactor,
    weather: {
      rainBand: weather.rainBand,
      precipitationMmH: weather.precipitationMmH,
      weatherCode: weather.weatherCode,
      source: weather.source,
    },
    elevatorMinutes,
    elevatorPeak: elev.isPeak,
    estimatedTraffic: elev.estimatedTraffic,
    totalMinutes,
    minutesLeft: Math.round(minutesLeft),
    slackMinutes: Math.round(slack),
    recommendArriveAt: recommendArriveAt?.toISOString() ?? null,
    recommendArriveLabel: arriveLabel,
    situation,
    tipHighlight: tip.highlight,
    tipSub: tip.sub,
    walkLabel: travelLabel,
    travelLabel,
    latenessRisk,
    latenessLevel,
    recommendedFacilities: facilities || [],
    message: tip.sub,
    fromBuildingId: fromBuildingId || null,
    nearestDistanceM,
    destinationBuildingName: buildingName,
  };
};
