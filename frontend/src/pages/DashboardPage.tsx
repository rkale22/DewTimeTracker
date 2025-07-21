import React from 'react';
import { Box, Typography } from '@mui/material';
import { useAuth } from '../utils/AuthContext';

const DashboardPage: React.FC = () => {
  const { userRole } = useAuth();

  return (
    <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Typography variant="h4" color="primary" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="subtitle1" gutterBottom>
        Welcome! Your role: <b>{userRole}</b>
      </Typography>
    </Box>
  );
};

export default DashboardPage; 