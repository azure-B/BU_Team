const User = require('../models/User')

/**
 * @desc  전체 유저 조회
 * @route GET /api/users
 * @access Private/Admin
 */
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password')
    res.status(200).json({ success: true, count: users.length, data: users })
  } catch (error) {
    next(error)
  }
}

/**
 * @desc  단일 유저 조회
 * @route GET /api/users/:id
 * @access Private
 */
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) {
      return res.status(404).json({ success: false, message: '유저를 찾을 수 없습니다.' })
    }
    res.status(200).json({ success: true, data: user })
  } catch (error) {
    next(error)
  }
}

/**
 * @desc  유저 생성
 * @route POST /api/users
 * @access Public
 */
const createUser = async (req, res, next) => {
  try {
    const user = await User.create(req.body)
    res.status(201).json({ success: true, data: user })
  } catch (error) {
    next(error)
  }
}

/**
 * @desc  유저 수정
 * @route PUT /api/users/:id
 * @access Private
 */
const updateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
    if (!user) {
      return res.status(404).json({ success: false, message: '유저를 찾을 수 없습니다.' })
    }
    res.status(200).json({ success: true, data: user })
  } catch (error) {
    next(error)
  }
}

/**
 * @desc  유저 삭제
 * @route DELETE /api/users/:id
 * @access Private/Admin
 */
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id)
    if (!user) {
      return res.status(404).json({ success: false, message: '유저를 찾을 수 없습니다.' })
    }
    res.status(200).json({ success: true, message: '유저가 삭제되었습니다.' })
  } catch (error) {
    next(error)
  }
}

module.exports = { getUsers, getUserById, createUser, updateUser, deleteUser }
