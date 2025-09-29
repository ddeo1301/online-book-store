const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['admin', 'librarian', 'member'],
    default: 'member'
  },
  phone: {
    type: String,
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  dateOfBirth: {
    type: Date
  },
  profileImage: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  fineAmount: {
    type: Number,
    default: 0
  },
  membershipExpiry: {
    type: Date,
    default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for membership status
userSchema.virtual('isMembershipValid').get(function() {
  return this.membershipExpiry > new Date();
});

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT token
userSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { 
      id: this._id, 
      email: this.email, 
      role: this.role 
    },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Update last login
userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save();
};

// Get user's borrowing history
userSchema.methods.getBorrowingHistory = async function() {
  const Borrowing = mongoose.model('Borrowing');
  return await Borrowing.find({ userId: this._id })
    .populate('bookId', 'title author isbn')
    .sort({ borrowDate: -1 });
};

// Get user's current borrowings
userSchema.methods.getCurrentBorrowings = async function() {
  const Borrowing = mongoose.model('Borrowing');
  return await Borrowing.find({ 
    userId: this._id, 
    returnDate: null 
  })
  .populate('bookId', 'title author isbn')
  .sort({ borrowDate: -1 });
};

// Calculate total fine
userSchema.methods.calculateFine = async function() {
  const Borrowing = mongoose.model('Borrowing');
  const overdueBorrowings = await Borrowing.find({
    userId: this._id,
    returnDate: null,
    dueDate: { $lt: new Date() }
  });

  let totalFine = 0;
  const finePerDay = 1; // $1 per day

  overdueBorrowings.forEach(borrowing => {
    const daysOverdue = Math.ceil((new Date() - borrowing.dueDate) / (1000 * 60 * 60 * 24));
    totalFine += daysOverdue * finePerDay;
  });

  this.fineAmount = totalFine;
  await this.save();
  return totalFine;
};

// Static method to find users by role
userSchema.statics.findByRole = function(role) {
  return this.find({ role, isActive: true });
};

// Static method to get user statistics
userSchema.statics.getUserStats = async function() {
  const totalUsers = await this.countDocuments();
  const activeUsers = await this.countDocuments({ isActive: true });
  const adminUsers = await this.countDocuments({ role: 'admin' });
  const librarianUsers = await this.countDocuments({ role: 'librarian' });
  const memberUsers = await this.countDocuments({ role: 'member' });
  
  return {
    totalUsers,
    activeUsers,
    inactiveUsers: totalUsers - activeUsers,
    adminUsers,
    librarianUsers,
    memberUsers
  };
};

module.exports = mongoose.model('User', userSchema);
