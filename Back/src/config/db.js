const mongoose = require('mongoose')

/**
 * MongoDB 연결
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI)
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`)
  } catch (error) {
    console.error(`❌ MongoDB 연결 실패: ${error.message}`)
    process.exit(1)
  }
}

module.exports = connectDB
