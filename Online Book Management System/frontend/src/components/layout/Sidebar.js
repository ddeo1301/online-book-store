import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Divider,
  Chip,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Book as BookIcon,
  People as PeopleIcon,
  LibraryBooks as LibraryBooksIcon,
  Category as CategoryIcon,
  Assessment as AssessmentIcon,
  Person as PersonIcon,
  Add as AddIcon,
  Edit as EditIcon,
} from '@mui/icons-material';

const drawerWidth = 240;

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);

  const menuItems = [
    {
      text: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/dashboard',
      roles: ['admin', 'librarian', 'member'],
    },
    {
      text: 'Books',
      icon: <BookIcon />,
      path: '/books',
      roles: ['admin', 'librarian', 'member'],
    },
    {
      text: 'Add Book',
      icon: <AddIcon />,
      path: '/books/add',
      roles: ['admin', 'librarian'],
    },
    {
      text: 'Users',
      icon: <PeopleIcon />,
      path: '/users',
      roles: ['admin', 'librarian'],
    },
    {
      text: 'Borrowings',
      icon: <LibraryBooksIcon />,
      path: '/borrowings',
      roles: ['admin', 'librarian'],
    },
    {
      text: 'Categories',
      icon: <CategoryIcon />,
      path: '/categories',
      roles: ['admin', 'librarian'],
    },
    {
      text: 'Reports',
      icon: <AssessmentIcon />,
      path: '/reports',
      roles: ['admin', 'librarian'],
    },
    {
      text: 'Profile',
      icon: <PersonIcon />,
      path: '/profile',
      roles: ['admin', 'librarian', 'member'],
    },
  ];

  const filteredMenuItems = menuItems.filter((item) =>
    item.roles.includes(user?.role)
  );

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: '#f5f5f5',
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" color="primary" gutterBottom>
          Library System
        </Typography>
        <Chip
          label={user?.role?.toUpperCase()}
          color="primary"
          size="small"
          variant="outlined"
        />
      </Box>
      
      <Divider />
      
      <List>
        {filteredMenuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => handleNavigation(item.path)}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'white',
                  },
                },
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
};

export default Sidebar;
