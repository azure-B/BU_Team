/**
 * 등록되지 않은 라우트 처리
 * @route 모든 미처리 요청
 */
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.method} ${req.originalUrl}`)
  error.statusCode = 404
  next(error)
}

module.exports = notFound
