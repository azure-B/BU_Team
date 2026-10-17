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
 * 날짜 범위별 일정(시간표) 목록 조회
 */
export const getNotices = async (limit = 5) => {
  return api.get('/notices', { params: { limit } })
}

export const getSchedules = async (from, to) => {
  const params = {}
  if (from) params.from = from
  if (to) params.to = to
  const res = await api.get('/schedules', { params })
  return res.data
}

/**
 * 캠퍼스 동선 및 지각 위험도 계산
 */
export const getRouteAndLateness = async (currentBuildingId, nextClassBuildingId, nextClassStartAt) => {
  const res = await api.post('/campus/route/lateness', {
    currentBuildingId,
    nextClassBuildingId,
    nextClassStartAt,
  })
  return res.data
}
