import { getRouteAndLateness } from '../api/dashboardApi'
import { CAMPUS_ACTIVITIES, STUDY_LOUNGES } from '../data/campusSpots'
import { pickOngoingClass } from './classEngagement'

const FALLBACK_BUILDING = 'bldg-hq'
const CACHE_TTL_MS = 5 * 60 * 1000
const routeCache = new Map()

function buildingPoint(buildings, id) {
  const b = (buildings || []).find((x) => x.id === id)
  if (!b) return null
  const lat = Number(b.x)
  const lng = Number(b.y)
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null
}

/** 강의실 코드에서 층 추정: 본부514 → 5, 목양B101 → -1, 백석홀대강당 → null */
export function floorFromRoom(room = '') {
  const m = String(room).match(/(B)?(\d)\d{2}\s*$/)
  if (!m) return null
  return m[1] ? -1 : Number(m[2])
}

/** 진행 중 수업 → 오늘 마지막으로 끝난 수업 → 본부동 */
function currentOrLastClass(today = [], now = new Date()) {
  const ongoing = pickOngoingClass(today, now)
  if (ongoing?.buildingId) return ongoing
  const ended = [...today]
    .filter((s) => s.buildingId && new Date(s.endAt) <= now)
    .sort((a, b) => new Date(b.endAt) - new Date(a.endAt))
  return ended[0] || null
}

/**
 * 「이동 & 강의 안내」와 「다음 수업 전 추천」이 같은 출발점을 쓰도록 통일.
 * - readGps가 좌표를 주면 우선 (데모 GPS 오버라이드·실제 GPS)
 * - 없거나 데모 시계면 지금(또는 직전) 수업 건물 좌표
 */
export async function resolveRouteOrigin({ today, now, buildings, demoClock, readGps }) {
  const cls = currentOrLastClass(today, now)
  const buildingId = cls?.buildingId || FALLBACK_BUILDING
  const floor = cls ? floorFromRoom(cls.room) : null
  if (readGps) {
    const gps = await readGps()
    if (gps && Number.isFinite(gps.lat) && Number.isFinite(gps.lng)) {
      return {
        currentBuildingId: gps.buildingId || buildingId,
        floor,
        lat: gps.lat,
        lng: gps.lng,
      }
    }
  }
  if (!demoClock) {
    /* readGps가 null을 준 경우 — 건물 폴백 */
  }
  const p = buildingPoint(buildings, buildingId)
  return { currentBuildingId: buildingId, floor, lat: p?.lat, lng: p?.lng }
}

async function cachedRoute(args) {
  const key = JSON.stringify(args)
  const hit = routeCache.get(key)
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.data
  const data = await getRouteAndLateness(args)
  routeCache.set(key, { at: Date.now(), data })
  return data
}

function num(v) {
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}

/** 학습 공간·캠퍼스 활동이 있는 건물들 */
function spotBuildingIds() {
  const ids = new Set()
  for (const s of [...STUDY_LOUNGES, ...CAMPUS_ACTIVITIES]) {
    if (s.buildingId) ids.add(s.buildingId)
  }
  return [...ids]
}

/**
 * 틈새 추천용 이동 시간 (서버 경로 계산 = 이동&강의 안내와 동일 기준)
 * - toNextTotal: 출발점 → 다음 강의실 (도보 + 엘리베이터)
 * - originBuildingId / originElevator: 지금 건물에서 내려올 때 엘리베이터 (캠퍼스 안일 때만)
 * - buildingLegs[id]: { travel: 출발점→건물 도보, elevator: 그 건물 엘리베이터, toNextTotal: 건물→다음 강의실(도보+엘리베이터) }
 */
export async function fetchGapRouteTimes({ origin, nextClass, buildings, nowAt, includeBuildings = true }) {
  if (!nextClass?.buildingId || !nextClass?.startAt || !origin) return null
  const base = { nextClassStartAt: nextClass.startAt, nowAt }
  const originArgs = {
    currentBuildingId: origin.currentBuildingId,
    lat: origin.lat,
    lng: origin.lng,
  }

  const toNext = await cachedRoute({
    ...base,
    ...originArgs,
    nextClassBuildingId: nextClass.buildingId,
  }).catch(() => null)

  // 서버가 캠퍼스 건물로 스냅했고 3층 이상(또는 층 모름)일 때만 "내려오는" 엘리베이터를 붙임
  const originBuildingId = toNext?.fromBuildingId || null
  const lowFloor = typeof origin.floor === 'number' && origin.floor < 3
  let originElevator = 0
  if (originBuildingId && !lowFloor) {
    const here = await cachedRoute({
      currentBuildingId: originBuildingId,
      lat: origin.lat,
      lng: origin.lng,
      nextClassBuildingId: originBuildingId,
      nextClassStartAt: nowAt,
      nowAt,
    }).catch(() => null)
    originElevator = num(here?.elevatorMinutes) ?? 3
  }

  const result = {
    toNextTotal: num(toNext?.totalMinutes),
    nextElevator: num(toNext?.elevatorMinutes),
    originBuildingId,
    originElevator,
    buildingLegs: {},
  }
  if (!includeBuildings) return result

  await Promise.all(
    spotBuildingIds().map(async (bid) => {
      const p = buildingPoint(buildings, bid)
      if (!p) return
      const [inRoute, outRoute] = await Promise.all([
        cachedRoute({ ...base, ...originArgs, nextClassBuildingId: bid }).catch(() => null),
        cachedRoute({
          ...base,
          currentBuildingId: bid,
          lat: p.lat,
          lng: p.lng,
          nextClassBuildingId: nextClass.buildingId,
        }).catch(() => null),
      ])
      result.buildingLegs[bid] = {
        travel: num(inRoute?.travelMinutes ?? inRoute?.walkingMinutes),
        elevator: num(inRoute?.elevatorMinutes),
        toNextTotal: num(outRoute?.totalMinutes),
      }
    }),
  )
  return result
}
