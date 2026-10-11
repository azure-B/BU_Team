import api from './index'

/**
 * 로그인 API
 */
export const login = async (studentId, password) => {
  const res = await api.post('/auth/login', { studentId, password })
  if (res.data?.token) {
    localStorage.setItem('token', res.data.token)
    if (res.data.user) {
      localStorage.setItem('user', JSON.stringify(res.data.user))
    }
  }
  return res.data
}

/**
 * 회원가입 API
 */
export const register = async (userData) => {
  const res = await api.post('/auth/register', userData)
  return res.data
}

/**
 * 로그아웃
 */
export const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

/**
 * 현재 로그인 유저 정보 조회
 */
export const getCurrentUser = () => {
  try {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}
