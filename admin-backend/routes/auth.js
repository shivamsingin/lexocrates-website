const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  register,
  login,
  getMe,
  updateProfile,
  getUsers,
  updateUser,
  deleteUser
} = require('../controllers/authController');

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

// Admin routes
router.get('/users', protect, authorize('admin'), getUsers);
router.put('/users/:id', protect, authorize('admin'), updateUser);
router.delete('/users/:id', protect, authorize('admin'), deleteUser);

module.exports = router;
