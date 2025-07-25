import React, { useState, useEffect } from 'react';
import { Box, Typography, Alert, CircularProgress, Card, CardContent } from '@mui/material';
import { useAuth } from '../utils/AuthContext';
import { getDashboardSummary, DashboardSummary } from '../services/dashboardService';
import TrackedHoursBarChart from '../components/TrackedHoursBarChart';
import TeamHoursBarChart from '../components/TeamHoursBarChart';

const DashboardPage: React.FC = () => {
  const { userRole, token, userName: authUserName } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch dashboard data on component mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!token) {
        setError('No authentication token available');
        setLoading(false);
        return;
      }

      try {
        const data = await getDashboardSummary(token);
        setDashboardData(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
        console.error('Dashboard API error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [token]);

  // Loading state
  if (loading) {
    return (
      <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography variant="h4" color="primary" gutterBottom>
          Dashboard
        </Typography>
        <CircularProgress sx={{ mt: 4 }} />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading dashboard data...
        </Typography>
      </Box>
    );
  }

  // Error state
  if (error) {
  return (
    <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Typography variant="h4" color="primary" gutterBottom>
        Dashboard
      </Typography>
        <Alert severity="error" sx={{ mt: 2, mb: 2, width: '100%', maxWidth: 600 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  // Main dashboard content
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: 3,
      maxWidth: '100%'
    }}>
      {/* Dashboard Header */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 1,
        mb: 2
      }}>
        <Typography variant="h4" color="primary" sx={{ fontWeight: 600 }}>
          Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Welcome to your personalized dashboard
        </Typography>
      </Box>
      
      {dashboardData && (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 3,
          width: '100%',
          maxWidth: '1200px',
          mx: 'auto'
        }}>
          {/* Welcome Card */}
          <Card sx={{ 
            background: 'linear-gradient(135deg, #003366 0%, #004080 100%)',
            color: 'white',
            boxShadow: '0 4px 12px rgba(0, 51, 102, 0.15)'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: 'white' }}>
                Welcome, {('userName' in dashboardData && dashboardData.userName) ? dashboardData.userName : (authUserName || 'User')}!
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                Your role: <b>{userRole}</b>
              </Typography>
            </CardContent>
          </Card>

          {/* Role-specific widgets */}
          {userRole === 'client_manager' && 'pendingApprovals' in dashboardData && (
            <Card sx={{ 
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(0, 51, 102, 0.1)'
            }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#003366' }}>
                  Pending Approvals
                </Typography>
                <Box sx={{ display: 'flex', gap: 3, mt: 2 }}>
                  <Box sx={{ 
                    textAlign: 'center', 
                    flex: 1, 
                    p: 2, 
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                    border: '1px solid rgba(0, 51, 102, 0.1)'
                  }}>
                    <Typography variant="h3" color="primary" sx={{ fontWeight: 700 }}>
                      {dashboardData.pendingApprovals.timesheets}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                      Timesheets
                    </Typography>
                  </Box>
                  <Box sx={{ 
                    textAlign: 'center', 
                    flex: 1, 
                    p: 2, 
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                    border: '1px solid rgba(0, 51, 102, 0.1)'
                  }}>
                    <Typography variant="h3" color="primary" sx={{ fontWeight: 700 }}>
                      {dashboardData.pendingApprovals.timeoff}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                      Time Off Requests
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Team Tracked Hours Bar Chart (Manager) */}
          {userRole === 'client_manager' && 'teamTrackedHours' in dashboardData && (
            <TeamHoursBarChart 
              data={dashboardData.teamTrackedHours}
              title="Team Tracked Hours"
              height={300}
            />
          )}

          {/* Upcoming Team Time Off Widget (Manager) */}
          {userRole === 'client_manager' && 'upcomingTeamTimeOff' in dashboardData && (
            <Card sx={{ 
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(0, 51, 102, 0.1)'
            }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#003366' }}>
                  Upcoming Team Time Off
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                  {dashboardData.upcomingTeamTimeOff.map((entry, index) => (
                    <Box key={index} sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      p: 2, 
                      border: '1px solid rgba(0, 51, 102, 0.1)', 
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        boxShadow: '0 2px 8px rgba(0, 51, 102, 0.15)',
                        transform: 'translateY(-1px)'
                      }
                    }}>
                      <Box>
                        <Typography variant="body1" fontWeight="600" color="#003366">
                          {entry.employee}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {entry.start} - {entry.end}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="primary" sx={{ 
                        textTransform: 'capitalize',
                        fontWeight: 500,
                        px: 2,
                        py: 0.5,
                        borderRadius: 1,
                        background: 'rgba(0, 51, 102, 0.1)'
                      }}>
                        {entry.type}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Tracked Hours Bar Chart (Employee) */}
          {userRole === 'consultant' && 'trackedHours' in dashboardData && (
            <TrackedHoursBarChart 
              data={dashboardData.trackedHours}
              title="Your Tracked Hours"
              height={300}
            />
          )}

          {/* Upcoming Time Off Widget (Employee) */}
          {userRole === 'consultant' && 'upcomingTimeOff' in dashboardData && (
            <Card sx={{ 
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(0, 51, 102, 0.1)'
            }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#003366' }}>
                  Your Upcoming Time Off
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                  {dashboardData.upcomingTimeOff.map((entry, index) => (
                    <Box key={index} sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      p: 2, 
                      border: '1px solid rgba(0, 51, 102, 0.1)', 
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        boxShadow: '0 2px 8px rgba(0, 51, 102, 0.15)',
                        transform: 'translateY(-1px)'
                      }
                    }}>
                      <Box>
                        <Typography variant="body1" fontWeight="600" color="#003366">
                          {entry.start} - {entry.end}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Status: {entry.status}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="primary" sx={{ 
                        textTransform: 'capitalize',
                        fontWeight: 500,
                        px: 2,
                        py: 0.5,
                        borderRadius: 1,
                        background: 'rgba(0, 51, 102, 0.1)'
                      }}>
                        {entry.type}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Org Stats Widget (Admin) */}
          {userRole === 'dew_admin' && 'orgStats' in dashboardData && (
            <Card sx={{ 
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(0, 51, 102, 0.1)'
            }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#003366' }}>
                  Organization Statistics
                </Typography>
                <Box sx={{ display: 'flex', gap: 3, mt: 2 }}>
                  <Box sx={{ 
                    textAlign: 'center', 
                    flex: 1, 
                    p: 2, 
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                    border: '1px solid rgba(0, 51, 102, 0.1)',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      boxShadow: '0 2px 8px rgba(0, 51, 102, 0.15)',
                      transform: 'translateY(-1px)'
                    }
                  }}>
                    <Typography variant="h3" color="primary" sx={{ fontWeight: 700 }}>
                      {dashboardData.orgStats.totalUsers}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                      Total Users
                    </Typography>
                  </Box>
                  <Box sx={{ 
                    textAlign: 'center', 
                    flex: 1, 
                    p: 2, 
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                    border: '1px solid rgba(0, 51, 102, 0.1)',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      boxShadow: '0 2px 8px rgba(0, 51, 102, 0.15)',
                      transform: 'translateY(-1px)'
                    }
                  }}>
                    <Typography variant="h3" color="primary" sx={{ fontWeight: 700 }}>
                      {dashboardData.orgStats.totalTimesheets}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                      Total Timesheets
                    </Typography>
                  </Box>
                  <Box sx={{ 
                    textAlign: 'center', 
                    flex: 1, 
                    p: 2, 
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                    border: '1px solid rgba(0, 51, 102, 0.1)',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      boxShadow: '0 2px 8px rgba(0, 51, 102, 0.15)',
                      transform: 'translateY(-1px)'
                    }
                  }}>
                    <Typography variant="h3" color="primary" sx={{ fontWeight: 700 }}>
                      {dashboardData.orgStats.totalHours}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                      Total Hours
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          )}

                    {/* Notifications Widget */}
          {'notifications' in dashboardData && dashboardData.notifications.length > 0 && (
            <Card sx={{ 
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(0, 51, 102, 0.1)'
            }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#003366' }}>
                  Notifications
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {dashboardData.notifications.map((notification, index) => (
                    <Alert 
                      key={index} 
                      severity={notification.type === 'error' ? 'error' : 'info'} 
                      sx={{ 
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: notification.type === 'error' ? 'error.main' : 'primary.main',
                        '& .MuiAlert-icon': {
                          color: notification.type === 'error' ? 'error.main' : 'primary.main'
                        }
                      }}
                    >
                      {notification.message}
                    </Alert>
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}
        </Box>
      )}
    </Box>
  );
};

export default DashboardPage; 