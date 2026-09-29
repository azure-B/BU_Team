/**
 * 전역 에러 핸들링 미들웨어
 * next(error) 로 전달된 모든 에러를 처리합니다.
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500
  let message = err.message || '서버 내부 오류'

  /* Supabase (PostgreSQL) 고유키 중복 에러 */
  if (err.code === '23505') {
    statusCode = 400
    message = '이미 사용 중인 데이터입니다. (중복값 오류)'
  }

  /* Supabase (PostgreSQL) 유효성/제약조건 오류 */
  if (err.code === '23502' || err.code === '23503' || err.code === '23514') {
    statusCode = 400
    message = '필수 데이터가 누락되었거나 제약 조건을 위반했습니다.'
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack, details: err.details || err.hint }),
  })
}

module.exports = errorHandler
