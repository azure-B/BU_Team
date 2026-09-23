/**
 * 표준 API 응답 헬퍼
 * 컨트롤러에서 일관된 응답 구조를 유지하는 데 사용합니다.
 */

const sendSuccess = (res, data, statusCode = 200, message = 'success') => {
  const body = { success: true, message }
  if (Array.isArray(data)) {
    body.count = data.length
    body.data = data
  } else if (data !== undefined) {
    body.data = data
  }
  return res.status(statusCode).json(body)
}

const sendError = (res, message = '오류가 발생했습니다.', statusCode = 500) => {
  return res.status(statusCode).json({ success: false, message })
}

module.exports = { sendSuccess, sendError }
