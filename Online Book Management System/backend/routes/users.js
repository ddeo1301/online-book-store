const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, isAdmin, isLibrarian, canAccessUser, asyncHandler, rateLimit } = require('../middleware/auth');
const Joi = require('joi');

// Validation schemas
const updateUserSchema = Joi.object({
  firstName: Joi.string().max(50).trim().optional(),
  lastName: Joi.string().max(50).trim().optional(),
  email: Joi.string().email().lowercase().optional(),
  phone: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).optional(),
  role: Joi.string().valid('admin', 'librarian', 'member').optional(),
  address: Joi.object({
    street: Joi.string().optional(),
    city: Joi.string().optional(),
    state: Joi.string().optional(),
    zipCode: Joi.string().optional(),
    country: Joi.string().optional()
  }).optional(),
  dateOfBirth: Joi.date().optional(),
  isActive: Joi.boolean().optional(),
  membershipExpiry: Joi.date().optional()
});

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Librarian/Admin)
router.get('/', protect, isLibrarian, rateLimit(100, 15 * 60 * 1000), asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const query = {};

  // Filter by role
  if (req.query.role) {
    query.role = req.query.role;
  }

  // Filter by active status
  if (req.query.isActive !== undefined) {
    query.isActive = req.query.isActive === 'true';
  }

  // Search by name or email
  if (req.query.search) {
    query.$or = [
      { firstName: { $regex: req.query.search, $options: 'i' } },
      { lastName: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } }
    ];
  }

  const users = await User.find(query)
    .select('-password')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await User.countDocuments(query);

  res.json({
    success: true,
    data: {
      users,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    }
  });
}));

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private
router.get('/:id', protect, canAccessUser, asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Get user's borrowing history if requested
  let borrowingHistory = null;
  if (req.query.includeBorrowings === 'true') {
    borrowingHistory = await user.getBorrowingHistory();
  }

  res.json({
    success: true,
    data: {
      user,
      borrowingHistory
    }
  });
}));

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private
router.put('/:id', protect, canAccessUser, asyncHandler(async (req, res) => {
  const { error, value } = updateUserSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.details.map(detail => detail.message)
    });
  }

  // Check if user exists
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Check email uniqueness if it's being updated
  if (value.email && value.email !== user.email) {
    const existingUser = await User.findOne({ email: value.email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }
  }

  // Only admin can change role and active status
  if (req.user.role !== 'admin') {
    delete value.role;
    delete value.isActive;
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.params.id,
    value,
    { new: true, runValidators: true }
  ).select('-password');

  res.json({
    success: true,
    message: 'User updated successfully',
    data: { user: updatedUser }
  });
}));

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin only)
router.delete('/:id', protect, isAdmin, asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Check if user has active borrowings
  const Borrowing = require('../models/Borrowing');
  const activeBorrowings = await Borrowing.countDocuments({
    userId: req.params.id,
    status: { $in: ['active', 'overdue'] }
  });

  if (activeBorrowings > 0) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete user with active borrowings'
    });
  }

  await User.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'User deleted successfully'
  });
}));

// @desc    Get user statistics
// @route   GET /api/users/stats
// @access  Private (Librarian/Admin)
router.get('/stats', protect, isLibrarian, asyncHandler(async (req, res) => {
  const stats = await User.getUserStats();

  res.json({
    success: true,
    data: stats
  });
}));

// @desc    Get user's current borrowings
// @route   GET /api/users/:id/borrowings
// @access  Private
router.get('/:id/borrowings', protect, canAccessUser, asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  const borrowings = await user.getCurrentBorrowings();

  res.json({
    success: true,
    data: { borrowings }
  });
}));

// @desc    Calculate user's fine
// @route   GET /api/users/:id/fine
// @access  Private
router.get('/:id/fine', protect, canAccessUser, asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  const fineAmount = await user.calculateFine();

  res.json({
    success: true,
    data: { fineAmount }
  });
}));

// @desc    Extend user membership
// @route   PUT /api/users/:id/extend-membership
// @access  Private (Librarian/Admin)
router.put('/:id/extend-membership', protect, isLibrarian, asyncHandler(async (req, res) => {
  const { months } = req.body;

  if (!months || months <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Valid number of months is required'
    });
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  const currentExpiry = user.membershipExpiry;
  const newExpiry = new Date(currentExpiry.getTime() + (months * 30 * 24 * 60 * 60 * 1000));

  user.membershipExpiry = newExpiry;
  await user.save();

  res.json({
    success: true,
    message: 'Membership extended successfully',
    data: {
      previousExpiry: currentExpiry,
      newExpiry: newExpiry
    }
  });
}));

module.exports = router;
