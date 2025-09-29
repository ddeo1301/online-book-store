const express = require('express');
const router = express.Router();
const Book = require('../models/Book');
const User = require('../models/User');
const Borrowing = require('../models/Borrowing');
const Category = require('../models/Category');
const { protect, isLibrarian, asyncHandler } = require('../middleware/auth');

// @desc    Get dashboard statistics
// @route   GET /api/reports/dashboard
// @access  Private (Librarian/Admin)
router.get('/dashboard', protect, isLibrarian, asyncHandler(async (req, res) => {
  // Get all statistics in parallel
  const [
    bookStats,
    userStats,
    borrowingStats,
    categoryStats
  ] = await Promise.all([
    Book.getBookStats(),
    User.getUserStats(),
    Borrowing.getBorrowingStats(),
    Category.getCategoriesWithCounts()
  ]);

  // Get recent activities
  const recentBorrowings = await Borrowing.find()
    .populate('userId', 'firstName lastName')
    .populate('bookId', 'title author')
    .sort({ createdAt: -1 })
    .limit(5);

  const recentlyAddedBooks = await Book.find({ isActive: true })
    .populate('category', 'name')
    .sort({ createdAt: -1 })
    .limit(5);

  res.json({
    success: true,
    data: {
      bookStats,
      userStats,
      borrowingStats,
      categoryStats: categoryStats.slice(0, 10), // Top 10 categories
      recentActivities: {
        recentBorrowings,
        recentlyAddedBooks
      }
    }
  });
}));

// @desc    Get borrowing report
// @route   GET /api/reports/borrowings
// @access  Private (Librarian/Admin)
router.get('/borrowings', protect, isLibrarian, asyncHandler(async (req, res) => {
  const { startDate, endDate, status, userId, bookId } = req.query;

  const query = {};

  // Date range filter
  if (startDate && endDate) {
    query.borrowDate = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  // Status filter
  if (status) {
    query.status = status;
  }

  // User filter
  if (userId) {
    query.userId = userId;
  }

  // Book filter
  if (bookId) {
    query.bookId = bookId;
  }

  const borrowings = await Borrowing.find(query)
    .populate('userId', 'firstName lastName email')
    .populate('bookId', 'title author isbn')
    .populate('processedBy', 'firstName lastName')
    .sort({ borrowDate: -1 });

  // Calculate summary statistics
  const summary = {
    total: borrowings.length,
    active: borrowings.filter(b => b.status === 'active').length,
    overdue: borrowings.filter(b => b.status === 'overdue').length,
    returned: borrowings.filter(b => b.status === 'returned').length,
    lost: borrowings.filter(b => b.status === 'lost').length,
    totalFineAmount: borrowings.reduce((sum, b) => sum + b.fineAmount, 0)
  };

  res.json({
    success: true,
    data: {
      borrowings,
      summary
    }
  });
}));

// @desc    Get user activity report
// @route   GET /api/reports/users
// @access  Private (Librarian/Admin)
router.get('/users', protect, isLibrarian, asyncHandler(async (req, res) => {
  const { startDate, endDate, role, isActive } = req.query;

  const query = {};

  // Date range filter (registration date)
  if (startDate && endDate) {
    query.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  // Role filter
  if (role) {
    query.role = role;
  }

  // Active status filter
  if (isActive !== undefined) {
    query.isActive = isActive === 'true';
  }

  const users = await User.find(query)
    .select('-password')
    .sort({ createdAt: -1 });

  // Get borrowing statistics for each user
  const usersWithStats = await Promise.all(
    users.map(async (user) => {
      const borrowingStats = await Borrowing.aggregate([
        { $match: { userId: user._id } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const stats = {
        totalBorrowings: 0,
        activeBorrowings: 0,
        overdueBorrowings: 0,
        returnedBorrowings: 0
      };

      borrowingStats.forEach(stat => {
        stats.totalBorrowings += stat.count;
        stats[`${stat._id}Borrowings`] = stat.count;
      });

      return {
        ...user.toObject(),
        borrowingStats: stats
      };
    })
  );

  res.json({
    success: true,
    data: { users: usersWithStats }
  });
}));

// @desc    Get book inventory report
// @route   GET /api/reports/books
// @access  Private (Librarian/Admin)
router.get('/books', protect, isLibrarian, asyncHandler(async (req, res) => {
  const { category, status, author, year } = req.query;

  const query = { isActive: true };

  // Category filter
  if (category) {
    query.category = category;
  }

  // Status filter
  if (status) {
    query.status = status;
  }

  // Author filter
  if (author) {
    query.author = { $regex: author, $options: 'i' };
  }

  // Year filter
  if (year) {
    query.publicationYear = parseInt(year);
  }

  const books = await Book.find(query)
    .populate('category', 'name')
    .populate('addedBy', 'firstName lastName')
    .sort({ createdAt: -1 });

  // Calculate summary statistics
  const summary = {
    total: books.length,
    available: books.filter(b => b.status === 'available').length,
    borrowed: books.filter(b => b.status === 'borrowed').length,
    reserved: books.filter(b => b.status === 'reserved').length,
    lost: books.filter(b => b.status === 'lost').length,
    damaged: books.filter(b => b.status === 'damaged').length,
    totalCopies: books.reduce((sum, b) => sum + b.copies, 0),
    availableCopies: books.reduce((sum, b) => sum + b.availableCopies, 0)
  };

  res.json({
    success: true,
    data: {
      books,
      summary
    }
  });
}));

// @desc    Get fine collection report
// @route   GET /api/reports/fines
// @access  Private (Librarian/Admin)
router.get('/fines', protect, isLibrarian, asyncHandler(async (req, res) => {
  const { startDate, endDate, paid, userId } = req.query;

  const query = { fineAmount: { $gt: 0 } };

  // Date range filter
  if (startDate && endDate) {
    query.borrowDate = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  // Paid status filter
  if (paid !== undefined) {
    query.finePaid = paid === 'true';
  }

  // User filter
  if (userId) {
    query.userId = userId;
  }

  const fines = await Borrowing.find(query)
    .populate('userId', 'firstName lastName email')
    .populate('bookId', 'title author')
    .sort({ borrowDate: -1 });

  // Calculate summary statistics
  const summary = {
    totalFines: fines.length,
    totalAmount: fines.reduce((sum, f) => sum + f.fineAmount, 0),
    paidFines: fines.filter(f => f.finePaid).length,
    paidAmount: fines.filter(f => f.finePaid).reduce((sum, f) => sum + f.fineAmount, 0),
    unpaidFines: fines.filter(f => !f.finePaid).length,
    unpaidAmount: fines.filter(f => !f.finePaid).reduce((sum, f) => sum + f.fineAmount, 0)
  };

  res.json({
    success: true,
    data: {
      fines,
      summary
    }
  });
}));

// @desc    Get monthly statistics
// @route   GET /api/reports/monthly
// @access  Private (Librarian/Admin)
router.get('/monthly', protect, isLibrarian, asyncHandler(async (req, res) => {
  const { year } = req.query;
  const targetYear = year ? parseInt(year) : new Date().getFullYear();

  // Get monthly borrowing statistics
  const monthlyBorrowings = await Borrowing.aggregate([
    {
      $match: {
        borrowDate: {
          $gte: new Date(`${targetYear}-01-01`),
          $lt: new Date(`${targetYear + 1}-01-01`)
        }
      }
    },
    {
      $group: {
        _id: { $month: '$borrowDate' },
        count: { $sum: 1 },
        totalFineAmount: { $sum: '$fineAmount' }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Get monthly user registrations
  const monthlyRegistrations = await User.aggregate([
    {
      $match: {
        createdAt: {
          $gte: new Date(`${targetYear}-01-01`),
          $lt: new Date(`${targetYear + 1}-01-01`)
        }
      }
    },
    {
      $group: {
        _id: { $month: '$createdAt' },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Get monthly book additions
  const monthlyBookAdditions = await Book.aggregate([
    {
      $match: {
        createdAt: {
          $gte: new Date(`${targetYear}-01-01`),
          $lt: new Date(`${targetYear + 1}-01-01`)
        }
      }
    },
    {
      $group: {
        _id: { $month: '$createdAt' },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  res.json({
    success: true,
    data: {
      year: targetYear,
      monthlyBorrowings,
      monthlyRegistrations,
      monthlyBookAdditions
    }
  });
}));

// @desc    Export report data
// @route   GET /api/reports/export/:type
// @access  Private (Librarian/Admin)
router.get('/export/:type', protect, isLibrarian, asyncHandler(async (req, res) => {
  const { type } = req.params;
  const { format = 'json' } = req.query;

  let data = null;

  switch (type) {
    case 'borrowings':
      data = await Borrowing.find()
        .populate('userId', 'firstName lastName email')
        .populate('bookId', 'title author isbn')
        .populate('processedBy', 'firstName lastName')
        .sort({ borrowDate: -1 });
      break;

    case 'users':
      data = await User.find().select('-password').sort({ createdAt: -1 });
      break;

    case 'books':
      data = await Book.find({ isActive: true })
        .populate('category', 'name')
        .populate('addedBy', 'firstName lastName')
        .sort({ createdAt: -1 });
      break;

    case 'fines':
      data = await Borrowing.find({ fineAmount: { $gt: 0 } })
        .populate('userId', 'firstName lastName email')
        .populate('bookId', 'title author')
        .sort({ borrowDate: -1 });
      break;

    default:
      return res.status(400).json({
        success: false,
        message: 'Invalid export type'
      });
  }

  if (format === 'csv') {
    // Convert to CSV format
    const csv = convertToCSV(data);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${type}-report.csv"`);
    res.send(csv);
  } else {
    res.json({
      success: true,
      data
    });
  }
}));

// Helper function to convert data to CSV
function convertToCSV(data) {
  if (!data || data.length === 0) return '';

  const headers = Object.keys(data[0].toObject ? data[0].toObject() : data[0]);
  const csvRows = [headers.join(',')];

  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header];
      return typeof value === 'string' ? `"${value}"` : value;
    });
    csvRows.push(values.join(','));
  });

  return csvRows.join('\n');
}

module.exports = router;
