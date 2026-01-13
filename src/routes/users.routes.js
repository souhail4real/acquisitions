import express from 'express';
import {
  authenticateToken,
  authorizeRole,
} from '#middleware/auth.middleware.js';
import {
  getUsers,
  getUser,
  updateUserController,
  deleteUserController,
} from '#controllers/users.controller.js';

const router = express.Router();

// All users routes require authentication
router.use(authenticateToken);

// Get user profile (authenticated user only)
router.get('/profile', (req, res) => {
  res.json({
    message: 'User profile',
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    },
  });
});

// Admin only route - Get all users
router.get('/', authorizeRole('admin'), getUsers);

// Get user by ID - Admin only
router.get('/:id', authorizeRole('admin'), getUser);

// Update user - Users can update their own profile, admins can update any user
router.put('/:id', updateUserController);

// Delete user - Admin only
router.delete('/:id', authorizeRole('admin'), deleteUserController);

export default router;
