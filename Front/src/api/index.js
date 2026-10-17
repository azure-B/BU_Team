import axios from 'axios'

/**
 * Axios 인스턴스
 * baseURL은 .env의 VITE_API_URL을 사용
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

/* 요청 인터셉터 - 토큰 자동 첨부 */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

/* 응답 인터셉터 - 공통 에러 처리 */
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || error.message || '서버 오류가 발생했습니다.'
    return Promise.reject(new Error(message))
  },
)

export default api

export async function getCourseCatalog({ signal } = {}) {
  const courses = []
  const limit = 300
  let total = Infinity
  while (courses.length < total) {
    const result = await api.get('/courses', { params: { limit, offset: courses.length }, signal })
    if (!result.success || !Array.isArray(result.courses)) throw new Error('개설 강의 응답을 확인할 수 없습니다.')
    courses.push(...result.courses)
    total = Number(result.total)
    if (!Number.isFinite(total) || result.courses.length < limit) break
  }
  return courses
}
