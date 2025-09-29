const mongoose = require('mongoose');

const borrowingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  bookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: [true, 'Book ID is required']
  },
  borrowDate: {
    type: Date,
    required: [true, 'Borrow date is required'],
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required'],
    validate: {
      validator: function(value) {
        return value > this.borrowDate;
      },
      message: 'Due date must be after borrow date'
    }
  },
  returnDate: {
    type: Date,
    default: null
  },
  fineAmount: {
    type: Number,
    default: 0,
    min: [0, 'Fine amount cannot be negative']
  },
  finePaid: {
    type: Boolean,
    default: false
  },
  finePaidDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['active', 'returned', 'overdue', 'lost'],
    default: 'active'
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  renewedCount: {
    type: Number,
    default: 0,
    max: [3, 'Maximum 3 renewals allowed']
  },
  lastRenewalDate: {
    type: Date
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for days overdue
borrowingSchema.virtual('daysOverdue').get(function() {
  if (this.status === 'active' && this.dueDate < new Date()) {
    return Math.ceil((new Date() - this.dueDate) / (1000 * 60 * 60 * 24));
  }
  return 0;
});

// Virtual for borrowing duration
borrowingSchema.virtual('borrowingDuration').get(function() {
  const endDate = this.returnDate || new Date();
  return Math.ceil((endDate - this.borrowDate) / (1000 * 60 * 60 * 24));
});

// Virtual for can renew
borrowingSchema.virtual('canRenew').get(function() {
  return this.status === 'active' && 
         this.renewedCount < 3 && 
         this.dueDate > new Date();
});

// Indexes for better query performance
borrowingSchema.index({ userId: 1 });
borrowingSchema.index({ bookId: 1 });
borrowingSchema.index({ status: 1 });
borrowingSchema.index({ dueDate: 1 });
borrowingSchema.index({ borrowDate: 1 });

// Pre-save middleware to calculate fine
borrowingSchema.pre('save', function(next) {
  if (this.status === 'active' && this.dueDate < new Date()) {
    const daysOverdue = Math.ceil((new Date() - this.dueDate) / (1000 * 60 * 60 * 24));
    this.fineAmount = daysOverdue * 1; // $1 per day
    this.status = 'overdue';
  }
  next();
});

// Static method to get active borrowings for a user
borrowingSchema.statics.getActiveBorrowings = function(userId) {
  return this.find({ 
    userId, 
    status: { $in: ['active', 'overdue'] } 
  })
  .populate('bookId', 'title author isbn coverImage')
  .populate('processedBy', 'firstName lastName')
  .sort({ borrowDate: -1 });
};

// Static method to get borrowing history for a user
borrowingSchema.statics.getBorrowingHistory = function(userId, limit = 50) {
  return this.find({ userId })
    .populate('bookId', 'title author isbn')
    .populate('processedBy', 'firstName lastName')
    .sort({ borrowDate: -1 })
    .limit(limit);
};

// Static method to get overdue borrowings
borrowingSchema.statics.getOverdueBorrowings = function() {
  return this.find({ 
    status: 'overdue',
    returnDate: null 
  })
  .populate('userId', 'firstName lastName email phone')
  .populate('bookId', 'title author isbn')
  .populate('processedBy', 'firstName lastName')
  .sort({ dueDate: 1 });
};

// Static method to get borrowing statistics
borrowingSchema.statics.getBorrowingStats = async function() {
  const totalBorrowings = await this.countDocuments();
  const activeBorrowings = await this.countDocuments({ status: 'active' });
  const overdueBorrowings = await this.countDocuments({ status: 'overdue' });
  const returnedBorrowings = await this.countDocuments({ status: 'returned' });
  
  const totalFineAmount = await this.aggregate([
    { $match: { fineAmount: { $gt: 0 } } },
    { $group: { _id: null, total: { $sum: '$fineAmount' } } }
  ]);
  
  const monthlyStats = await this.aggregate([
    {
      $group: {
        _id: {
          year: { $year: '$borrowDate' },
          month: { $month: '$borrowDate' }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': -1, '_id.month': -1 } },
    { $limit: 12 }
  ]);
  
  return {
    totalBorrowings,
    activeBorrowings,
    overdueBorrowings,
    returnedBorrowings,
    totalFineAmount: totalFineAmount[0]?.total || 0,
    monthlyStats
  };
};

// Instance method to renew borrowing
borrowingSchema.methods.renewBorrowing = async function(additionalDays = 14) {
  if (!this.canRenew) {
    throw new Error('This borrowing cannot be renewed');
  }
  
  this.dueDate = new Date(this.dueDate.getTime() + (additionalDays * 24 * 60 * 60 * 1000));
  this.renewedCount += 1;
  this.lastRenewalDate = new Date();
  
  return this.save();
};

// Instance method to return book
borrowingSchema.methods.returnBook = async function() {
  if (this.status === 'returned') {
    throw new Error('Book has already been returned');
  }
  
  this.returnDate = new Date();
  this.status = 'returned';
  
  // Update book availability
  const Book = mongoose.model('Book');
  await Book.findByIdAndUpdate(this.bookId, { $inc: { availableCopies: 1 } });
  
  return this.save();
};

// Instance method to mark as lost
borrowingSchema.methods.markAsLost = async function() {
  this.status = 'lost';
  this.fineAmount += 50; // Additional fine for lost book
  
  // Update book status
  const Book = mongoose.model('Book');
  await Book.findByIdAndUpdate(this.bookId, { 
    $inc: { availableCopies: -1 },
    status: 'lost'
  });
  
  return this.save();
};

// Instance method to pay fine
borrowingSchema.methods.payFine = async function(amount) {
  if (amount < this.fineAmount) {
    throw new Error('Payment amount is less than the fine amount');
  }
  
  this.finePaid = true;
  this.finePaidDate = new Date();
  
  return this.save();
};

module.exports = mongoose.model('Borrowing', borrowingSchema);
