const express = require('express');
const router = express.Router();
const Book = require('../models/Book');
const Category = require('../models/Category');
const Borrowing = require('../models/Borrowing');
const { protect, isLibrarian, asyncHandler, rateLimit } = require('../middleware/auth');
const Joi = require('joi');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/books');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'book-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Validation schemas
const bookSchema = Joi.object({
  title: Joi.string().required().max(200).trim(),
  author: Joi.string().required().max(100).trim(),
  isbn: Joi.string().pattern(/^(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]$/).required(),
  category: Joi.string().required(),
  publisher: Joi.string().required().max(100).trim(),
  publicationYear: Joi.number().integer().min(1000).max(new Date().getFullYear()).required(),
  edition: Joi.string().default('1st Edition'),
  language: Joi.string().default('English'),
  pages: Joi.number().integer().min(1).optional(),
  description: Joi.string().max(2000).optional(),
  price: Joi.number().min(0).optional(),
  copies: Joi.number().integer().min(1).default(1),
  tags: Joi.array().items(Joi.string().trim()).optional(),
  location: Joi.object({
    shelf: Joi.string().optional(),
    section: Joi.string().optional(),
    floor: Joi.string().optional(),
    room: Joi.string().optional()
  }).optional()
});

const updateBookSchema = Joi.object({
  title: Joi.string().max(200).trim().optional(),
  author: Joi.string().max(100).trim().optional(),
  category: Joi.string().optional(),
  publisher: Joi.string().max(100).trim().optional(),
  publicationYear: Joi.number().integer().min(1000).max(new Date().getFullYear()).optional(),
  edition: Joi.string().optional(),
  language: Joi.string().optional(),
  pages: Joi.number().integer().min(1).optional(),
  description: Joi.string().max(2000).optional(),
  price: Joi.number().min(0).optional(),
  copies: Joi.number().integer().min(1).optional(),
  tags: Joi.array().items(Joi.string().trim()).optional(),
  location: Joi.object({
    shelf: Joi.string().optional(),
    section: Joi.string().optional(),
    floor: Joi.string().optional(),
    room: Joi.string().optional()
  }).optional(),
  status: Joi.string().valid('available', 'borrowed', 'reserved', 'lost', 'damaged', 'maintenance').optional()
});

// @desc    Get all books
// @route   GET /api/books
// @access  Public
router.get('/', rateLimit(100, 15 * 60 * 1000), asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  
  const query = { isActive: true };
  
  // Search functionality
  if (req.query.search) {
    query.$text = { $search: req.query.search };
  }
  
  // Filter by category
  if (req.query.category) {
    query.category = req.query.category;
  }
  
  // Filter by status
  if (req.query.status) {
    query.status = req.query.status;
  }
  
  // Filter by author
  if (req.query.author) {
    query.author = { $regex: req.query.author, $options: 'i' };
  }
  
  // Filter by publication year
  if (req.query.year) {
    query.publicationYear = parseInt(req.query.year);
  }
  
  // Filter by language
  if (req.query.language) {
    query.language = req.query.language;
  }
  
  // Sort options
  let sort = { createdAt: -1 };
  if (req.query.sort) {
    switch (req.query.sort) {
      case 'title':
        sort = { title: 1 };
        break;
      case 'author':
        sort = { author: 1 };
        break;
      case 'year':
        sort = { publicationYear: -1 };
        break;
      case 'rating':
        sort = { 'rating.average': -1 };
        break;
      default:
        sort = { createdAt: -1 };
    }
  }

  const books = await Book.find(query)
    .populate('category', 'name color')
    .populate('addedBy', 'firstName lastName')
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const total = await Book.countDocuments(query);

  res.json({
    success: true,
    data: {
      books,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    }
  });
}));

// @desc    Get single book
// @route   GET /api/books/:id
// @access  Public
router.get('/:id', asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id)
    .populate('category', 'name color description')
    .populate('addedBy', 'firstName lastName');

  if (!book) {
    return res.status(404).json({
      success: false,
      message: 'Book not found'
    });
  }

  // Get borrowing history for this book
  const borrowingHistory = await Borrowing.find({ bookId: req.params.id })
    .populate('userId', 'firstName lastName')
    .sort({ borrowDate: -1 })
    .limit(10);

  res.json({
    success: true,
    data: {
      book,
      borrowingHistory
    }
  });
}));

// @desc    Create new book
// @route   POST /api/books
// @access  Private (Librarian/Admin)
router.post('/', protect, isLibrarian, upload.single('coverImage'), asyncHandler(async (req, res) => {
  const { error, value } = bookSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.details.map(detail => detail.message)
    });
  }

  // Check if ISBN already exists
  const existingBook = await Book.findOne({ isbn: value.isbn });
  if (existingBook) {
    return res.status(400).json({
      success: false,
      message: 'Book with this ISBN already exists'
    });
  }

  // Check if category exists
  const category = await Category.findById(value.category);
  if (!category) {
    return res.status(400).json({
      success: false,
      message: 'Category not found'
    });
  }

  const bookData = {
    ...value,
    addedBy: req.user._id,
    availableCopies: value.copies
  };

  // Add cover image if uploaded
  if (req.file) {
    bookData.coverImage = `/uploads/books/${req.file.filename}`;
  }

  const book = await Book.create(bookData);

  const populatedBook = await Book.findById(book._id)
    .populate('category', 'name color')
    .populate('addedBy', 'firstName lastName');

  res.status(201).json({
    success: true,
    message: 'Book created successfully',
    data: { book: populatedBook }
  });
}));

// @desc    Update book
// @route   PUT /api/books/:id
// @access  Private (Librarian/Admin)
router.put('/:id', protect, isLibrarian, upload.single('coverImage'), asyncHandler(async (req, res) => {
  const { error, value } = updateBookSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.details.map(detail => detail.message)
    });
  }

  const book = await Book.findById(req.params.id);
  if (!book) {
    return res.status(404).json({
      success: false,
      message: 'Book not found'
    });
  }

  // Check ISBN uniqueness if it's being updated
  if (value.isbn && value.isbn !== book.isbn) {
    const existingBook = await Book.findOne({ isbn: value.isbn });
    if (existingBook) {
      return res.status(400).json({
        success: false,
        message: 'Book with this ISBN already exists'
      });
    }
  }

  // Check category if it's being updated
  if (value.category) {
    const category = await Category.findById(value.category);
    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Category not found'
      });
    }
  }

  // Handle cover image update
  if (req.file) {
    // Delete old image if exists
    if (book.coverImage) {
      const oldImagePath = path.join(__dirname, '..', book.coverImage);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }
    value.coverImage = `/uploads/books/${req.file.filename}`;
  }

  const updatedBook = await Book.findByIdAndUpdate(
    req.params.id,
    value,
    { new: true, runValidators: true }
  ).populate('category', 'name color')
   .populate('addedBy', 'firstName lastName');

  res.json({
    success: true,
    message: 'Book updated successfully',
    data: { book: updatedBook }
  });
}));

// @desc    Delete book
// @route   DELETE /api/books/:id
// @access  Private (Admin only)
router.delete('/:id', protect, asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }

  const book = await Book.findById(req.params.id);
  if (!book) {
    return res.status(404).json({
      success: false,
      message: 'Book not found'
    });
  }

  // Check if book has active borrowings
  const activeBorrowings = await Borrowing.countDocuments({
    bookId: req.params.id,
    status: { $in: ['active', 'overdue'] }
  });

  if (activeBorrowings > 0) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete book with active borrowings'
    });
  }

  // Delete cover image if exists
  if (book.coverImage) {
    const imagePath = path.join(__dirname, '..', book.coverImage);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
  }

  await Book.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Book deleted successfully'
  });
}));

// @desc    Get popular books
// @route   GET /api/books/popular
// @access  Public
router.get('/popular', asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const books = await Book.getPopularBooks(limit);

  res.json({
    success: true,
    data: { books }
  });
}));

// @desc    Get recently added books
// @route   GET /api/books/recent
// @access  Public
router.get('/recent', asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const books = await Book.getRecentlyAdded(limit);

  res.json({
    success: true,
    data: { books }
  });
}));

// @desc    Get book statistics
// @route   GET /api/books/stats
// @access  Private (Librarian/Admin)
router.get('/stats', protect, isLibrarian, asyncHandler(async (req, res) => {
  const stats = await Book.getBookStats();

  res.json({
    success: true,
    data: stats
  });
}));

// @desc    Rate a book
// @route   POST /api/books/:id/rate
// @access  Private
router.post('/:id/rate', protect, asyncHandler(async (req, res) => {
  const { rating } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({
      success: false,
      message: 'Rating must be between 1 and 5'
    });
  }

  const book = await Book.findById(req.params.id);
  if (!book) {
    return res.status(404).json({
      success: false,
      message: 'Book not found'
    });
  }

  await book.updateRating(rating);

  res.json({
    success: true,
    message: 'Rating updated successfully'
  });
}));

module.exports = router;
