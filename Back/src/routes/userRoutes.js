const express = require('express')
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} = require('../controllers/userController')

const router = express.Router()

/* /api/users */
router.route('/').get(getUsers).post(createUser)

/* /api/users/:id */
router.route('/:id').get(getUserById).put(updateUser).delete(deleteUser)

module.exports = router
