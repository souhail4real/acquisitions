import express from 'express';
import { authenticateToken, authorizeRole } from '#middleware/auth.middleware.js';

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
router.get('/', authorizeRole('admin'), (req, res) => {
  res.json({
    message: 'All users (admin only)',
    note: 'This endpoint would return all users from the database',
  });
});

export default router;