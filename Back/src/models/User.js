const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

/**
 * User 모델 예시
 * 실제 프로젝트에 맞게 스키마를 수정하세요.
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, '이름은 필수입니다.'],
      trim: true,
      maxlength: [50, '이름은 50자 이하여야 합니다.'],
    },
    email: {
      type: String,
      required: [true, '이메일은 필수입니다.'],
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, '올바른 이메일 형식이 아닙니다.'],
    },
    password: {
      type: String,
      required: [true, '비밀번호는 필수입니다.'],
      minlength: [6, '비밀번호는 6자 이상이어야 합니다.'],
      select: false, // 기본 쿼리에서 제외
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
  },
  {
    timestamps: true, // createdAt, updatedAt 자동 생성
  },
)

/* 저장 전 비밀번호 해시 */
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 12)
  next()
})

/* 비밀번호 비교 인스턴스 메서드 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

module.exports = mongoose.model('User', userSchema)
