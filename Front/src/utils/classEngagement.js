/**
 * 수업 중 집중·성찰 체크인
 *
 * 노출 조건:
 * - 진행 중 수업의 [시작, 종료−30분) 구간
 * - GPS가 해당 수업 건물 반경 안
 *
 * 멘트 근거 (사용자 예시 문구 미사용):
 * - Harvard Bok Center: Quick Write / “Summarize in your own words”, “one question you still have”
 * - Yale Poorvu metacognition: “most difficult concept”, “something new you learned”
 * - Columbia CTL engaged lecturing: pause for reflection / main takeaways
 * - ASU Learning Hub: define a concept in your own words (every ~15 min)
 */

/** 본부동↔진리관 ≈136m — 150이면 옆 건물도 「도착」으로 오인 */
export const CLASS_BUILDING_RADIUS_M = 70
export const ENGAGEMENT_END_BUFFER_MIN = 30

/** @type {{ id: string, highlight: string, sub: string }[]} */
export const ENGAGEMENT_PROMPTS = [
  {
    id: 'own-words',
    highlight: '방금 들은 개념, 내 말로 한 줄이면?',
    sub: '친구에게 설명하듯 짧게 정리해 보면 기억이 오래가요.',
  },
  {
    id: 'main-idea',
    highlight: '지금까지 핵심 아이디어는 뭐였을까요?',
    sub: '강의 흐름을 한 문장으로 잡아 두면 필기가 훨씬 쉬워져요.',
  },
  {
    id: 'muddiest',
    highlight: '지금 가장 헷갈리는 부분은 어디인가요?',
    sub: '모호한 지점을 표시해 두면 질문하거나 복습할 때 바로 찾아요.',
  },
  {
    id: 'new-learn',
    highlight: '오늘 새로 알게 된 한 가지는?',
    sub: '작은 발견이라도 적어 두면 수업이 끝난 뒤에도 남아요.',
  },
  {
    id: 'connect',
    highlight: '이전 수업이랑 어떻게 이어지나요?',
    sub: '이미 아는 내용과 연결하면 새로운 개념이 덜 낯설어져요.',
  },
  {
    id: 'still-ask',
    highlight: '수업이 끝나기 전에 남길 질문은?',
    sub: '이해한 점과 남은 질문을 나눠 보면 다음 진도가 편해져요.',
  },
]

export function haversineMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

/** 지금 진행 중인 수업 (start ≤ now < end) */
export function pickOngoingClass(schedules = [], now = new Date()) {
  return (
    schedules.find((s) => {
      const start = new Date(s.startAt)
      const end = new Date(s.endAt)
      return start <= now && now < end
    }) || null
  )
}

function windDownCutoff(classItem, bufferMin = ENGAGEMENT_END_BUFFER_MIN) {
  const end = new Date(classItem.endAt)
  return new Date(end.getTime() - bufferMin * 60 * 1000)
}

/** 종료 30분 전을 제외한 수업 중 구간 (집중 체크인) */
export function isInEngagementWindow(classItem, now = new Date(), bufferMin = ENGAGEMENT_END_BUFFER_MIN) {
  if (!classItem?.startAt || !classItem?.endAt) return false
  const start = new Date(classItem.startAt)
  const end = new Date(classItem.endAt)
  if (!(start <= now && now < end)) return false
  const cutoff = windDownCutoff(classItem, bufferMin)
  // 수업이 30분 이하면 전체 구간을 체크인 구간으로 둠
  if (cutoff <= start) return now >= start && now < end
  return now >= start && now < cutoff
}

/** 수업 마치기 30분 전 ~ 종료 (일찍 끝났나요? 구간) */
export function isInWindDownWindow(classItem, now = new Date(), bufferMin = ENGAGEMENT_END_BUFFER_MIN) {
  if (!classItem?.startAt || !classItem?.endAt) return false
  const start = new Date(classItem.startAt)
  const end = new Date(classItem.endAt)
  if (!(start <= now && now < end)) return false
  const cutoff = windDownCutoff(classItem, bufferMin)
  if (cutoff <= start) return false
  return now >= cutoff && now < end
}

export function isNearBuilding(gps, building, radiusM = CLASS_BUILDING_RADIUS_M) {
  if (!gps || !building) return false
  // 데모 GPS 등 buildingId가 있으면 좌표 반경보다 건물 일치 우선
  if (gps.buildingId && building.id) {
    return gps.buildingId === building.id
  }
  const lat = Number(building.x)
  const lng = Number(building.y)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false
  if (!Number.isFinite(gps.lat) || !Number.isFinite(gps.lng)) return false
  return haversineMeters(gps.lat, gps.lng, lat, lng) <= radiusM
}

/** 같은 수업·시간대에 안정적으로 같은 멘트 (수분마다 순환) */
export function pickEngagementPrompt(classItem, now = new Date()) {
  const slot = Math.floor(now.getTime() / (7 * 60 * 1000))
  const seed = `${classItem?.id || classItem?.title || 'class'}-${slot}`
  let h = 0
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return ENGAGEMENT_PROMPTS[h % ENGAGEMENT_PROMPTS.length]
}
