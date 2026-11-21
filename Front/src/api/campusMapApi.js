import api from './index'

/**
 * 캠퍼스 지도·도보 API — 건물 목록과 동일하게 VITE_API_URL(배포 시 Render)을 따른다.
 * 서버 env: KAKAO_JAVASCRIPT_KEY, KAKAO_REST_API_KEY
 */
async function request(path, { method = 'GET', body, signal } = {}) {
  const result = method === 'POST'
    ? await api.post(`/campus${path}`, body, { signal })
    : await api.get(`/campus${path}`, { signal })
  return result.data
}

export const getMapConfig = (signal) => request('/map/config', { signal })
export const getMapBuildings = async (signal) => (await api.get('/campus/buildings', { signal })).data
export const getWalkingRoute = (origin, destination, signal) => request('/map/route', {
  method: 'POST',
  body: { origin, destination },
  signal,
})
