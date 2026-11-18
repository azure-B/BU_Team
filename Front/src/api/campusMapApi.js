import api from './index'

// 로컬 지도 API는 로컬 백엔드로, 배포 시에는 공통 API 서버로 연결한다.
async function request(path, options = {}) {
  if (!import.meta.env.DEV) {
    const result = options.body ? await api.post(`/campus${path}`, JSON.parse(options.body), { signal: options.signal }) : await api.get(`/campus${path}`, { signal: options.signal })
    return result.data
  }
  const response = await fetch(`/campus-api${path}`, {
    ...options, headers: { 'Content-Type': 'application/json' },
    signal: options.signal ? AbortSignal.any([options.signal, AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000),
  })
  const body = await response.json().catch(() => null)
  if (!response.ok || !body?.success) throw new Error(body?.message || '캠퍼스 API에 연결하지 못했습니다.')
  return body.data
}

export const getMapConfig = (signal) => request('/map/config', { signal })
// 건물 목록은 다른 기존 화면과 동일한 배포/로컬 공통 API 설정을 따른다.
export const getMapBuildings = async (signal) => (await api.get('/campus/buildings', { signal })).data
export const getWalkingRoute = (origin, destination, signal) => request('/map/route', {
  method: 'POST', body: JSON.stringify({ origin, destination }), signal,
})
