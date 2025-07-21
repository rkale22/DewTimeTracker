import React from 'react';
import { Drawer, List, ListItem, ListItemIcon, ListItemText, Toolbar, Divider, ListItemButton, Box, Avatar, Typography } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventNoteIcon from '@mui/icons-material/EventNote';
import GroupIcon from '@mui/icons-material/Group';
import BusinessIcon from '@mui/icons-material/Business';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import { useAuth } from '../utils/AuthContext';
import { Link } from 'react-router-dom';

const drawerWidth = 220;

const Sidebar: React.FC = () => {
  const { userRole, userName, company } = useAuth();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' },
      }}
    >
      <div>
        <Toolbar />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 2 }}>
          <img src="/DewLogo.png" alt="Dew Logo" style={{ height: 48 }} />
        </Box>
        <List>
          <ListItem disablePadding>
            <ListItemButton component={Link} to="/dashboard">
              <ListItemIcon><DashboardIcon color="primary" /></ListItemIcon>
              <ListItemText primary="Dashboard" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton component={Link} to="/timesheets">
              <ListItemIcon><AccessTimeIcon color="primary" /></ListItemIcon>
              <ListItemText primary="Timesheets" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton component={Link} to="/time-off">
              <ListItemIcon><EventNoteIcon color="primary" /></ListItemIcon>
              <ListItemText primary="Time Off" />
            </ListItemButton>
          </ListItem>
          {userRole === 'client_manager' && (
            <ListItem disablePadding>
              <ListItemButton component={Link} to="/approvals">
                <ListItemIcon><AssignmentTurnedInIcon color="primary" /></ListItemIcon>
                <ListItemText primary="Approvals" />
              </ListItemButton>
            </ListItem>
          )}
          {userRole === 'dew_admin' && (
            <>
              <Divider sx={{ my: 1 }} />
              <ListItem disablePadding>
                <ListItemButton component={Link} to="/clients">
                  <ListItemIcon><BusinessIcon color="primary" /></ListItemIcon>
                  <ListItemText primary="Clients" />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton component={Link} to="/employees">
                  <ListItemIcon><GroupIcon color="primary" /></ListItemIcon>
                  <ListItemText primary="Employees" />
                </ListItemButton>
              </ListItem>
            </>
          )}
        </List>
      </div>
      <Box sx={{ p: 2, borderTop: '1px solid #eee', display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
          {userName ? userName.charAt(0).toUpperCase() : 'U'}
        </Avatar>
        <Box>
          <Typography variant="subtitle2" fontWeight={600}>{userName || 'User'}</Typography>
          <Typography variant="caption" color="text.secondary">{userRole} @ {company || 'Dew'}</Typography>
        </Box>
      </Box>
    </Drawer>
  );
};

export default Sidebar; 