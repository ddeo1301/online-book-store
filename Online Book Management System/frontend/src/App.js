import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Box } from '@mui/material';

// Components
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import LoadingSpinner from './components/common/LoadingSpinner';

// Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
import Books from './pages/Books';
import BookDetails from './pages/BookDetails';
import AddBook from './pages/AddBook';
import EditBook from './pages/EditBook';
import Users from './pages/Users';
import UserDetails from './pages/UserDetails';
import Borrowings from './pages/Borrowings';
import BorrowingDetails from './pages/BorrowingDetails';
import Categories from './pages/Categories';
import Reports from './pages/Reports';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Public Route Component (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  const { isAuthenticated, isLoading } = useSelector((state) => state.auth);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {isAuthenticated && <Sidebar />}
      
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {isAuthenticated && <Navbar />}
        
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Routes>
            {/* Public Routes */}
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } 
            />
            <Route 
              path="/register" 
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              } 
            />

            {/* Protected Routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />

            {/* Book Routes */}
            <Route 
              path="/books" 
              element={
                <ProtectedRoute>
                  <Books />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/books/:id" 
              element={
                <ProtectedRoute>
                  <BookDetails />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/books/add" 
              element={
                <ProtectedRoute requiredRole="librarian">
                  <AddBook />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/books/:id/edit" 
              element={
                <ProtectedRoute requiredRole="librarian">
                  <EditBook />
                </ProtectedRoute>
              } 
            />

            {/* User Routes */}
            <Route 
              path="/users" 
              element={
                <ProtectedRoute requiredRole="librarian">
                  <Users />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/users/:id" 
              element={
                <ProtectedRoute>
                  <UserDetails />
                </ProtectedRoute>
              } 
            />

            {/* Borrowing Routes */}
            <Route 
              path="/borrowings" 
              element={
                <ProtectedRoute requiredRole="librarian">
                  <Borrowings />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/borrowings/:id" 
              element={
                <ProtectedRoute requiredRole="librarian">
                  <BorrowingDetails />
                </ProtectedRoute>
              } 
            />

            {/* Category Routes */}
            <Route 
              path="/categories" 
              element={
                <ProtectedRoute requiredRole="librarian">
                  <Categories />
                </ProtectedRoute>
              } 
            />

            {/* Report Routes */}
            <Route 
              path="/reports" 
              element={
                <ProtectedRoute requiredRole="librarian">
                  <Reports />
                </ProtectedRoute>
              } 
            />

            {/* Profile Route */}
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />

            {/* Default Routes */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Box>
      </Box>
    </Box>
  );
}

export default App;
