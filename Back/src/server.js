require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')

const connectDB = require('./config/db')
const userRoutes = require('./routes/userRoutes')
const errorHandler = require('./middlewares/errorHandler')
const notFound = require('./middlewares/notFound')

/* ── DB 연결 ── */
connectDB()

const app = express()

/* ── 보안 / 파싱 미들웨어 ── */
app.use(helmet())
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

/* ── 로거 (개발 환경에서만) ── */
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'))
}

/* ── Health Check ── */
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', env: process.env.NODE_ENV })
})

/* ── API Routes ── */
app.use('/api/users', userRoutes)
// 새 라우터 추가 예시: app.use('/api/posts', postRoutes)

/* ── 404 / 에러 핸들러 (반드시 라우터 뒤에 위치) ── */
app.use(notFound)
app.use(errorHandler)

/* ── 서버 시작 ── */
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${PORT} [${process.env.NODE_ENV}]`)
})
