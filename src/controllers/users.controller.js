import logger from '#config/logger.js';
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} from '#services/users.service.js';
import {
  updateUserSchema,
  userIdSchema,
} from '#validations/users.validation.js';
import { formatValidationError } from '#utils/format.js';

export const getUsers = async (req, res, next) => {
  try {
    logger.info('Getting all users');

    const users = await getAllUsers();

    logger.info(`Retrieved ${users.length} users successfully`);
    res.status(200).json({
      message: 'Users retrieved successfully',
      users,
      count: users.length,
    });
  } catch (e) {
    logger.error('Error getting users:', e);
    next(e);
  }
};

export const getUser = async (req, res, next) => {
  try {
    const validationResult = userIdSchema.safeParse(req.params);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(validationResult.error),
      });
    }

    const { id } = validationResult.data;
    logger.info(`Getting user by ID: ${id}`);

    const user = await getUserById(id);

    logger.info(`User ${user.email} retrieved successfully`);
    res.status(200).json({
      message: 'User retrieved successfully',
      user,
    });
  } catch (e) {
    logger.error('Error getting user by ID:', e);

    if (e.message === 'User not found') {
      return res.status(404).json({ error: 'User not found' });
    }

    next(e);
  }
};

export const updateUserController = async (req, res, next) => {
  try {
    const idValidationResult = userIdSchema.safeParse(req.params);

    if (!idValidationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(idValidationResult.error),
      });
    }

    const updateValidationResult = updateUserSchema.safeParse(req.body);

    if (!updateValidationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(updateValidationResult.error),
      });
    }

    const { id } = idValidationResult.data;
    const updates = updateValidationResult.data;

    // Check if user is trying to update their own information
    const isOwnAccount = req.user.id === parseInt(id);
    const isAdmin = req.user.role === 'admin';

    // Users can only update their own information, except for role changes
    if (!isOwnAccount && !isAdmin) {
      return res.status(403).json({
        error: 'Forbidden: You can only update your own account',
      });
    }

    // Only admins can change user roles
    if (updates.role && !isAdmin) {
      return res.status(403).json({
        error: 'Forbidden: Only administrators can change user roles',
      });
    }

    logger.info(`Updating user ID: ${id} by user: ${req.user.email}`);

    const updatedUser = await updateUser(id, updates);

    logger.info(`User ${updatedUser.email} updated successfully`);
    res.status(200).json({
      message: 'User updated successfully',
      user: updatedUser,
    });
  } catch (e) {
    logger.error('Error updating user:', e);

    if (e.message === 'User not found') {
      return res.status(404).json({ error: 'User not found' });
    }

    if (e.message === 'Email already exists') {
      return res.status(409).json({ error: 'Email already exists' });
    }

    next(e);
  }
};

export const deleteUserController = async (req, res, next) => {
  try {
    const validationResult = userIdSchema.safeParse(req.params);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(validationResult.error),
      });
    }

    const { id } = validationResult.data;
    const isAdmin = req.user.role === 'admin';

    // Only admins can delete users
    if (!isAdmin) {
      return res.status(403).json({
        error: 'Forbidden: Only administrators can delete users',
      });
    }

    // Prevent admin from deleting their own account
    if (req.user.id === parseInt(id)) {
      return res.status(400).json({
        error: 'Bad Request: Cannot delete your own account',
      });
    }

    logger.info(`Deleting user ID: ${id} by admin: ${req.user.email}`);

    const deletedUser = await deleteUser(id);

    logger.info(`User ${deletedUser.email} deleted successfully`);
    res.status(200).json({
      message: 'User deleted successfully',
      user: deletedUser,
    });
  } catch (e) {
    logger.error('Error deleting user:', e);

    if (e.message === 'User not found') {
      return res.status(404).json({ error: 'User not found' });
    }

    next(e);
  }
};
