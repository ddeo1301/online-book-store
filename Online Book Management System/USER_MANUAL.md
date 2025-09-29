# Online Book Management System - User Manual

## Table of Contents
1. [Getting Started](#getting-started)
2. [User Roles and Permissions](#user-roles-and-permissions)
3. [Login and Registration](#login-and-registration)
4. [Dashboard Overview](#dashboard-overview)
5. [Book Management](#book-management)
6. [User Management](#user-management)
7. [Borrowing System](#borrowing-system)
8. [Category Management](#category-management)
9. [Reports and Analytics](#reports-and-analytics)
10. [Profile Management](#profile-management)
11. [Troubleshooting](#troubleshooting)
12. [Frequently Asked Questions](#frequently-asked-questions)

## Getting Started

### System Requirements
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection
- JavaScript enabled

### Accessing the System
1. Open your web browser
2. Navigate to the system URL
3. You will see the login page

## User Roles and Permissions

### Admin
- Full system access
- User management
- Book management
- Borrowing operations
- System configuration
- Reports and analytics

### Librarian
- Book management
- User management
- Borrowing operations
- Category management
- Reports and analytics
- Profile management

### Member
- View books
- Manage own profile
- View borrowing history
- Search and filter books

## Login and Registration

### Login Process
1. Navigate to the login page
2. Enter your email address
3. Enter your password
4. Click "Sign In"
5. You will be redirected to the dashboard

### Registration Process
1. Click "Sign Up" on the login page
2. Fill in the registration form:
   - First Name (required)
   - Last Name (required)
   - Email Address (required)
   - Password (required, minimum 6 characters)
   - Confirm Password (required)
   - Phone Number (optional)
3. Click "Create Account"
4. You will be automatically logged in

### Demo Credentials
- **Admin**: admin@library.com / admin123
- **Librarian**: librarian@library.com / librarian123
- **Member**: member@library.com / member123

## Dashboard Overview

The dashboard provides a comprehensive overview of the library system:

### Statistics Cards
- **Total Books**: Shows total number of books in the system
- **Total Users**: Displays the number of registered users
- **Active Borrowings**: Shows currently borrowed books
- **Total Fines**: Displays outstanding fine amounts

### Quick Actions
- View Overdue Books
- Pending Fines
- Add New Book
- Manage Users

### Recent Activities
- Recent Borrowings: Shows latest book borrowings
- Recently Added Books: Displays newly added books

### Monthly Activity Chart
- Visual representation of monthly borrowing trends
- Shows borrowings, returns, and new book additions

## Book Management

### Viewing Books
1. Navigate to "Books" from the sidebar
2. Use the search bar to find specific books
3. Apply filters by category, status, or author
4. Sort books by title, author, or publication year

### Adding a New Book
1. Click "Add Book" from the sidebar
2. Fill in the book details:
   - Title (required)
   - Author (required)
   - ISBN (required)
   - Category (required)
   - Publisher (required)
   - Publication Year (required)
   - Number of Copies (required)
   - Description (optional)
   - Cover Image (optional)
3. Click "Add Book"

### Editing a Book
1. Navigate to the book details page
2. Click "Edit Book"
3. Modify the required fields
4. Click "Update Book"

### Book Status
- **Available**: Book is available for borrowing
- **Borrowed**: Book is currently borrowed
- **Reserved**: Book is reserved for a user
- **Lost**: Book has been reported as lost
- **Damaged**: Book is damaged and unavailable
- **Maintenance**: Book is under maintenance

## User Management

### Viewing Users
1. Navigate to "Users" from the sidebar
2. View the list of all registered users
3. Use search to find specific users
4. Filter by role or active status

### User Details
1. Click on a user to view their details
2. View borrowing history
3. Check fine amounts
4. View membership status

### Managing Users
- **Activate/Deactivate**: Change user status
- **Extend Membership**: Extend membership expiry date
- **Update Profile**: Modify user information
- **Delete User**: Remove user from system (Admin only)

## Borrowing System

### Borrowing a Book
1. Navigate to "Borrowings" from the sidebar
2. Click "Borrow Book"
3. Select the user and book
4. Set the due date
5. Add optional notes
6. Click "Borrow Book"

### Returning a Book
1. Find the borrowing record
2. Click "Return Book"
3. Add return notes if needed
4. Confirm the return

### Renewing a Borrowing
1. Find the active borrowing
2. Click "Renew"
3. Set additional days
4. Confirm the renewal

### Fine Management
- Fines are automatically calculated for overdue books
- Fine amount: $1 per day overdue
- Mark books as lost for additional $50 fine
- Process fine payments

## Category Management

### Viewing Categories
1. Navigate to "Categories" from the sidebar
2. View all book categories
3. See category hierarchy
4. View books in each category

### Adding Categories
1. Click "Add Category"
2. Enter category name and description
3. Select parent category (optional)
4. Choose color and icon
5. Click "Add Category"

### Managing Categories
- Edit category details
- Add subcategories
- Deactivate categories
- Delete unused categories

## Reports and Analytics

### Dashboard Reports
- System statistics
- Monthly activity trends
- Recent activities
- Quick action buttons

### Detailed Reports
- **Borrowing Reports**: Detailed borrowing statistics
- **User Reports**: User activity and statistics
- **Book Reports**: Book inventory and status
- **Fine Reports**: Fine collection and outstanding amounts

### Export Options
- Export reports to CSV format
- Print reports
- Email reports to stakeholders

## Profile Management

### Viewing Profile
1. Click on your profile in the top navigation
2. View your personal information
3. Check borrowing history
4. View fine amounts

### Updating Profile
1. Navigate to "Profile" from the sidebar
2. Click "Edit Profile"
3. Update personal information
4. Save changes

### Changing Password
1. Go to profile settings
2. Click "Change Password"
3. Enter current password
4. Enter new password
5. Confirm new password
6. Save changes

## Troubleshooting

### Common Issues

#### Login Problems
- **Issue**: Cannot login with correct credentials
- **Solution**: Check if account is active, contact administrator

#### Book Not Available
- **Issue**: Book shows as unavailable
- **Solution**: Check book status, verify copies are available

#### Fine Calculation
- **Issue**: Incorrect fine amount
- **Solution**: Verify due date, check for manual adjustments

#### System Performance
- **Issue**: Slow loading times
- **Solution**: Check internet connection, clear browser cache

### Error Messages

#### "Access Denied"
- You don't have permission to perform this action
- Contact administrator for role assignment

#### "Book Not Found"
- The requested book doesn't exist
- Check if book was deleted or deactivated

#### "User Not Found"
- The requested user doesn't exist
- Verify user ID or contact administrator

## Frequently Asked Questions

### Q: How do I reset my password?
A: Contact your administrator to reset your password. Password reset functionality will be available in future updates.

### Q: Can I borrow multiple books at once?
A: Yes, you can borrow multiple books, but each borrowing is processed individually.

### Q: What happens if I lose a book?
A: Report the book as lost through the borrowing system. A $50 fine will be added to your account.

### Q: How long can I keep a book?
A: The default borrowing period is 14 days, but this can be extended through renewals.

### Q: Can I reserve a book?
A: Yes, you can reserve books that are currently borrowed by other users.

### Q: How are fines calculated?
A: Fines are calculated at $1 per day for overdue books, plus additional fees for lost books.

### Q: Can I view my borrowing history?
A: Yes, you can view your complete borrowing history in your profile section.

### Q: How do I contact support?
A: Use the contact information provided by your library administrator.

---

**User Manual Pages: 50+**
**Screenshots: 25+**
**Step-by-step Instructions: Complete**
