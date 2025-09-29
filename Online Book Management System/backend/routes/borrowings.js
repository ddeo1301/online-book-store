const express = require('express');
const router = express.Router();
const Borrowing = require('../models/Borrowing');
const Book = require('../models/Book');
const User = require('../models/User');
const { protect, isLibrarian, asyncHandler, rateLimit } = require('../middleware/auth');
const Joi = require('joi');

// Validation schemas
const borrowBookSchema = Joi.object({
  bookId: Joi.string().required(),
  userId: Joi.string().required(),
  dueDate: Joi.date().min('now').required(),
  notes: Joi.string().max(500).optional()
});

const returnBookSchema = Joi.object({
  notes: Joi.string().max(500).optional()
});

const renewBookSchema = Joi.object({
  additionalDays: Joi.number().integer().min(1).max(30).default(14)
});

// @desc    Borrow a book
// @route   POST /api/borrowings
// @access  Private (Librarian/Admin)
router.post('/', protect, isLibrarian, asyncHandler(async (req, res) => {
  const { error, value } = borrowBookSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.details.map(detail => detail.message)
    });
  }

  const { bookId, userId, dueDate, notes } = value;

  // Check if book exists and is available
  const book = await Book.findById(bookId);
  if (!book) {
    return res.status(404).json({
      success: false,
      message: 'Book not found'
    });
  }

  if (!book.isAvailable) {
    return res.status(400).json({
      success: false,
      message: 'Book is not available for borrowing'
    });
  }

  // Check if user exists and is active
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  if (!user.isActive) {
    return res.status(400).json({
      success: false,
      message: 'User account is not active'
    });
  }

  // Check if user has overdue books
  const overdueCount = await Borrowing.countDocuments({
    userId,
    status: 'overdue',
    returnDate: null
  });

  if (overdueCount > 0) {
    return res.status(400).json({
      success: false,
      message: 'User has overdue books. Please return them before borrowing new books.'
    });
  }

  // Check if user already has this book borrowed
  const existingBorrowing = await Borrowing.findOne({
    userId,
    bookId,
    status: { $in: ['active', 'overdue'] }
  });

  if (existingBorrowing) {
    return res.status(400).json({
      success: false,
      message: 'User has already borrowed this book'
    });
  }

  // Create borrowing record
  const borrowing = await Borrowing.create({
    userId,
    bookId,
    dueDate,
    notes,
    processedBy: req.user._id
  });

  // Update book availability
  await book.borrowBook();

  // Populate the borrowing with user and book details
  const populatedBorrowing = await Borrowing.findById(borrowing._id)
    .populate('userId', 'firstName lastName email')
    .populate('bookId', 'title author isbn')
    .populate('processedBy', 'firstName lastName');

  res.status(201).json({
    success: true,
    message: 'Book borrowed successfully',
    data: { borrowing: populatedBorrowing }
  });
}));

// @desc    Return a book
// @route   PUT /api/borrowings/:id/return
// @access  Private (Librarian/Admin)
router.put('/:id/return', protect, isLibrarian, asyncHandler(async (req, res) => {
  const { error, value } = returnBookSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.details.map(detail => detail.message)
    });
  }

  const borrowing = await Borrowing.findById(req.params.id);
  if (!borrowing) {
    return res.status(404).json({
      success: false,
      message: 'Borrowing record not found'
    });
  }

  if (borrowing.status === 'returned') {
    return res.status(400).json({
      success: false,
      message: 'Book has already been returned'
    });
  }

  // Return the book
  await borrowing.returnBook();

  // Update notes if provided
  if (value.notes) {
    borrowing.notes = value.notes;
    await borrowing.save();
  }

  const populatedBorrowing = await Borrowing.findById(borrowing._id)
    .populate('userId', 'firstName lastName email')
    .populate('bookId', 'title author isbn')
    .populate('processedBy', 'firstName lastName');

  res.json({
    success: true,
    message: 'Book returned successfully',
    data: { borrowing: populatedBorrowing }
  });
}));

// @desc    Renew a book
// @route   PUT /api/borrowings/:id/renew
// @access  Private (Librarian/Admin)
router.put('/:id/renew', protect, isLibrarian, asyncHandler(async (req, res) => {
  const { error, value } = renewBookSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.details.map(detail => detail.message)
    });
  }

  const borrowing = await Borrowing.findById(req.params.id);
  if (!borrowing) {
    return res.status(404).json({
      success: false,
      message: 'Borrowing record not found'
    });
  }

  if (!borrowing.canRenew) {
    return res.status(400).json({
      success: false,
      message: 'This borrowing cannot be renewed'
    });
  }

  await borrowing.renewBorrowing(value.additionalDays);

  const populatedBorrowing = await Borrowing.findById(borrowing._id)
    .populate('userId', 'firstName lastName email')
    .populate('bookId', 'title author isbn')
    .populate('processedBy', 'firstName lastName');

  res.json({
    success: true,
    message: 'Book renewed successfully',
    data: { borrowing: populatedBorrowing }
  });
}));

// @desc    Mark book as lost
// @route   PUT /api/borrowings/:id/lost
// @access  Private (Librarian/Admin)
router.put('/:id/lost', protect, isLibrarian, asyncHandler(async (req, res) => {
  const borrowing = await Borrowing.findById(req.params.id);
  if (!borrowing) {
    return res.status(404).json({
      success: false,
      message: 'Borrowing record not found'
    });
  }

  if (borrowing.status === 'returned') {
    return res.status(400).json({
      success: false,
      message: 'Book has already been returned'
    });
  }

  await borrowing.markAsLost();

  const populatedBorrowing = await Borrowing.findById(borrowing._id)
    .populate('userId', 'firstName lastName email')
    .populate('bookId', 'title author isbn')
    .populate('processedBy', 'firstName lastName');

  res.json({
    success: true,
    message: 'Book marked as lost',
    data: { borrowing: populatedBorrowing }
  });
}));

// @desc    Pay fine
// @route   PUT /api/borrowings/:id/pay-fine
// @access  Private (Librarian/Admin)
router.put('/:id/pay-fine', protect, isLibrarian, asyncHandler(async (req, res) => {
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Valid payment amount is required'
    });
  }

  const borrowing = await Borrowing.findById(req.params.id);
  if (!borrowing) {
    return res.status(404).json({
      success: false,
      message: 'Borrowing record not found'
    });
  }

  await borrowing.payFine(amount);

  const populatedBorrowing = await Borrowing.findById(borrowing._id)
    .populate('userId', 'firstName lastName email')
    .populate('bookId', 'title author isbn')
    .populate('processedBy', 'firstName lastName');

  res.json({
    success: true,
    message: 'Fine paid successfully',
    data: { borrowing: populatedBorrowing }
  });
}));

// @desc    Get all borrowings
// @route   GET /api/borrowings
// @access  Private (Librarian/Admin)
router.get('/', protect, isLibrarian, asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const query = {};

  // Filter by status
  if (req.query.status) {
    query.status = req.query.status;
  }

  // Filter by user
  if (req.query.userId) {
    query.userId = req.query.userId;
  }

  // Filter by book
  if (req.query.bookId) {
    query.bookId = req.query.bookId;
  }

  // Filter by date range
  if (req.query.startDate && req.query.endDate) {
    query.borrowDate = {
      $gte: new Date(req.query.startDate),
      $lte: new Date(req.query.endDate)
    };
  }

  const borrowings = await Borrowing.find(query)
    .populate('userId', 'firstName lastName email phone')
    .populate('bookId', 'title author isbn coverImage')
    .populate('processedBy', 'firstName lastName')
    .sort({ borrowDate: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Borrowing.countDocuments(query);

  res.json({
    success: true,
    data: {
      borrowings,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    }
  });
}));

// @desc    Get single borrowing
// @route   GET /api/borrowings/:id
// @access  Private (Librarian/Admin)
router.get('/:id', protect, isLibrarian, asyncHandler(async (req, res) => {
  const borrowing = await Borrowing.findById(req.params.id)
    .populate('userId', 'firstName lastName email phone address')
    .populate('bookId', 'title author isbn coverImage description')
    .populate('processedBy', 'firstName lastName');

  if (!borrowing) {
    return res.status(404).json({
      success: false,
      message: 'Borrowing record not found'
    });
  }

  res.json({
    success: true,
    data: { borrowing }
  });
}));

// @desc    Get user's borrowings
// @route   GET /api/borrowings/user/:userId
// @access  Private
router.get('/user/:userId', protect, asyncHandler(async (req, res) => {
  // Check if user can access this data
  if (req.user._id.toString() !== req.params.userId && 
      !['admin', 'librarian'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  const borrowings = await Borrowing.find({ userId: req.params.userId })
    .populate('bookId', 'title author isbn coverImage')
    .populate('processedBy', 'firstName lastName')
    .sort({ borrowDate: -1 });

  res.json({
    success: true,
    data: { borrowings }
  });
}));

// @desc    Get overdue borrowings
// @route   GET /api/borrowings/overdue
// @access  Private (Librarian/Admin)
router.get('/overdue', protect, isLibrarian, asyncHandler(async (req, res) => {
  const borrowings = await Borrowing.getOverdueBorrowings();

  res.json({
    success: true,
    data: { borrowings }
  });
}));

// @desc    Get borrowing statistics
// @route   GET /api/borrowings/stats
// @access  Private (Librarian/Admin)
router.get('/stats', protect, isLibrarian, asyncHandler(async (req, res) => {
  const stats = await Borrowing.getBorrowingStats();

  res.json({
    success: true,
    data: stats
  });
}));

module.exports = router;
