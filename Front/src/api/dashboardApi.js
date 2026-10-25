import api from './index'

/**
 * 대시보드 통합 데이터 조회
 */
export const getTodayDashboard = async () => {
  const res = await api.get('/dashboard/today')
  return res.data
}

/**
 * 조장님 계산 모듈 기반 '오늘의 할 일 Top 3' 조회
 */
export const getPrioritizedTasks = async () => {
  const res = await api.get('/tasks/today/recommendations')
  return res.data
}

/**
 * 전체 과제 목록 조회
 */
export const getTasks = async () => {
  const res = await api.get('/tasks')
  return res.data
}

/**
 * 과제 생성
 */
export const createTask = async (taskData) => {
  const res = await api.post('/tasks', taskData)
  return res.data
}

/**
 * 주요 공지사항 목록 조회
 */
export const getNotices = async (limit = 5) => {
  return api.get('/notices', { params: { limit } })
}

/**
 * 날짜 범위별 일정(시간표) 목록 조회
 */
export const getSchedules = async (from, to) => {
  const params = {}
  if (from) params.from = from
  if (to) params.to = to
  const res = await api.get('/schedules', { params })
  return res.data
}

/**
 * 일정 추가 (서버 DB 등록)
 */
export const createSchedule = async (scheduleData) => {
  const res = await api.post('/schedules', scheduleData)
  return res.data
}

/**
 * 일정 수정
 */
export const updateSchedule = async (id, scheduleData) => {
  const res = await api.patch(`/schedules/${id}`, scheduleData)
  return res.data
}

/**
 * 일정 삭제
 */
export const deleteSchedule = async (id) => {
  const res = await api.delete(`/schedules/${id}`)
  return res.data
}

/**
 * 특정 일정(수업)에 연계된 과제 목록 조회 (일정 ↔ 과제 연계 기능)
 */
export const getScheduleTasks = async (scheduleId) => {
  const res = await api.get(`/schedules/${scheduleId}/tasks`)
  return res.data
}

/**
 * 캠퍼스 동선 및 지각 위험도 계산
 * GPS(lat/lng) 우선 — 카카오 도보(서버) + CampusEdge + 엘리베이터 반영
 */
export const getRouteAndLateness = async ({
  currentBuildingId,
  lat,
  lng,
  nextClassBuildingId,
  nextClassStartAt,
  nowAt,
} = {}) => {
  const body = { nextClassBuildingId, nextClassStartAt }
  if (currentBuildingId) body.currentBuildingId = currentBuildingId
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    body.lat = lat
    body.lng = lng
  }
  if (nowAt) body.nowAt = nowAt
  const res = await api.post('/campus/route/lateness', body)
  return res.data
}

/** 건물 목록 */
export const getBuildings = async () => {
  const res = await api.get('/campus/buildings')
  return Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []
}

/** 캠퍼스 시설 (학식·카페 등) */
export const getFacilities = async (type) => {
  const res = await api.get('/campus/facilities', { params: type ? { type } : {} })
  return Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []
}
