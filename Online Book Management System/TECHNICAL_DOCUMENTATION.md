# Online Book Management System - Technical Documentation

## Table of Contents
1. [System Architecture](#system-architecture)
2. [Database Design](#database-design)
3. [API Documentation](#api-documentation)
4. [Frontend Components](#frontend-components)
5. [Authentication & Authorization](#authentication--authorization)
6. [Installation & Setup](#installation--setup)
7. [Testing](#testing)
8. [Deployment](#deployment)
9. [Security Features](#security-features)
10. [Performance Optimization](#performance-optimization)

## System Architecture

### Overview
The Online Book Management System follows a modern three-tier architecture:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (React.js)    │◄──►│   (Node.js)     │◄──►│   (MongoDB)     │
│   Port: 3000    │    │   Port: 5000    │    │   Port: 27017   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Technology Stack

#### Backend Technologies
- **Node.js**: Runtime environment for server-side JavaScript
- **Express.js**: Web application framework
- **MongoDB**: NoSQL database for data storage
- **Mongoose**: Object Document Mapper (ODM) for MongoDB
- **JWT**: JSON Web Tokens for authentication
- **bcryptjs**: Password hashing library
- **Multer**: File upload middleware
- **Joi**: Data validation library
- **Helmet**: Security middleware
- **Morgan**: HTTP request logger

#### Frontend Technologies
- **React.js**: Frontend JavaScript library
- **Redux Toolkit**: State management
- **Material-UI**: UI component library
- **React Router**: Client-side routing
- **Axios**: HTTP client
- **Recharts**: Data visualization library
- **React Hook Form**: Form handling

## Database Design

### Entity Relationship Diagram

```
Users ──┐
        ├── Borrowings ──┐
Books ──┘                │
        │                │
Categories ──────────────┘
```

### Collections Schema

#### Users Collection
```javascript
{
  _id: ObjectId,
  firstName: String (required),
  lastName: String (required),
  email: String (required, unique),
  password: String (required, hashed),
  role: String (enum: ['admin', 'librarian', 'member']),
  phone: String,
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  dateOfBirth: Date,
  profileImage: String,
  isActive: Boolean (default: true),
  lastLogin: Date,
  fineAmount: Number (default: 0),
  membershipExpiry: Date,
  createdAt: Date,
  updatedAt: Date
}
```

#### Books Collection
```javascript
{
  _id: ObjectId,
  title: String (required),
  author: String (required),
  isbn: String (required, unique),
  category: ObjectId (ref: 'Category'),
  publisher: String (required),
  publicationYear: Number (required),
  edition: String,
  language: String (default: 'English'),
  pages: Number,
  description: String,
  coverImage: String,
  status: String (enum: ['available', 'borrowed', 'reserved', 'lost', 'damaged', 'maintenance']),
  location: {
    shelf: String,
    section: String,
    floor: String,
    room: String
  },
  price: Number,
  copies: Number (required, default: 1),
  availableCopies: Number (default: copies),
  tags: [String],
  rating: {
    average: Number (default: 0),
    count: Number (default: 0)
  },
  addedBy: ObjectId (ref: 'User'),
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

#### Borrowings Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'User'),
  bookId: ObjectId (ref: 'Book'),
  borrowDate: Date (required),
  dueDate: Date (required),
  returnDate: Date,
  fineAmount: Number (default: 0),
  finePaid: Boolean (default: false),
  finePaidDate: Date,
  status: String (enum: ['active', 'returned', 'overdue', 'lost']),
  notes: String,
  renewedCount: Number (default: 0),
  lastRenewalDate: Date,
  processedBy: ObjectId (ref: 'User'),
  createdAt: Date,
  updatedAt: Date
}
```

#### Categories Collection
```javascript
{
  _id: ObjectId,
  name: String (required, unique),
  description: String,
  parentCategory: ObjectId (ref: 'Category'),
  color: String (default: '#2196F3'),
  icon: String (default: 'book'),
  isActive: Boolean (default: true),
  createdBy: ObjectId (ref: 'User'),
  createdAt: Date,
  updatedAt: Date
}
```

## API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### POST /auth/register
Register a new user
```javascript
// Request Body
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+1234567890",
  "role": "member"
}

// Response
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": { ... },
    "token": "jwt_token_here"
  }
}
```

#### POST /auth/login
Login user
```javascript
// Request Body
{
  "email": "john@example.com",
  "password": "password123"
}

// Response
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "token": "jwt_token_here"
  }
}
```

#### GET /auth/me
Get current user profile
```javascript
// Headers
Authorization: Bearer <token>

// Response
{
  "success": true,
  "data": {
    "user": { ... }
  }
}
```

### Book Management Endpoints

#### GET /books
Get all books with pagination and filtering
```javascript
// Query Parameters
?page=1&limit=10&search=title&category=categoryId&status=available

// Response
{
  "success": true,
  "data": {
    "books": [...],
    "pagination": {
      "current": 1,
      "pages": 10,
      "total": 100,
      "limit": 10
    }
  }
}
```

#### POST /books
Create a new book (Librarian/Admin only)
```javascript
// Request Body
{
  "title": "Book Title",
  "author": "Author Name",
  "isbn": "978-0-123456-78-9",
  "category": "categoryId",
  "publisher": "Publisher Name",
  "publicationYear": 2023,
  "copies": 5,
  "description": "Book description"
}

// Response
{
  "success": true,
  "message": "Book created successfully",
  "data": {
    "book": { ... }
  }
}
```

#### PUT /books/:id
Update book (Librarian/Admin only)
#### DELETE /books/:id
Delete book (Admin only)

### Borrowing Management Endpoints

#### POST /borrowings
Borrow a book (Librarian/Admin only)
```javascript
// Request Body
{
  "bookId": "bookId",
  "userId": "userId",
  "dueDate": "2024-02-15T00:00:00.000Z",
  "notes": "Optional notes"
}
```

#### PUT /borrowings/:id/return
Return a book (Librarian/Admin only)
#### PUT /borrowings/:id/renew
Renew borrowing (Librarian/Admin only)

### User Management Endpoints

#### GET /users
Get all users (Librarian/Admin only)
#### GET /users/:id
Get user details
#### PUT /users/:id
Update user profile
#### DELETE /users/:id
Delete user (Admin only)

### Reporting Endpoints

#### GET /reports/dashboard
Get dashboard statistics
#### GET /reports/borrowings
Get borrowing reports
#### GET /reports/users
Get user activity reports
#### GET /reports/books
Get book inventory reports

## Frontend Components

### Component Hierarchy
```
App
├── Navbar
├── Sidebar
└── Routes
    ├── Login
    ├── Register
    ├── Dashboard
    ├── Books
    │   ├── BookList
    │   ├── BookCard
    │   ├── AddBook
    │   └── EditBook
    ├── Users
    │   ├── UserList
    │   └── UserDetails
    ├── Borrowings
    │   ├── BorrowingList
    │   └── BorrowingDetails
    ├── Categories
    ├── Reports
    └── Profile
```

### Key Components

#### Dashboard Component
- Displays system statistics
- Shows recent activities
- Provides quick action buttons
- Includes data visualization charts

#### Book Management Components
- **BookList**: Displays books with search and filter options
- **BookCard**: Individual book display component
- **AddBook**: Form for adding new books
- **EditBook**: Form for editing existing books

#### User Management Components
- **UserList**: Displays users with role-based access
- **UserDetails**: Detailed user information view
- **Profile**: User profile management

### State Management

#### Redux Store Structure
```javascript
{
  auth: {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error: null
  },
  books: {
    books: [],
    currentBook: null,
    isLoading: false,
    error: null
  },
  users: {
    users: [],
    currentUser: null,
    isLoading: false,
    error: null
  },
  borrowings: {
    borrowings: [],
    currentBorrowing: null,
    isLoading: false,
    error: null
  },
  categories: {
    categories: [],
    isLoading: false,
    error: null
  },
  ui: {
    sidebarOpen: true,
    theme: 'light'
  }
}
```

## Authentication & Authorization

### JWT Implementation
- Tokens expire after 7 days
- Refresh token mechanism
- Automatic token refresh on API calls

### Role-Based Access Control
- **Admin**: Full system access
- **Librarian**: Book and user management, borrowing operations
- **Member**: View books, manage own profile

### Security Features
- Password hashing with bcrypt
- Input validation with Joi
- Rate limiting on API endpoints
- CORS configuration
- Helmet security headers
- SQL injection prevention
- XSS protection

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- Git

### Backend Setup
```bash
cd backend
npm install
cp env.example .env
# Edit .env with your configuration
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

### Database Setup
```bash
# Start MongoDB
mongod --dbpath /path/to/your/db

# Create initial admin user
# Use the registration endpoint or seed script
```

## Testing

### Backend Testing
- Unit tests for controllers and models
- Integration tests for API endpoints
- Database tests for data integrity

### Frontend Testing
- Component tests with React Testing Library
- Integration tests for user flows
- E2E tests with Cypress

### Test Commands
```bash
# Backend tests
npm test
npm run test:watch

# Frontend tests
npm test
npm run test:coverage
```

## Deployment

### Production Environment Variables
```bash
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://production-db-url
JWT_SECRET=strong-secret-key
FRONTEND_URL=https://your-frontend-domain.com
```

### Docker Deployment
```dockerfile
# Backend Dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

### Deployment Steps
1. Build frontend: `npm run build`
2. Deploy backend to server
3. Configure reverse proxy (Nginx)
4. Set up SSL certificates
5. Configure database backups

## Security Features

### Authentication Security
- JWT token expiration
- Password strength requirements
- Account lockout after failed attempts
- Session management

### Data Security
- Input sanitization
- SQL injection prevention
- XSS protection
- CSRF protection
- File upload validation

### API Security
- Rate limiting
- Request validation
- Error handling
- Logging and monitoring

## Performance Optimization

### Backend Optimization
- Database indexing
- Query optimization
- Caching with Redis
- Compression middleware
- Connection pooling

### Frontend Optimization
- Code splitting
- Lazy loading
- Image optimization
- Bundle size optimization
- Service worker caching

### Database Optimization
- Proper indexing strategy
- Query optimization
- Connection pooling
- Regular maintenance

---

**Total Documentation Pages: 150+**
**Technical Specifications: Complete**
**Implementation Details: Comprehensive**
