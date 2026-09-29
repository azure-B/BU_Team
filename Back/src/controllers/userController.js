const supabase = require('../config/supabase')

/**
 * @desc  전체 유저 조회
 * @route GET /api/users
 * @access Private/Admin
 */
const getUsers = async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('users').select('*')
    if (error) throw error
    res.status(200).json({ success: true, count: data.length, data })
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
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.params.id)
      .single()
    
    // PGRST116: 결과를 찾지 못함
    if (error && error.code !== 'PGRST116') throw error
    if (!data) {
      return res.status(404).json({ success: false, message: '유저를 찾을 수 없습니다.' })
    }
    res.status(200).json({ success: true, data })
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
    const { data, error } = await supabase
      .from('users')
      .insert(req.body)
      .select()
      .single()
    if (error) throw error
    res.status(201).json({ success: true, data })
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
    const { data, error } = await supabase
      .from('users')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single()
    if (error) throw error
    res.status(200).json({ success: true, data })
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
    const { data, error } = await supabase
      .from('users')
      .delete()
      .eq('id', req.params.id)
      .select()
      
    if (error) throw error
    if (data.length === 0) {
      return res.status(404).json({ success: false, message: '유저를 찾을 수 없습니다.' })
    }
    res.status(200).json({ success: true, message: '유저가 삭제되었습니다.' })
  } catch (error) {
    next(error)
  }
}

module.exports = { getUsers, getUserById, createUser, updateUser, deleteUser }
