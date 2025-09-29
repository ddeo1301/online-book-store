import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
} from '@mui/material';
import {
  Book as BookIcon,
  People as PeopleIcon,
  LibraryBooks as LibraryBooksIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const Dashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Simulate API call - replace with actual API call
      const mockData = {
        stats: {
          totalBooks: 1250,
          availableBooks: 980,
          totalUsers: 450,
          activeBorrowings: 320,
          overdueBorrowings: 15,
          totalFines: 1250,
        },
        recentActivities: {
          recentBorrowings: [
            { id: 1, user: 'John Doe', book: 'The Great Gatsby', date: '2024-01-15' },
            { id: 2, user: 'Jane Smith', book: 'To Kill a Mockingbird', date: '2024-01-14' },
            { id: 3, user: 'Bob Johnson', book: '1984', date: '2024-01-13' },
          ],
          recentlyAddedBooks: [
            { id: 1, title: 'The Catcher in the Rye', author: 'J.D. Salinger', date: '2024-01-15' },
            { id: 2, title: 'Pride and Prejudice', author: 'Jane Austen', date: '2024-01-14' },
            { id: 3, title: 'The Hobbit', author: 'J.R.R. Tolkien', date: '2024-01-13' },
          ],
        },
        monthlyData: [
          { month: 'Jan', borrowings: 45, returns: 42, newBooks: 12 },
          { month: 'Feb', borrowings: 52, returns: 48, newBooks: 8 },
          { month: 'Mar', borrowings: 38, returns: 41, newBooks: 15 },
          { month: 'Apr', borrowings: 61, returns: 55, newBooks: 10 },
          { month: 'May', borrowings: 48, returns: 52, newBooks: 7 },
          { month: 'Jun', borrowings: 55, returns: 49, newBooks: 13 },
        ],
      };
      
      setTimeout(() => {
        setDashboardData(mockData);
        setLoading(false);
      }, 1000);
    } catch (err) {
      setError('Failed to load dashboard data');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  const StatCard = ({ title, value, icon, color, subtitle }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="h6">
              {title}
            </Typography>
            <Typography variant="h4" component="h2" color={color}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="textSecondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Avatar sx={{ bgcolor: color, width: 56, height: 56 }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Welcome back, {user?.firstName}!
      </Typography>
      <Typography variant="subtitle1" color="textSecondary" gutterBottom>
        Here's what's happening in your library today.
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* Statistics Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Books"
            value={dashboardData?.stats.totalBooks}
            icon={<BookIcon />}
            color="primary.main"
            subtitle={`${dashboardData?.stats.availableBooks} available`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Users"
            value={dashboardData?.stats.totalUsers}
            icon={<PeopleIcon />}
            color="success.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Borrowings"
            value={dashboardData?.stats.activeBorrowings}
            icon={<LibraryBooksIcon />}
            color="info.main"
            subtitle={`${dashboardData?.stats.overdueBorrowings} overdue`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Fines"
            value={`$${dashboardData?.stats.totalFines}`}
            icon={<TrendingUpIcon />}
            color="warning.main"
          />
        </Grid>

        {/* Charts */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Monthly Activity
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dashboardData?.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="borrowings" stroke="#1976d2" strokeWidth={2} />
                <Line type="monotone" dataKey="returns" stroke="#dc004e" strokeWidth={2} />
                <Line type="monotone" dataKey="newBooks" stroke="#2e7d32" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Box display="flex" flexDirection="column" gap={1}>
              <Chip
                icon={<ScheduleIcon />}
                label="View Overdue Books"
                color="warning"
                variant="outlined"
                clickable
                sx={{ justifyContent: 'flex-start' }}
              />
              <Chip
                icon={<WarningIcon />}
                label="Pending Fines"
                color="error"
                variant="outlined"
                clickable
                sx={{ justifyContent: 'flex-start' }}
              />
              <Chip
                icon={<BookIcon />}
                label="Add New Book"
                color="primary"
                variant="outlined"
                clickable
                sx={{ justifyContent: 'flex-start' }}
              />
              <Chip
                icon={<PeopleIcon />}
                label="Manage Users"
                color="secondary"
                variant="outlined"
                clickable
                sx={{ justifyContent: 'flex-start' }}
              />
            </Box>
          </Paper>
        </Grid>

        {/* Recent Activities */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Borrowings
            </Typography>
            <List>
              {dashboardData?.recentActivities.recentBorrowings.map((activity, index) => (
                <React.Fragment key={activity.id}>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar>
                        <LibraryBooksIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={`${activity.user} borrowed "${activity.book}"`}
                      secondary={activity.date}
                    />
                  </ListItem>
                  {index < dashboardData.recentActivities.recentBorrowings.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recently Added Books
            </Typography>
            <List>
              {dashboardData?.recentActivities.recentlyAddedBooks.map((book, index) => (
                <React.Fragment key={book.id}>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar>
                        <BookIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={book.title}
                      secondary={`by ${book.author} • ${book.date}`}
                    />
                  </ListItem>
                  {index < dashboardData.recentActivities.recentlyAddedBooks.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
