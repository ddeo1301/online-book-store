const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
    trim: true,
    maxlength: [50, 'Category name cannot exceed 50 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  parentCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  color: {
    type: String,
    default: '#2196F3',
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please enter a valid hex color']
  },
  icon: {
    type: String,
    default: 'book'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for subcategories
categorySchema.virtual('subcategories', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parentCategory'
});

// Virtual for book count
categorySchema.virtual('bookCount', {
  ref: 'Book',
  localField: '_id',
  foreignField: 'category',
  count: true
});

// Index for better query performance
categorySchema.index({ name: 1 });
categorySchema.index({ parentCategory: 1 });
categorySchema.index({ isActive: 1 });

// Static method to get categories with book counts
categorySchema.statics.getCategoriesWithCounts = async function() {
  return this.aggregate([
    { $match: { isActive: true } },
    {
      $lookup: {
        from: 'books',
        localField: '_id',
        foreignField: 'category',
        as: 'books'
      }
    },
    {
      $addFields: {
        bookCount: { $size: '$books' }
      }
    },
    {
      $project: {
        books: 0
      }
    },
    { $sort: { name: 1 } }
  ]);
};

// Static method to get category hierarchy
categorySchema.statics.getCategoryHierarchy = async function() {
  const categories = await this.find({ isActive: true }).sort({ name: 1 });
  
  const categoryMap = new Map();
  const rootCategories = [];
  
  // Create map of all categories
  categories.forEach(category => {
    categoryMap.set(category._id.toString(), {
      ...category.toObject(),
      subcategories: []
    });
  });
  
  // Build hierarchy
  categories.forEach(category => {
    if (category.parentCategory) {
      const parent = categoryMap.get(category.parentCategory.toString());
      if (parent) {
        parent.subcategories.push(categoryMap.get(category._id.toString()));
      }
    } else {
      rootCategories.push(categoryMap.get(category._id.toString()));
    }
  });
  
  return rootCategories;
};

// Static method to get popular categories
categorySchema.statics.getPopularCategories = async function(limit = 10) {
  return this.aggregate([
    { $match: { isActive: true } },
    {
      $lookup: {
        from: 'books',
        localField: '_id',
        foreignField: 'category',
        as: 'books'
      }
    },
    {
      $addFields: {
        bookCount: { $size: '$books' }
      }
    },
    {
      $project: {
        books: 0
      }
    },
    { $sort: { bookCount: -1 } },
    { $limit: limit }
  ]);
};

// Instance method to get books in category
categorySchema.methods.getBooks = async function(filters = {}) {
  const Book = mongoose.model('Book');
  const query = { category: this._id, isActive: true };
  
  if (filters.status) {
    query.status = filters.status;
  }
  
  if (filters.author) {
    query.author = { $regex: filters.author, $options: 'i' };
  }
  
  return Book.find(query)
    .populate('addedBy', 'firstName lastName')
    .sort({ createdAt: -1 });
};

// Instance method to get subcategories
categorySchema.methods.getSubcategories = async function() {
  return this.constructor.find({ 
    parentCategory: this._id, 
    isActive: true 
  }).sort({ name: 1 });
};

// Instance method to check if category can be deleted
categorySchema.methods.canBeDeleted = async function() {
  const Book = mongoose.model('Book');
  const bookCount = await Book.countDocuments({ category: this._id });
  const subcategoryCount = await this.constructor.countDocuments({ 
    parentCategory: this._id 
  });
  
  return bookCount === 0 && subcategoryCount === 0;
};

module.exports = mongoose.model('Category', categorySchema);
