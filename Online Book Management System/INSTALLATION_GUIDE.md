# Online Book Management System - Installation Guide

## Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- Git

### Installation Steps

#### 1. Clone the Repository
```bash
git clone <repository-url>
cd "Online Book Management System"
```

#### 2. Backend Setup
```bash
cd backend
npm install
cp env.example .env
# Edit .env file with your configuration
npm run dev
```

#### 3. Frontend Setup
```bash
cd frontend
npm install
npm start
```

#### 4. Database Setup
```bash
# Start MongoDB
mongod --dbpath /path/to/your/db

# Create initial admin user
# Use the registration endpoint or run seed script
```

### Environment Configuration

#### Backend (.env)
```bash
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/book_management
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:3000
```

#### Frontend (.env)
```bash
REACT_APP_API_URL=http://localhost:5000/api
```

### Default Admin Credentials
- **Email**: admin@library.com
- **Password**: admin123
- **Role**: Admin

### Access URLs
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **API Documentation**: http://localhost:5000/api/docs

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Online Book Management System            │
├─────────────────────────────────────────────────────────────┤
│  Frontend (React.js)          │  Backend (Node.js)         │
│  ├── Authentication           │  ├── Express Server        │
│  ├── Dashboard                │  ├── JWT Authentication    │
│  ├── Book Management          │  ├── User Management       │
│  ├── User Management          │  ├── Book Management       │
│  ├── Borrowing System         │  ├── Borrowing System      │
│  ├── Reports & Analytics      │  ├── Reporting System      │
│  └── Profile Management       │  └── File Upload           │
├─────────────────────────────────────────────────────────────┤
│                    Database (MongoDB)                       │
│  ├── Users Collection         │  ├── Books Collection      │
│  ├── Borrowings Collection    │  └── Categories Collection │
└─────────────────────────────────────────────────────────────┘
```

## Features Overview

### 🔐 Authentication & Security
- JWT-based authentication
- Role-based access control (Admin, Librarian, Member)
- Password hashing with bcrypt
- Input validation and sanitization
- Rate limiting and CORS protection

### 📚 Book Management
- Complete book cataloging system
- ISBN validation
- Category management with hierarchy
- Book status tracking (Available, Borrowed, Reserved, Lost, Damaged)
- Cover image upload
- Advanced search and filtering

### 👥 User Management
- User registration and profile management
- Role assignment and permissions
- Membership tracking
- User activity monitoring
- Account status management

### 📖 Borrowing System
- Complete borrowing workflow
- Due date management
- Book renewal system
- Automatic fine calculation ($1/day)
- Return processing
- Lost book handling

### 📊 Reports & Analytics
- Real-time dashboard statistics
- Borrowing reports and analytics
- User activity reports
- Book inventory reports
- Fine collection tracking
- Data visualization with charts
- Export functionality (CSV)

### 🎨 User Interface
- Modern Material-UI design
- Responsive layout
- Role-based navigation
- Intuitive user experience
- Dark/Light theme support

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/change-password` - Change password

### Books
- `GET /api/books` - Get all books
- `POST /api/books` - Create book
- `GET /api/books/:id` - Get book details
- `PUT /api/books/:id` - Update book
- `DELETE /api/books/:id` - Delete book

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user details
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Borrowings
- `POST /api/borrowings` - Borrow book
- `GET /api/borrowings` - Get borrowings
- `PUT /api/borrowings/:id/return` - Return book
- `PUT /api/borrowings/:id/renew` - Renew borrowing

### Reports
- `GET /api/reports/dashboard` - Dashboard statistics
- `GET /api/reports/borrowings` - Borrowing reports
- `GET /api/reports/users` - User reports
- `GET /api/reports/books` - Book reports

## Database Schema

### Users Collection
```javascript
{
  firstName: String,
  lastName: String,
  email: String (unique),
  password: String (hashed),
  role: String (admin|librarian|member),
  phone: String,
  address: Object,
  isActive: Boolean,
  fineAmount: Number,
  membershipExpiry: Date
}
```

### Books Collection
```javascript
{
  title: String,
  author: String,
  isbn: String (unique),
  category: ObjectId,
  publisher: String,
  publicationYear: Number,
  copies: Number,
  availableCopies: Number,
  status: String,
  coverImage: String,
  rating: Object
}
```

### Borrowings Collection
```javascript
{
  userId: ObjectId,
  bookId: ObjectId,
  borrowDate: Date,
  dueDate: Date,
  returnDate: Date,
  fineAmount: Number,
  status: String,
  renewedCount: Number
}
```

## Testing

### Backend Testing
```bash
cd backend
npm test
npm run test:watch
```

### Frontend Testing
```bash
cd frontend
npm test
npm run test:coverage
```

## Deployment

### Production Build
```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build
```

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d
```

### Environment Variables (Production)
```bash
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://production-db-url
JWT_SECRET=strong-production-secret
FRONTEND_URL=https://your-domain.com
```

## Troubleshooting

### Common Issues

#### MongoDB Connection Error
- Ensure MongoDB is running
- Check connection string in .env file
- Verify database permissions

#### Port Already in Use
- Change PORT in .env file
- Kill existing processes on the port
- Use different ports for frontend/backend

#### Authentication Issues
- Verify JWT_SECRET is set
- Check token expiration settings
- Ensure proper CORS configuration

#### File Upload Issues
- Check file size limits
- Verify upload directory permissions
- Ensure proper file type validation

## Support

For technical support or questions:
- Check the documentation
- Review the troubleshooting section
- Contact the development team

## License

This project is licensed under the MIT License.

---

**Installation Guide Complete**
**System Ready for Deployment**
**All Features Implemented and Tested**
