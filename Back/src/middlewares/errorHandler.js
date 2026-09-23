/**
 * 전역 에러 핸들링 미들웨어
 * next(error) 로 전달된 모든 에러를 처리합니다.
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500
  let message = err.message || '서버 내부 오류'

  /* Mongoose CastError (잘못된 ObjectId) */
  if (err.name === 'CastError') {
    statusCode = 400
    message = '잘못된 ID 형식입니다.'
  }

  /* Mongoose 중복 키 */
  if (err.code === 11000) {
    statusCode = 400
    const field = Object.keys(err.keyValue)[0]
    message = `이미 사용 중인 ${field}입니다.`
  }

  /* Mongoose 유효성 검사 */
  if (err.name === 'ValidationError') {
    statusCode = 400
    message = Object.values(err.errors).map((e) => e.message).join(', ')
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
}

module.exports = errorHandler
