const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const { protect, isLibrarian, asyncHandler, rateLimit } = require('../middleware/auth');
const Joi = require('joi');

// Validation schemas
const categorySchema = Joi.object({
  name: Joi.string().required().max(50).trim(),
  description: Joi.string().max(500).optional(),
  parentCategory: Joi.string().optional(),
  color: Joi.string().pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).default('#2196F3'),
  icon: Joi.string().default('book')
});

const updateCategorySchema = Joi.object({
  name: Joi.string().max(50).trim().optional(),
  description: Joi.string().max(500).optional(),
  parentCategory: Joi.string().optional(),
  color: Joi.string().pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional(),
  icon: Joi.string().optional(),
  isActive: Joi.boolean().optional()
});

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
router.get('/', rateLimit(100, 15 * 60 * 1000), asyncHandler(async (req, res) => {
  const includeInactive = req.query.includeInactive === 'true';
  const query = includeInactive ? {} : { isActive: true };

  const categories = await Category.find(query)
    .populate('parentCategory', 'name')
    .populate('createdBy', 'firstName lastName')
    .sort({ name: 1 });

  res.json({
    success: true,
    data: { categories }
  });
}));

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Public
router.get('/:id', asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id)
    .populate('parentCategory', 'name')
    .populate('createdBy', 'firstName lastName');

  if (!category) {
    return res.status(404).json({
      success: false,
      message: 'Category not found'
    });
  }

  // Get books in this category if requested
  let books = null;
  if (req.query.includeBooks === 'true') {
    books = await category.getBooks();
  }

  res.json({
    success: true,
    data: {
      category,
      books
    }
  });
}));

// @desc    Create new category
// @route   POST /api/categories
// @access  Private (Librarian/Admin)
router.post('/', protect, isLibrarian, asyncHandler(async (req, res) => {
  const { error, value } = categorySchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.details.map(detail => detail.message)
    });
  }

  const { name, description, parentCategory, color, icon } = value;

  // Check if category name already exists
  const existingCategory = await Category.findOne({ name });
  if (existingCategory) {
    return res.status(400).json({
      success: false,
      message: 'Category with this name already exists'
    });
  }

  // Check if parent category exists
  if (parentCategory) {
    const parent = await Category.findById(parentCategory);
    if (!parent) {
      return res.status(400).json({
        success: false,
        message: 'Parent category not found'
      });
    }
  }

  const category = await Category.create({
    name,
    description,
    parentCategory,
    color,
    icon,
    createdBy: req.user._id
  });

  const populatedCategory = await Category.findById(category._id)
    .populate('parentCategory', 'name')
    .populate('createdBy', 'firstName lastName');

  res.status(201).json({
    success: true,
    message: 'Category created successfully',
    data: { category: populatedCategory }
  });
}));

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private (Librarian/Admin)
router.put('/:id', protect, isLibrarian, asyncHandler(async (req, res) => {
  const { error, value } = updateCategorySchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.details.map(detail => detail.message)
    });
  }

  const category = await Category.findById(req.params.id);
  if (!category) {
    return res.status(404).json({
      success: false,
      message: 'Category not found'
    });
  }

  // Check name uniqueness if it's being updated
  if (value.name && value.name !== category.name) {
    const existingCategory = await Category.findOne({ name: value.name });
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists'
      });
    }
  }

  // Check parent category if it's being updated
  if (value.parentCategory) {
    const parent = await Category.findById(value.parentCategory);
    if (!parent) {
      return res.status(400).json({
        success: false,
        message: 'Parent category not found'
      });
    }

    // Prevent setting self as parent
    if (value.parentCategory === req.params.id) {
      return res.status(400).json({
        success: false,
        message: 'Category cannot be its own parent'
      });
    }
  }

  const updatedCategory = await Category.findByIdAndUpdate(
    req.params.id,
    value,
    { new: true, runValidators: true }
  )
  .populate('parentCategory', 'name')
  .populate('createdBy', 'firstName lastName');

  res.json({
    success: true,
    message: 'Category updated successfully',
    data: { category: updatedCategory }
  });
}));

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private (Admin only)
router.delete('/:id', protect, asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }

  const category = await Category.findById(req.params.id);
  if (!category) {
    return res.status(404).json({
      success: false,
      message: 'Category not found'
    });
  }

  // Check if category can be deleted
  const canDelete = await category.canBeDeleted();
  if (!canDelete) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete category with books or subcategories'
    });
  }

  await Category.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Category deleted successfully'
  });
}));

// @desc    Get categories with book counts
// @route   GET /api/categories/stats/counts
// @access  Public
router.get('/stats/counts', asyncHandler(async (req, res) => {
  const categories = await Category.getCategoriesWithCounts();

  res.json({
    success: true,
    data: { categories }
  });
}));

// @desc    Get category hierarchy
// @route   GET /api/categories/hierarchy
// @access  Public
router.get('/hierarchy', asyncHandler(async (req, res) => {
  const hierarchy = await Category.getCategoryHierarchy();

  res.json({
    success: true,
    data: { hierarchy }
  });
}));

// @desc    Get popular categories
// @route   GET /api/categories/popular
// @access  Public
router.get('/popular', asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const categories = await Category.getPopularCategories(limit);

  res.json({
    success: true,
    data: { categories }
  });
}));

// @desc    Get subcategories
// @route   GET /api/categories/:id/subcategories
// @access  Public
router.get('/:id/subcategories', asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    return res.status(404).json({
      success: false,
      message: 'Category not found'
    });
  }

  const subcategories = await category.getSubcategories();

  res.json({
    success: true,
    data: { subcategories }
  });
}));

module.exports = router;
