const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Book title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  author: {
    type: String,
    required: [true, 'Author name is required'],
    trim: true,
    maxlength: [100, 'Author name cannot exceed 100 characters']
  },
  isbn: {
    type: String,
    required: [true, 'ISBN is required'],
    unique: true,
    match: [/^(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]$/, 'Please enter a valid ISBN']
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required']
  },
  publisher: {
    type: String,
    required: [true, 'Publisher is required'],
    trim: true,
    maxlength: [100, 'Publisher name cannot exceed 100 characters']
  },
  publicationYear: {
    type: Number,
    required: [true, 'Publication year is required'],
    min: [1000, 'Publication year must be valid'],
    max: [new Date().getFullYear(), 'Publication year cannot be in the future']
  },
  edition: {
    type: String,
    default: '1st Edition'
  },
  language: {
    type: String,
    required: [true, 'Language is required'],
    default: 'English'
  },
  pages: {
    type: Number,
    min: [1, 'Book must have at least 1 page']
  },
  description: {
    type: String,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  coverImage: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['available', 'borrowed', 'reserved', 'lost', 'damaged', 'maintenance'],
    default: 'available'
  },
  location: {
    shelf: String,
    section: String,
    floor: String,
    room: String
  },
  price: {
    type: Number,
    min: [0, 'Price cannot be negative']
  },
  copies: {
    type: Number,
    required: [true, 'Number of copies is required'],
    min: [1, 'Must have at least 1 copy'],
    default: 1
  },
  availableCopies: {
    type: Number,
    min: [0, 'Available copies cannot be negative'],
    default: function() { return this.copies; }
  },
  tags: [{
    type: String,
    trim: true
  }],
  rating: {
    average: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    count: {
      type: Number,
      default: 0
    }
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for availability status
bookSchema.virtual('isAvailable').get(function() {
  return this.status === 'available' && this.availableCopies > 0;
});

// Virtual for full location
bookSchema.virtual('fullLocation').get(function() {
  const parts = [];
  if (this.location.floor) parts.push(`Floor ${this.location.floor}`);
  if (this.location.room) parts.push(`Room ${this.location.room}`);
  if (this.location.section) parts.push(`Section ${this.location.section}`);
  if (this.location.shelf) parts.push(`Shelf ${this.location.shelf}`);
  return parts.join(', ') || 'Not specified';
});

// Indexes for better query performance
bookSchema.index({ title: 'text', author: 'text', description: 'text' });
bookSchema.index({ isbn: 1 });
bookSchema.index({ category: 1 });
bookSchema.index({ status: 1 });
bookSchema.index({ publicationYear: 1 });
bookSchema.index({ addedBy: 1 });

// Pre-save middleware to update available copies
bookSchema.pre('save', function(next) {
  if (this.isModified('copies') && !this.isModified('availableCopies')) {
    this.availableCopies = this.copies;
  }
  next();
});

// Static method to search books
bookSchema.statics.searchBooks = function(query, filters = {}) {
  const searchQuery = {};
  
  if (query) {
    searchQuery.$text = { $search: query };
  }
  
  if (filters.category) {
    searchQuery.category = filters.category;
  }
  
  if (filters.status) {
    searchQuery.status = filters.status;
  }
  
  if (filters.author) {
    searchQuery.author = { $regex: filters.author, $options: 'i' };
  }
  
  if (filters.publicationYear) {
    searchQuery.publicationYear = filters.publicationYear;
  }
  
  if (filters.language) {
    searchQuery.language = filters.language;
  }
  
  return this.find(searchQuery)
    .populate('category', 'name')
    .populate('addedBy', 'firstName lastName')
    .sort({ createdAt: -1 });
};

// Static method to get popular books
bookSchema.statics.getPopularBooks = function(limit = 10) {
  return this.find({ isActive: true })
    .sort({ 'rating.average': -1, 'rating.count': -1 })
    .limit(limit)
    .populate('category', 'name');
};

// Static method to get recently added books
bookSchema.statics.getRecentlyAdded = function(limit = 10) {
  return this.find({ isActive: true })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('category', 'name');
};

// Static method to get book statistics
bookSchema.statics.getBookStats = async function() {
  const totalBooks = await this.countDocuments();
  const availableBooks = await this.countDocuments({ status: 'available' });
  const borrowedBooks = await this.countDocuments({ status: 'borrowed' });
  const reservedBooks = await this.countDocuments({ status: 'reserved' });
  const lostBooks = await this.countDocuments({ status: 'lost' });
  
  const categoryStats = await this.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
    { $unwind: '$category' },
    { $project: { categoryName: '$category.name', count: 1 } }
  ]);
  
  return {
    totalBooks,
    availableBooks,
    borrowedBooks,
    reservedBooks,
    lostBooks,
    categoryStats
  };
};

// Instance method to update rating
bookSchema.methods.updateRating = async function(newRating) {
  const totalRating = (this.rating.average * this.rating.count) + newRating;
  this.rating.count += 1;
  this.rating.average = totalRating / this.rating.count;
  return this.save();
};

// Instance method to borrow book
bookSchema.methods.borrowBook = async function() {
  if (this.availableCopies <= 0) {
    throw new Error('No copies available for borrowing');
  }
  
  this.availableCopies -= 1;
  if (this.availableCopies === 0) {
    this.status = 'borrowed';
  }
  
  return this.save();
};

// Instance method to return book
bookSchema.methods.returnBook = async function() {
  this.availableCopies += 1;
  if (this.status === 'borrowed') {
    this.status = 'available';
  }
  
  return this.save();
};

module.exports = mongoose.model('Book', bookSchema);
