/**
 * 다음 수업까지 틈새 활동 분석
 *
 * - 표시 여유 = (다음 수업까지) − (현재→다음 강의실 도보 + 엘리베이터)
 * - 모든 이동: 지금 건물에서 내려오는 엘리베이터 + 도보 + 목적지가 3층 이상이면 엘리베이터
 * - 여유 짧음(<25분): 바로 강의실로 이동해 과제 먼저
 * - 여유 보통: 식사 / 과제(학습 공간) / 캠퍼스 활동 중 하나 랜덤
 * - 여유 넉넉(≥90분): 식사 → 과제·사이버강의(마감 순 1~2개) → 캠퍼스 활동 코스
 * - 과제·사이버강의 순서: 마감 빠른 순, 같은 날 마감이면 전공 먼저
 * - 식사: 제공 10~15분 + 식사 20분, 학식은 11:00~13:30 도착, 밥 추천은 11~14시
 */

import { CAMPUS_ACTIVITIES, CAMPUS_SPOTS, STUDY_LOUNGES } from '../data/campusSpots'
import { haversineMeters } from './classEngagement'
import { isCyberLecture, makeDeadlineComparator } from './courseCategory'

export const MEAL_EAT_MIN = 20
export const FOOD_READY_MIN_LO = 10
export const FOOD_READY_MIN_HI = 15

const WALK_M_PER_MIN = 50
const CAFETERIA_OPEN = 11 * 60
const CAFETERIA_CLOSE = 13 * 60 + 30 // 13:30
const MEAL_SUGGEST_FROM = 11 * 60
const MEAL_SUGGEST_TO = 14 * 60

/** 식당가 → 강의실은 오르막이라 도보 추정에 더함 */
const UPHILL_RETURN_EXTRA_MIN = 2
/** 서버 경로 응답이 없을 때 엘리베이터 기본값 (captain-route-calculator와 동일) */
const DEFAULT_ELEVATOR_MIN = 3
/** 강의실엔 시작 몇 분 전에는 도착하도록 */
const ARRIVE_BUFFER_MIN = 3

const TIGHT_GAP_MIN = 8
const SHORT_GAP_MIN = 25
const LONG_GAP_MIN = 90
const STUDY_MIN = 25
const STUDY_MAX = 60

export function walkMinutesBetween(a, b) {
  if (!a || !b) return 8
  const meters = haversineMeters(a.lat, a.lng, b.lat, b.lng)
  if (!Number.isFinite(meters)) return 8
  return Math.max(1, Math.round(meters / WALK_M_PER_MIN))
}

function minutesOfDay(date) {
  return date.getHours() * 60 + date.getMinutes()
}

function addMinutes(date, min) {
  return new Date(date.getTime() + min * 60 * 1000)
}

function hm(date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function hmToMin(value) {
  const [h, m] = String(value).split(':').map(Number)
  return h * 60 + (m || 0)
}

function foodReadyMinutes(seed = Date.now()) {
  return FOOD_READY_MIN_LO + (Math.abs(seed) % (FOOD_READY_MIN_HI - FOOD_READY_MIN_LO + 1))
}

/** 학식 방문이 11:00~13:30 안인지 (도착 시각 기준) */
function canVisitCafeteria(now, minutesUntilArrive) {
  const arrive = minutesOfDay(now) + minutesUntilArrive
  return arrive >= CAFETERIA_OPEN && arrive <= CAFETERIA_CLOSE
}

/** 밥 추천 가능 구간: 지금 11~14시이거나, 직전 수업 종료가 11~14 */
export function shouldSuggestMeal(now, previousClassEndAt) {
  const n = minutesOfDay(now)
  if (n >= MEAL_SUGGEST_FROM && n < MEAL_SUGGEST_TO) return true
  if (previousClassEndAt) {
    const end = new Date(previousClassEndAt)
    if (!Number.isNaN(end.getTime())) {
      const e = minutesOfDay(end)
      if (e >= MEAL_SUGGEST_FROM && e < MEAL_SUGGEST_TO) return true
    }
  }
  return false
}

/** 운영시간·브레이크타임 안에서 [start, start+duration] 머물 수 있는지 */
function isOpenDuring(spot, start, durationMin) {
  if (!spot.hours?.length) return true
  const day = start.getDay()
  const s = minutesOfDay(start)
  const e = s + durationMin
  const rule = spot.hours.find((r) => r.days.includes(day))
  if (!rule) return false
  if (s < hmToMin(rule.open) || e > hmToMin(rule.close)) return false
  for (const b of spot.breaks || []) {
    if (!b.days.includes(day)) continue
    if (s < hmToMin(b.to) && e > hmToMin(b.from)) return false
  }
  return true
}

function pickRandom(list, seed) {
  if (!list?.length) return null
  return list[Math.abs(seed) % list.length]
}

function shuffleCopy(list, seed) {
  const arr = [...list]
  let s = Math.abs(seed) || 1
  for (let i = arr.length - 1; i > 0; i -= 1) {
    s = (s * 1103515245 + 12345) >>> 0
    const j = s % (i + 1)
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function buildingPoint(buildings, id) {
  const b = (buildings || []).find((x) => x.id === id)
  if (!b) return null
  const lat = Number(b.x)
  const lng = Number(b.y)
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null
}

/** 좌표 붙인 공통 형태: { ...spot, point, buildingId?, floor } */
function withPoint(spot, buildings) {
  const point = Number.isFinite(spot.lat) && Number.isFinite(spot.lng)
    ? { lat: Number(spot.lat), lng: Number(spot.lng) }
    : buildingPoint(buildings, spot.buildingId)
  return point ? { ...spot, point, floor: spot.floor ?? 1 } : null
}

function facilitiesAsSpots(facilities = [], buildings = []) {
  return (facilities || [])
    .filter((f) => f?.name)
    .map((f) => {
      const b = (buildings || []).find((x) => x.id === f.buildingId)
      const type =
        f.type === '학식' || f.type === '식당'
          ? 'cafeteria'
          : f.type === '카페'
            ? 'cafe'
            : 'facility'
      return {
        id: f.id,
        name: f.name,
        type,
        lat: Number(b?.x),
        lng: Number(b?.y),
        blurb: f.type ? `${f.type} · ${b?.name || '캠퍼스'}` : b?.name || '캠퍼스',
      }
    })
    .filter((s) => Number.isFinite(s.lat) && Number.isFinite(s.lng))
}

const MEAL_TITLES = [
  (name) => `오늘은 ${name} 어때요?`,
  (name) => `${name}에서 한 끼 채우고 갈까요?`,
  (name) => `배고프면 ${name} 쪽이 가까워요`,
  (name) => `잠깐 ${name} 들렀다 가도 괜찮아요`,
]

const PLAN_TITLES = [
  (min) => `여유가 ${min}분이나 있어요! 이렇게 알차게 보내볼까요?`,
  (min) => `${min}분 공강, 그냥 보내긴 아깝죠. 추천 코스 갑니다!`,
  (min) => `넉넉한 ${min}분, 밥·과제·놀이까지 다 챙겨봐요`,
]

/** 미완료 + 기간(마감 임박·최근 지연)에 맞는 과제만 */
export function pickRelevantTasks(tasks = [], now = new Date()) {
  const HORIZON_MS = 14 * 24 * 60 * 60 * 1000
  const OVERDUE_GRACE_MS = 3 * 24 * 60 * 60 * 1000
  return (tasks || [])
    .filter((t) => {
      if (!t?.dueAt) return false
      if (t.done === true) return false
      const st = String(t.status || '').toUpperCase()
      if (st === 'COMPLETED' || st === 'DONE' || st === 'SUBMITTED') return false
      return true
    })
    .map((t) => ({ ...t, due: new Date(t.dueAt) }))
    .filter((t) => {
      if (Number.isNaN(t.due.getTime())) return false
      const delta = t.due.getTime() - now.getTime()
      return delta >= -OVERDUE_GRACE_MS && delta <= HORIZON_MS
    })
    .sort(makeDeadlineComparator(now))
}

function dueShort(due, now) {
  const sameDay = due.toDateString() === now.toDateString()
  return sameDay ? `오늘 ${hm(due)}` : `${due.getMonth() + 1}/${due.getDate()}`
}

/** 마감 순 상위 과제·사이버강의 → 추천 문구용 */
function toWorkItems(tasks, now, limit = 2) {
  return tasks.slice(0, limit).map((t) => {
    const cyber = isCyberLecture(t)
    return {
      cyber,
      noun: cyber ? '사이버강의' : '과제',
      label: taskSuggestLabel(t.title).replace(/\s*사이버\s*강의\s*$/, ''),
      dueText: dueShort(t.due, now),
    }
  })
}

function taskSuggestLabel(title = '') {
  const raw = String(title).trim()
  // "과목 · N주차: 내용" → 과목·주차 위주로 짧게
  const m = raw.match(/^(.+?)\s*·\s*(\d+주차)\s*[:：]?\s*(.*)$/)
  if (m) {
    const course = m[1].trim()
    const week = m[2]
    const rest = (m[3] || '').trim()
    return rest ? `${course} ${week} ${rest}` : `${course} ${week}`
  }
  return raw
}

/**
 * 이동 시간 모델 — 서버 경로(routeTimes)가 있으면 우선, 없으면 직선거리 + 기본 엘리베이터
 */
function createLegModel({ origin, originPoint, nextPoint, routeTimes }) {
  const legs = routeTimes?.buildingLegs || {}
  const originBuildingId = routeTimes ? routeTimes.originBuildingId : (origin?.currentBuildingId || null)
  const originLow = typeof origin?.floor === 'number' && origin.floor < 3
  const originElevator = routeTimes
    ? (routeTimes.originElevator ?? 0)
    : (originBuildingId && !originLow ? DEFAULT_ELEVATOR_MIN : 0)
  const nextElevator = routeTimes?.nextElevator ?? DEFAULT_ELEVATOR_MIN

  const floorElevator = (spot) =>
    spot?.floor >= 3 ? (legs[spot.buildingId]?.elevator ?? DEFAULT_ELEVATOR_MIN) : 0
  const walk = (a, b) => (a && b ? walkMinutesBetween(a, b) : 5)

  return {
    nextElevator,
    /** 출발점 → spot */
    fromOrigin(spot) {
      if (spot.buildingId && spot.buildingId === originBuildingId) return floorElevator(spot)
      const viaRoute = spot.buildingId ? legs[spot.buildingId]?.travel : null
      return originElevator + (viaRoute ?? walk(originPoint, spot.point)) + floorElevator(spot)
    },
    /** spot → 다음 강의실 */
    toNext(spot, extra = 0) {
      const viaRoute = spot.buildingId ? legs[spot.buildingId]?.toNextTotal : null
      if (viaRoute != null) return floorElevator(spot) + viaRoute + extra
      return floorElevator(spot) + walk(spot.point, nextPoint) + nextElevator + extra
    },
    /** spot a → spot b (코스 중간 이동) */
    between(a, b, extra = 0) {
      if (a.buildingId && a.buildingId === b.buildingId) return Math.max(floorElevator(a), floorElevator(b))
      return floorElevator(a) + walk(a.point, b.point) + floorElevator(b) + extra
    },
  }
}

function headerFields(gapMin, freeGap, travelToNext) {
  return { gapMinutes: gapMin, freeGapMinutes: freeGap, travelToNextMinutes: travelToNext }
}

/**
 * @returns {{ kind: string, title: string, body: string, gapMinutes?: number, freeGapMinutes?: number, travelToNextMinutes?: number, items?: object[] } | null}
 */
export function analyzeGapActivity({
  now = new Date(),
  nextClass = null,
  previousClassEndAt = null,
  origin = null,
  tasks = [],
  facilities = [],
  buildings = [],
  /** campusRouteTimes.fetchGapRouteTimes 결과 — 이동&강의 안내와 같은 서버 경로 기준 */
  routeTimes = null,
} = {}) {
  if (!nextClass?.startAt) return null
  const nextStart = new Date(nextClass.startAt)
  const gapMin = Math.round((nextStart.getTime() - now.getTime()) / 60000)
  /** 이동까지 포함한 활동이 끝나야 하는 시간 (강의실 도착 버퍼 제외) */
  const budget = gapMin - ARRIVE_BUFFER_MIN

  const originPoint = origin && Number.isFinite(origin.lat) ? origin : null
  const nextPoint = buildingPoint(buildings, nextClass.buildingId)
  const model = createLegModel({ origin, originPoint, nextPoint, routeTimes })

  const travelToNext = routeTimes?.toNextTotal
    ?? ((originPoint && nextPoint ? walkMinutesBetween(originPoint, nextPoint) : 5) + model.nextElevator)
  const freeGap = Math.max(0, gapMin - travelToNext)
  const header = headerFields(gapMin, freeGap, travelToNext)

  const works = toWorkItems(pickRelevantTasks(tasks, now), now)
  const workIsCyber = works[0]?.cyber ?? false
  const workNoun = works[0]?.noun ?? '과제'
  const taskLabel = works[0]?.label ?? null
  const nextRoom = nextClass.room
    || [nextClass.displayTitle, '강의실'].filter(Boolean).join(' ')

  if (freeGap < TIGHT_GAP_MIN) {
    return {
      kind: 'tight',
      title: '이동만 맞춰도 빠듯해요',
      body: `다음 강의실까지 엘리베이터 포함 약 ${travelToNext}분이라 남는 여유는 ${freeGap}분쯤이에요. 짐 챙기고 바로 이동하세요.`,
      ...header,
    }
  }

  if (freeGap < SHORT_GAP_MIN) {
    return {
      kind: 'move-now',
      title: taskLabel
        ? `바로 강의실로 가서 「${taskLabel}」 ${workNoun}부터 ${workIsCyber ? '틀어볼까요?' : '들어가볼까요?'}`
        : '바로 강의실로 가서 미리 자리 잡아볼까요?',
      body: `다음 강의실까지 엘리베이터 포함 ${travelToNext}분이라 어디 들르기엔 짧아요. 먼저 도착해서 ${taskLabel ? `남는 시간에 ${workNoun}를 시작해 두면` : '지난 필기를 훑어 두면'} 딱이에요.`,
      ...header,
      items: [
        {
          name: nextRoom,
          detail: `이동 ${travelToNext}분 · ${taskLabel ? workNoun : '복습'} ${freeGap}분`,
          total: gapMin,
        },
      ],
    }
  }

  const seed = Math.floor(now.getTime() / (5 * 60 * 1000))
    + String(nextClass.id || nextClass.title || '').length
  const allSpots = [...CAMPUS_SPOTS, ...facilitiesAsSpots(facilities, buildings)]
    .map((s) => withPoint(s, buildings))
    .filter(Boolean)
  const mealOk = shouldSuggestMeal(now, previousClassEndAt)
  const ready = foodReadyMinutes(seed)
  const mealStay = ready + MEAL_EAT_MIN
  const mealPlaces = allSpots
    .filter((s) => s.type === 'cafeteria' || s.type === 'restaurant')
    .map((s) => ({ ...s, isMeal: true }))
  const studySpots = [
    ...STUDY_LOUNGES.map((l) => withPoint(l, buildings)).filter(Boolean)
      .map((l) => ({ ...l, floor: l.floor ?? 1, indoor: l.indoorExtraMin ?? 2 })),
    ...CAMPUS_ACTIVITIES.filter((a) => a.kind === 'study')
      .map((a) => withPoint(a, buildings)).filter(Boolean),
  ]
  const leisureSpots = [
    ...CAMPUS_ACTIVITIES.filter((a) => a.kind !== 'study')
      .map((a) => withPoint(a, buildings)).filter(Boolean),
    ...allSpots
      .filter((s) => s.type === 'park' || s.type === 'cafe')
      .map((s) => ({
        ...s,
        kind: 'leisure',
        stayMin: s.type === 'park' ? 12 : 15,
        hint: s.blurb,
        title: s.type === 'park' ? `${s.name}에서 짧게 숨 고를까요?` : `${s.name}에서 리셋 한 잔?`,
      })),
  ]

  const mealTitle = (r) => (r.quips?.length
    ? pickRandom(r.quips, seed + r.name.length)
    : pickRandom(MEAL_TITLES, seed + r.name.length)(r.name))

  if (freeGap >= LONG_GAP_MIN) {
    const plan = buildPlan({
      now, seed, budget, model, mealOk, mealStay, ready, mealPlaces, studySpots, leisureSpots, works, nextRoom,
    })
    if (plan) {
      return {
        kind: 'plan',
        title: pickRandom(PLAN_TITLES, seed)(freeGap),
        body: plan.body,
        ...header,
        items: plan.items,
      }
    }
  }

  const candidates = []

  // —— 식사
  if (mealOk) {
    for (const r of mealPlaces) {
      const toFood = model.fromOrigin(r)
      const toNext = model.toNext(r, UPHILL_RETURN_EXTRA_MIN)
      const total = toFood + mealStay + toNext
      if (total > budget) continue
      if (r.type === 'cafeteria' && !canVisitCafeteria(now, toFood)) continue
      candidates.push({
        weight: r.type === 'cafeteria' ? 3 : 2,
        payload: {
          kind: 'meal',
          title: mealTitle(r),
          body: `가는 길 ${toFood}분, 메뉴 대기 ${ready}분, 식사 ${MEAL_EAT_MIN}분이 예상되며, 강의실까진 ${toNext}분이 걸려요!`,
          ...header,
          items: [{ name: r.name, detail: `${r.blurb || ''} · 총 약 ${total}분`.trim(), total }],
        },
      })
    }
  }

  // —— 과제 + 학습 공간
  if (taskLabel && freeGap >= 18) {
    const spots = studySpots
      .map((s) => {
        const moveIn = model.fromOrigin(s) + (s.indoor || 0)
        const toNext = model.toNext(s)
        const studyBlock = Math.min(40, budget - moveIn - toNext)
        if (studyBlock < 12) return null
        if (!isOpenDuring(s, addMinutes(now, moveIn), studyBlock)) return null
        return { ...s, moveIn, toNext, studyBlock, total: moveIn + studyBlock + toNext }
      })
      .filter(Boolean)
      .sort((a, b) => a.moveIn - b.moveIn)

    if (spots.length) {
      candidates.push({
        weight: 3,
        payload: {
          kind: 'task',
          title: `「${taskLabel}」 ${workNoun}, 미리 ${workIsCyber ? '들어보시는' : '해보시는'} 것 어떠세요?`,
          body: works.length > 1
            ? `마감 순서: ${works.map((w) => `「${w.label}」 ${w.noun}(${w.dueText})`).join(' → ')}. 근처 학습·휴게 공간에서 먼저 것부터 진도 내 보세요.`
            : `${works[0].dueText} 마감이에요. 근처 학습·휴게 공간에서 짧게 진도 내 보세요.`,
          ...header,
          items: spots.slice(0, 3).map((s) => ({
            name: s.name,
            detail: `${s.hint} · 이동 ${s.moveIn}분 · ${workNoun} ${s.studyBlock}분 · 다음 강의 ${s.toNext}분`,
            total: s.total,
          })),
        },
      })
    }
  }

  // —— 캠퍼스 활동·카페·공원
  const leisure = leisureSpots
    .map((s) => {
      const toSpot = model.fromOrigin(s)
      const toNext = model.toNext(s)
      const total = toSpot + s.stayMin + toNext
      if (total > budget) return null
      if (!isOpenDuring(s, addMinutes(now, toSpot), s.stayMin)) return null
      return { ...s, toSpot, toNext, total }
    })
    .filter(Boolean)

  if (leisure.length) {
    const pick = pickRandom(shuffleCopy(leisure, seed), seed)
    candidates.push({
      weight: 1,
      payload: {
        kind: 'activity',
        title: pick.title || `${pick.name} 들러볼까요?`,
        body: `가는 길 ${pick.toSpot}분, ${pick.stayMin}분 정도 즐기고, 강의실까진 ${pick.toNext}분이 걸려요!`,
        ...header,
        items: [{ name: pick.name, detail: `${pick.hint || ''} · 총 약 ${pick.total}분`.trim(), total: pick.total }],
      },
    })
  }

  if (!candidates.length) {
    return {
      kind: 'prep',
      title: '짧게 정리하고 이동만 맞춰도 충분해요',
      body: `다음 수업까지 ${gapMin}분, 이동 ${travelToNext}분 빼면 ${freeGap}분 남아요. 필기 한 페이지만 훑고 동선을 확인하세요.`,
      ...header,
    }
  }

  // 가중 랜덤: meal/task를 더 자주
  const weighted = []
  for (const c of shuffleCopy(candidates, seed)) {
    for (let i = 0; i < c.weight; i += 1) weighted.push(c.payload)
  }
  return pickRandom(weighted, seed) || candidates[0].payload
}

/**
 * 넉넉한 공강 코스: 식사 → 과제(또는 복습) → 캠퍼스 활동 → 다음 강의실
 * 각 단계는 이전 장소에서 이어서 이동 시간(엘리베이터 포함)을 계산
 */
function buildPlan({
  now, seed, budget, model, mealOk, mealStay, ready, mealPlaces, studySpots, leisureSpots, works = [], nextRoom,
}) {
  const steps = []
  let cursor = 0
  let prev = null

  const legTo = (spot) => (prev
    ? model.between(prev, spot, prev.isMeal ? UPHILL_RETURN_EXTRA_MIN : 0)
    : model.fromOrigin(spot)) + (spot.indoor || 0)
  const backFrom = (spot) => model.toNext(spot, spot.isMeal ? UPHILL_RETURN_EXTRA_MIN : 0)
  const push = (spot, move, stay, label, tag) => {
    const start = cursor + move
    steps.push({ spot, move, stay, label, start, tag })
    cursor = start + stay
    prev = spot
  }

  if (mealOk) {
    for (const m of shuffleCopy(mealPlaces, seed)) {
      const move = legTo(m)
      if (m.type === 'cafeteria' && !canVisitCafeteria(now, cursor + move)) continue
      if (cursor + move + mealStay + backFrom(m) > budget) continue
      push(m, move, mealStay, `메뉴 대기 ${ready}분 + 식사 ${MEAL_EAT_MIN}분`, '식사')
      break
    }
  }

  const studyOptions = studySpots
    .map((s) => ({ s, move: legTo(s) }))
    .sort((a, b) => a.move - b.move)
    .slice(0, 4)
  for (const { s, move } of shuffleCopy(studyOptions, seed + 1)) {
    const avail = budget - cursor - move - backFrom(s)
    if (avail < STUDY_MIN) continue
    const reserve = avail >= STUDY_MAX + 30 ? 30 : 0
    // 두 개(마감 1·2순위)를 같이 하면 학습 블록을 늘려 각각 최소 시간 확보
    const pair = works.length > 1 && avail >= STUDY_MIN * 2
    const cap = pair ? STUDY_MAX + 30 : STUDY_MAX
    const stay = Math.max(STUDY_MIN, Math.min(cap, avail - (pair ? 0 : reserve)))
    if (!isOpenDuring(s, addMinutes(now, cursor + move), stay)) continue
    if (!works.length) {
      push(s, move, stay, '지난 수업 복습', '복습')
    } else if (pair) {
      const first = Math.max(STUDY_MIN, Math.round(stay * 0.55))
      push(s, move, first, `「${works[0].label}」 ${works[0].noun}(${works[0].dueText} 마감)`, works[0].noun)
      push(s, 0, stay - first, `「${works[1].label}」 ${works[1].noun}(${works[1].dueText} 마감)`, works[1].noun)
    } else {
      push(s, move, stay, `「${works[0].label}」 ${works[0].noun}(${works[0].dueText} 마감)`, works[0].noun)
    }
    break
  }

  for (const a of shuffleCopy(leisureSpots, seed + 2)) {
    const move = legTo(a)
    if (cursor + move + a.stayMin + backFrom(a) > budget) continue
    if (!isOpenDuring(a, addMinutes(now, cursor + move), a.stayMin)) continue
    push(a, move, a.stayMin, a.hint || '잠깐 리프레시', a.name)
    break
  }

  if (steps.length < 2) return null

  const back = backFrom(prev)
  const arriveAt = cursor + back
  const leftover = budget + ARRIVE_BUFFER_MIN - arriveAt
  const items = steps.map((st) => ({
    name: `${hm(addMinutes(now, st.start))} ${st.spot.name}`,
    detail: `이동 ${st.move}분 · ${st.label} ${st.stay}분`,
    total: st.move + st.stay,
  }))
  items.push({
    name: `${hm(addMinutes(now, arriveAt))} ${nextRoom} 도착`,
    detail: `강의실까지 ${back}분`,
    total: back,
  })

  const order = steps.map((st) => st.tag).join(' → ')
  const body = `${order} 순서로 짜 봤어요. 이동·엘리베이터 시간까지 다 넣었어요.`
    + (leftover >= 5 ? ` 남는 ${leftover}분은 자유롭게 쓰세요!` : '')
  return { body, items }
}
