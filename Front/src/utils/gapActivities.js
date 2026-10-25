/**
 * 다음 수업까지 틈새 활동 분석
 *
 * - 표시 여유 = (다음 수업까지) − (현재→다음 강의실 도보 + 엘리베이터)
 * - 모든 이동: 지금 건물에서 내려오는 엘리베이터 + 도보 + 목적지가 3층 이상이면 엘리베이터
 * - 여유 짧음(<25분): 바로 강의실로 이동해 과제 먼저
 * - 여유 보통: 식사 / 과제(학습 공간) / 캠퍼스 활동 중 하나 랜덤
 * - 여유 넉넉(≥90분): 식사 → 과제·사이버강의(마감 순 1~2개) → 캠퍼스 활동 코스
 * - 과제·사이버강의 순서: 마감 빠른 순, 같은 날 마감이면 전공 먼저
 * - 식사: 메뉴 대기는 장소별(안골·기숙사 0, 교수회관 5, 일반 10~15) + 식사 20분
 * - 학식은 11:00~13:30 도착, 밥 추천은 11~14시
 * - 시간 촉박한데 밥이 필요하면 교내 편의점(대기 0 · 간단 식사 ~10분)
 */

import { CAMPUS_ACTIVITIES, CAMPUS_SPOTS, STUDY_LOUNGES } from '../data/campusSpots'
import { haversineMeters } from './classEngagement'
import { isCyberLecture, makeDeadlineComparator } from './courseCategory'

export const MEAL_EAT_MIN = 20
export const CVS_EAT_MIN = 10
export const FOOD_READY_MIN_LO = 10
export const FOOD_READY_MIN_HI = 15
/** 여유 이하면 정식 식당 대신 편의점 우선 */
const CVS_PRIORITY_GAP_MIN = 40

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

/** 다른 코스 추천 시 랜덤 테마 */
export const PLAN_STYLES = ['meal', 'task', 'leisure', 'balanced']
export const PLAN_STYLE_LABEL = {
  meal: '식사 여유',
  task: '과제 집중',
  leisure: '산책·휴식',
  balanced: '골고루',
}

export function pickPlanStyle(seed = Date.now()) {
  return PLAN_STYLES[Math.abs(seed) % PLAN_STYLES.length]
}

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

/** 장소별 메뉴 대기(분). readyMin 지정 시 고정, 없으면 10~15 랜덤 */
export function mealReadyMinutes(spot, seed = Date.now()) {
  if (spot && Number.isFinite(spot.readyMin)) return Math.max(0, Number(spot.readyMin))
  if (spot?.type === 'cvs') return 0
  return foodReadyMinutes(seed)
}

function mealEatMinutes(spot, style = 'balanced') {
  let eat = spot?.type === 'cvs'
    ? (Number.isFinite(spot.eatMin) ? spot.eatMin : CVS_EAT_MIN)
    : MEAL_EAT_MIN
  if (style === 'meal') eat += spot?.type === 'cvs' ? 5 : 15 // 식사 여유 코스
  if (style === 'task' && spot?.type !== 'cvs') eat = Math.max(15, eat - 5)
  return eat
}

function mealStayMinutes(spot, seed, style = 'balanced') {
  return mealReadyMinutes(spot, seed) + mealEatMinutes(spot, style)
}

function mealBodyCopy({ toFood, ready, eat, toNext, isCvs }) {
  if (isCvs) {
    return `가는 길 ${toFood}분, 편의점에서 간단히 ${eat}분이면 충분하고, 강의실까진 ${toNext}분이 걸려요!`
  }
  if (ready <= 0) {
    return `가는 길 ${toFood}분, 메뉴 대기 없이 식사 ${eat}분이 예상되며, 강의실까진 ${toNext}분이 걸려요!`
  }
  return `가는 길 ${toFood}분, 메뉴 대기 ${ready}분, 식사 ${eat}분이 예상되며, 강의실까진 ${toNext}분이 걸려요!`
}

/** 코스 상세는 뒤에 ` ${stay}분`을 붙이므로, 여기선 분 숫자를 넣지 않음 */
function mealStayLabel(spot, seed, style = 'balanced') {
  const ready = mealReadyMinutes(spot, seed)
  const eat = mealEatMinutes(spot, style)
  if (spot?.type === 'cvs') return '편의점 간단 식사'
  if (ready <= 0) return '메뉴 대기 없이 식사'
  return `메뉴 대기 ${ready}분 + 식사 ${eat}분`
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
  /** 다른 코스 추천용: meal | task | leisure | balanced */
  planStyle = null,
  /** 다시 뽑기마다 올리는 시드 */
  seedSalt = 0,
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
  const style = PLAN_STYLES.includes(planStyle) ? planStyle : pickPlanStyle(seedSalt || Date.now())

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

  const seed = Math.floor(now.getTime() / (5 * 60 * 1000))
    + String(nextClass.id || nextClass.title || '').length
    + Number(seedSalt || 0) * 97
  const styleMeta = { planStyle: style, planStyleLabel: PLAN_STYLE_LABEL[style] || '골고루' }
  const allSpots = [...CAMPUS_SPOTS, ...facilitiesAsSpots(facilities, buildings)]
    .map((s) => withPoint(s, buildings))
    .filter(Boolean)
  const mealOk = shouldSuggestMeal(now, previousClassEndAt)
  const mealPlaces = allSpots
    .filter((s) => s.type === 'cafeteria' || s.type === 'restaurant')
    .map((s) => ({ ...s, isMeal: true }))
  const cvsPlaces = allSpots
    .filter((s) => s.type === 'cvs')
    .map((s) => ({ ...s, isMeal: true }))

  const mealTitle = (r) => (r.quips?.length
    ? pickRandom(r.quips, seed + r.name.length)
    : pickRandom(MEAL_TITLES, seed + r.name.length)(r.name))

  /** 촉박한데 밥이 필요하면 교내 편의점 */
  const pickCvsMeal = () => {
    if (!mealOk || !cvsPlaces.length) return null
    const fitted = cvsPlaces
      .map((r) => {
        const ready = mealReadyMinutes(r, seed)
        const eat = mealEatMinutes(r, style)
        const stay = ready + eat
        const toFood = model.fromOrigin(r)
        const toNext = model.toNext(r)
        const total = toFood + stay + toNext
        if (total > budget) return null
        return { r, ready, eat, stay, toFood, toNext, total }
      })
      .filter(Boolean)
      .sort((a, b) => a.total - b.total)
    if (!fitted.length) return null
    const pick = pickRandom(fitted.slice(0, 3), seed)
    return {
      kind: 'meal',
      title: mealTitle(pick.r),
      body: mealBodyCopy({
        toFood: pick.toFood,
        ready: pick.ready,
        eat: pick.eat,
        toNext: pick.toNext,
        isCvs: true,
      }),
      ...header,
      ...styleMeta,
      items: [{
        name: pick.r.name,
        detail: `${pick.r.blurb || '교내 편의점'} · 이동 ${pick.toFood}분 · ${mealStayLabel(pick.r, seed, style)} · 다음 강의 ${pick.toNext}분`,
        total: pick.total,
      }],
    }
  }

  if (freeGap < SHORT_GAP_MIN) {
    const cvs = pickCvsMeal()
    if (cvs) return cvs
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

  if (freeGap >= LONG_GAP_MIN) {
    const plan = buildPlan({
      now, seed, budget, model, mealOk, mealPlaces, cvsPlaces, studySpots, leisureSpots, works, nextRoom, style,
    })
    if (plan) {
      return {
        kind: 'plan',
        title: pickRandom(PLAN_TITLES, seed)(freeGap),
        body: plan.body,
        ...header,
        ...styleMeta,
        items: plan.items,
      }
    }
  }

  const candidates = []
  const preferCvs = mealOk && freeGap < CVS_PRIORITY_GAP_MIN && style !== 'meal'
  const mealWeight = style === 'meal' ? 5 : style === 'task' ? 1 : 2
  const taskWeight = style === 'task' ? 5 : style === 'leisure' ? 1 : 3
  const leisureWeight = style === 'leisure' ? 5 : style === 'meal' ? 1 : 1

  // —— 식사 (학식·식당 + 촉박하면 편의점)
  if (mealOk && style !== 'task') {
    for (const r of mealPlaces) {
      const ready = mealReadyMinutes(r, seed)
      const eat = mealEatMinutes(r, style)
      const stay = ready + eat
      const toFood = model.fromOrigin(r)
      const toNext = model.toNext(r, UPHILL_RETURN_EXTRA_MIN)
      const total = toFood + stay + toNext
      if (total > budget) continue
      if (r.type === 'cafeteria' && !canVisitCafeteria(now, toFood)) continue
      candidates.push({
        weight: preferCvs ? 1 : mealWeight + (r.type === 'cafeteria' ? 1 : 0),
        payload: {
          kind: 'meal',
          title: mealTitle(r),
          body: mealBodyCopy({ toFood, ready, eat, toNext, isCvs: false }),
          ...header,
          ...styleMeta,
          items: [{ name: r.name, detail: `${r.blurb || ''} · ${mealStayLabel(r, seed, style)} · 총 약 ${total}분`.trim(), total }],
        },
      })
    }
    if (preferCvs || style === 'balanced' || !candidates.some((c) => c.payload.kind === 'meal')) {
      for (const r of cvsPlaces) {
        const ready = mealReadyMinutes(r, seed)
        const eat = mealEatMinutes(r, style)
        const stay = ready + eat
        const toFood = model.fromOrigin(r)
        const toNext = model.toNext(r)
        const total = toFood + stay + toNext
        if (total > budget) continue
        candidates.push({
          weight: preferCvs ? 4 : Math.max(1, mealWeight - 1),
          payload: {
            kind: 'meal',
            title: mealTitle(r),
            body: mealBodyCopy({ toFood, ready, eat, toNext, isCvs: true }),
            ...header,
            ...styleMeta,
            items: [{
              name: r.name,
              detail: `${r.blurb || '교내 편의점'} · ${mealStayLabel(r, seed, style)} · 총 약 ${total}분`,
              total,
            }],
          },
        })
      }
    }
  }

  // —— 과제 + 학습 공간
  if (taskLabel && freeGap >= 18 && style !== 'leisure') {
    const spots = studySpots
      .map((s) => {
        const moveIn = model.fromOrigin(s) + (s.indoor || 0)
        const toNext = model.toNext(s)
        const studyBlock = Math.min(style === 'task' ? 55 : 40, budget - moveIn - toNext)
        if (studyBlock < 12) return null
        if (!isOpenDuring(s, addMinutes(now, moveIn), studyBlock)) return null
        return { ...s, moveIn, toNext, studyBlock, total: moveIn + studyBlock + toNext }
      })
      .filter(Boolean)
      .sort((a, b) => a.moveIn - b.moveIn)

    if (spots.length) {
      candidates.push({
        weight: taskWeight,
        payload: {
          kind: 'task',
          title: `「${taskLabel}」 ${workNoun}, 미리 ${workIsCyber ? '들어보시는' : '해보시는'} 것 어떠세요?`,
          body: works.length > 1
            ? `마감 순서: ${works.map((w) => `「${w.label}」 ${w.noun}(${w.dueText})`).join(' → ')}. 근처 학습·휴게 공간에서 먼저 것부터 진도 내 보세요.`
            : `${works[0].dueText} 마감이에요. 근처 학습·휴게 공간에서 짧게 진도 내 보세요.`,
          ...header,
          ...styleMeta,
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
  const leisureBoost = style === 'leisure' ? 1.6 : 1
  const leisure = leisureSpots
    .map((s) => {
      const stayMin = Math.round((s.stayMin || 12) * leisureBoost)
      const toSpot = model.fromOrigin(s)
      const toNext = model.toNext(s)
      const total = toSpot + stayMin + toNext
      if (total > budget) return null
      if (!isOpenDuring(s, addMinutes(now, toSpot), stayMin)) return null
      return { ...s, stayMin, toSpot, toNext, total }
    })
    .filter(Boolean)

  if (leisure.length) {
    const pick = pickRandom(shuffleCopy(leisure, seed), seed)
    candidates.push({
      weight: leisureWeight,
      payload: {
        kind: 'activity',
        title: pick.title || `${pick.name} 들러볼까요?`,
        body: `가는 길 ${pick.toSpot}분, ${pick.stayMin}분 정도 즐기고, 강의실까진 ${pick.toNext}분이 걸려요!`,
        ...header,
        ...styleMeta,
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
      ...styleMeta,
    }
  }

  // 가중 랜덤: 테마에 맞게
  const weighted = []
  for (const c of shuffleCopy(candidates, seed)) {
    for (let i = 0; i < c.weight; i += 1) weighted.push(c.payload)
  }
  return pickRandom(weighted, seed) || candidates[0].payload
}

/**
 * 넉넉한 공강 코스 — style에 따라 식사/과제/산책 비중 변경
 */
function buildPlan({
  now, seed, budget, model, mealOk, mealPlaces, cvsPlaces = [], studySpots, leisureSpots, works = [], nextRoom,
  style = 'balanced',
}) {
  const steps = []
  let cursor = 0
  let prev = null

  const legTo = (spot) => (prev
    ? model.between(prev, spot, prev.isMeal ? UPHILL_RETURN_EXTRA_MIN : 0)
    : model.fromOrigin(spot)) + (spot.indoor || 0)
  const backFrom = (spot) => model.toNext(spot, spot.isMeal && spot.type !== 'cvs' ? UPHILL_RETURN_EXTRA_MIN : 0)
  const push = (spot, move, stay, label, tag) => {
    const start = cursor + move
    steps.push({ spot, move, stay, label, start, tag })
    cursor = start + stay
    prev = spot
  }

  const doMeal = mealOk && style !== 'task'
  const doStudy = style !== 'leisure'
  const doLeisure = style !== 'task' || style === 'balanced'

  if (doMeal) {
    // 식사 여유: 식당 우선 / 과제 집중: 편의점만 짧게 / 골고루: 혼합
    const pool = style === 'meal'
      ? [...mealPlaces, ...cvsPlaces]
      : style === 'leisure'
        ? [...cvsPlaces, ...mealPlaces]
        : [...mealPlaces, ...cvsPlaces]
    for (const m of shuffleCopy(pool, seed)) {
      const move = legTo(m)
      const stay = mealStayMinutes(m, seed, style)
      if (m.type === 'cafeteria' && !canVisitCafeteria(now, cursor + move)) continue
      if (cursor + move + stay + backFrom(m) > budget) continue
      push(m, move, stay, mealStayLabel(m, seed, style), m.type === 'cvs' ? '편의점' : '식사')
      break
    }
  }

  // 산책 우선이면 학습 전에 휴식 먼저
  const pushLeisure = (seedOff) => {
    const boost = style === 'leisure' ? 1.8 : 1
    for (const a of shuffleCopy(leisureSpots, seed + seedOff)) {
      const stay = Math.round((a.stayMin || 12) * boost)
      const move = legTo(a)
      if (cursor + move + stay + backFrom(a) > budget) continue
      if (!isOpenDuring(a, addMinutes(now, cursor + move), stay)) continue
      push(a, move, stay, a.hint || '잠깐 리프레시', a.name)
      return true
    }
    return false
  }

  if (style === 'leisure') pushLeisure(2)

  if (doStudy) {
    const studyCap = style === 'task' ? STUDY_MAX + 25 : style === 'meal' ? STUDY_MAX - 10 : STUDY_MAX
    const studyMin = style === 'task' ? STUDY_MIN : Math.max(20, STUDY_MIN - 5)
    const studyOptions = studySpots
      .map((s) => ({ s, move: legTo(s) }))
      .sort((a, b) => a.move - b.move)
      .slice(0, 4)
    for (const { s, move } of shuffleCopy(studyOptions, seed + 1)) {
      const avail = budget - cursor - move - backFrom(s)
      if (avail < studyMin) continue
      const reserve = style === 'task' ? 0 : (avail >= studyCap + 30 ? 30 : 0)
      const pair = works.length > 1 && avail >= studyMin * 2 && style !== 'meal'
      const cap = pair ? studyCap + 30 : studyCap
      const stay = Math.max(studyMin, Math.min(cap, avail - (pair ? 0 : reserve)))
      if (!isOpenDuring(s, addMinutes(now, cursor + move), stay)) continue
      if (!works.length) {
        push(s, move, stay, '지난 수업 복습', '복습')
      } else if (pair) {
        const first = Math.max(studyMin, Math.round(stay * 0.55))
        push(s, move, first, `「${works[0].label}」 ${works[0].noun}(${works[0].dueText} 마감)`, works[0].noun)
        push(s, 0, stay - first, `「${works[1].label}」 ${works[1].noun}(${works[1].dueText} 마감)`, works[1].noun)
      } else {
        push(s, move, stay, `「${works[0].label}」 ${works[0].noun}(${works[0].dueText} 마감)`, works[0].noun)
      }
      break
    }
  }

  if (doLeisure && style !== 'leisure') pushLeisure(3)
  if (style === 'leisure' && steps.filter((s) => s.tag !== '편의점' && s.tag !== '식사').length < 1) {
    pushLeisure(5)
  }

  if (steps.length < 2) return null

  const back = backFrom(prev)
  const arriveAt = cursor + back
  const leftover = budget + ARRIVE_BUFFER_MIN - arriveAt
  const items = steps.map((st) => {
    // 라벨에 이미 「식사 N분」이 있으면 stay분 중복 표기 방지
    const labelHasDuration = /\d+\s*분/.test(st.label) && /식사/.test(st.label)
    const detail = labelHasDuration
      ? `이동 ${st.move}분 · ${st.label}`
      : `이동 ${st.move}분 · ${st.label} ${st.stay}분`
    return {
      name: `${hm(addMinutes(now, st.start))} ${st.spot.name}`,
      detail,
      total: st.move + st.stay,
    }
  })
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

const DAY_WRAP_TITLES = [
  () => '수업이 끝난 뒤에 이건 어때요?',
  () => '오늘 수업은 여기까지! 남는 시간에 이렇게 해볼까요?',
  () => '다음 수업 없는 날이에요. 밥·과제부터 골라봐요',
]

/** 저녁 식사 추천 구간 */
const DINNER_FROM = 17 * 60
const DINNER_TO = 20 * 60

/**
 * 오늘 남은 수업이 없을 때 — 밥·사이버강의·과제·캠퍼스 활동 유도
 * (다음 강의실 이동 제약 없음)
 */
export function analyzeDayWrapActivity({
  now = new Date(),
  previousClassEndAt = null,
  origin = null,
  tasks = [],
  facilities = [],
  buildings = [],
  planStyle = null,
  seedSalt = 0,
} = {}) {
  const style = PLAN_STYLES.includes(planStyle) ? planStyle : pickPlanStyle(seedSalt || Date.now())
  const styleMeta = { planStyle: style, planStyleLabel: PLAN_STYLE_LABEL[style] || '골고루' }
  const seed = Math.floor(now.getTime() / (5 * 60 * 1000)) + Number(seedSalt || 0) * 97
  const works = toWorkItems(pickRelevantTasks(tasks, now), now, 3)
  const hour = minutesOfDay(now)
  const mealLunch = shouldSuggestMeal(now, previousClassEndAt)
  const mealDinner = hour >= DINNER_FROM && hour < DINNER_TO
  const mealOk = mealLunch || mealDinner

  const originPoint = origin && Number.isFinite(origin.lat) ? origin : null
  const model = createLegModel({ origin, originPoint, nextPoint: null, routeTimes: null })

  const allSpots = [...CAMPUS_SPOTS, ...facilitiesAsSpots(facilities, buildings)]
    .map((s) => withPoint(s, buildings))
    .filter(Boolean)
  const mealPlaces = allSpots
    .filter((s) => s.type === 'cafeteria' || s.type === 'restaurant')
    .map((s) => ({ ...s, isMeal: true }))
  const cvsPlaces = allSpots
    .filter((s) => s.type === 'cvs')
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
    ...allSpots.filter((s) => s.type === 'park' || s.type === 'cafe'),
  ]

  const items = []
  const tags = []

  if (mealOk && style !== 'task') {
    const pool = style === 'meal'
      ? [...mealPlaces, ...cvsPlaces]
      : [...mealPlaces, ...cvsPlaces]
    const fitted = shuffleCopy(pool, seed)
      .map((r) => {
        const toFood = model.fromOrigin(r)
        if (r.type === 'cafeteria' && !canVisitCafeteria(now, toFood)) return null
        const stay = mealStayMinutes(r, seed, style)
        return { r, toFood, stay }
      })
      .filter(Boolean)
      .sort((a, b) => a.toFood - b.toFood)
    const pick = fitted[0]
    if (pick) {
      const mealNoun = mealDinner ? '저녁' : '식사'
      items.push({
        name: pick.r.name,
        detail: `${pick.r.blurb || mealNoun} · 이동 ${pick.toFood}분 · ${mealStayLabel(pick.r, seed, style)}`,
      })
      tags.push(pick.r.type === 'cvs' ? '편의점' : mealNoun)
    }
  }

  if (works.length && style !== 'leisure') {
    const study = shuffleCopy(studySpots, seed + 1)
      .map((s) => ({ s, move: model.fromOrigin(s) }))
      .sort((a, b) => a.move - b.move)[0]
    const limit = style === 'task' ? 3 : 2
    works.slice(0, limit).forEach((w, i) => {
      const place = study
        ? ` · ${study.s.name}까지 ${study.move}분`
        : ''
      items.push({
        name: `「${w.label}」 ${w.noun}`,
        detail: `${w.dueText} 마감${i === 0 ? place : ''} · ${w.cyber ? '출석 영상부터 틀어볼까요?' : '지금 조금만이라도 손대 볼까요?'}`,
      })
      tags.push(w.noun)
    })
  }

  if ((style === 'leisure' || style === 'balanced' || !works.length) && leisureSpots.length) {
    const a = pickRandom(shuffleCopy(leisureSpots, seed + 3).slice(0, 4), seed + 5)
    if (a && !items.some((it) => it.name === a.name)) {
      const move = model.fromOrigin(a)
      items.push({
        name: a.name,
        detail: `${a.hint || a.blurb || '잠깐 리프레시'} · 이동 ${move}분 · 약 ${a.stayMin || 15}분`,
      })
      tags.push('휴식')
    }
  }

  const title = pickRandom(DAY_WRAP_TITLES, seed)()
  if (!items.length) {
    return {
      kind: 'day-wrap',
      title,
      body: '오늘 남은 수업은 없어요. 푹 쉬어도 좋고, 주간 시간표에서 내일 일정을 미리 봐 두세요.',
      ...styleMeta,
    }
  }

  const order = tags.length ? `${tags.join(' → ')} 순으로 짜 봤어요. ` : ''
  const workHint = works.length
    ? (works.some((w) => w.cyber)
      ? '사이버강의·과제가 남아 있으면 지금이 제일 편해요.'
      : '밀린 과제부터 손대 두면 저녁이 한결 가벼워져요.')
    : '오늘은 과제 압박이 덜하니 쉬어 가도 괜찮아요.'

  return {
    kind: 'day-wrap',
    title,
    body: `${order}${workHint}`,
    ...styleMeta,
    items,
  }
}
