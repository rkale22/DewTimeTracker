import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Tabs,
  Tab,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Chip,
  CircularProgress,
  Alert,
  Paper,
  Stack,
  Divider,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Snackbar
} from '@mui/material';

import {
  Person as PersonIcon,
  AccessTime as AccessTimeIcon,
  EventNote as EventNoteIcon,
  Business as BusinessIcon,
  Email as EmailIcon,
  CalendarToday as CalendarIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Check as ApproveIcon,
  Close as RejectIcon
} from '@mui/icons-material';
import { useAuth } from '../utils/AuthContext';
import TimesheetViewerModal from './TimesheetViewerModal';
import TimesheetEditModal from './TimesheetEditModal';
import dayjs from 'dayjs';

interface Employee {
  id: number;
  email: string;
  full_name: string;
  role: string;
  client_id?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  client?: {
    name: string;
    code: string;
  };
}

interface Timesheet {
  id: number;
  week_start: string;
  status: string;
  total_hours: number;
  submitted_at?: string;
  approved_at?: string;
  rejected_at?: string;
  rejection_reason?: string;
}

interface TimeOff {
  id: number;
  start_date: string;
  end_date: string;
  type: string;
  reason: string;
  status: string;
  submitted_at: string;
  approved_at?: string;
  rejected_at?: string;
  rejection_reason?: string;
}

interface EmployeeViewModalProps {
  open: boolean;
  onClose: () => void;
  employee: Employee | null;
}

const EmployeeViewModal: React.FC<EmployeeViewModalProps> = ({
  open,
  onClose,
  employee
}) => {
  const { token, userRole } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [timeOffs, setTimeOffs] = useState<TimeOff[]>([]);
  
  // Admin action states
  const [timesheetViewModalOpen, setTimesheetViewModalOpen] = useState(false);
  const [timesheetEditModalOpen, setTimesheetEditModalOpen] = useState(false);
  const [selectedTimesheetId, setSelectedTimesheetId] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ 
    open: false, 
    message: '', 
    severity: 'success' 
  });

  // Fetch employee data when modal opens
  useEffect(() => {
    if (open && employee) {
      fetchEmployeeData();
    }
  }, [open, employee]);

  const fetchEmployeeData = async () => {
    if (!employee || !token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch timesheets
      const timesheetsResponse = await fetch(`/api/v1/timesheets/?employee_id=${employee.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (timesheetsResponse.ok) {
        const timesheetsData = await timesheetsResponse.json();
        setTimesheets(timesheetsData);
      }
      
      // Fetch time-off requests
      const timeOffResponse = await fetch(`/api/v1/time_off/?employee_id=${employee.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (timeOffResponse.ok) {
        const timeOffData = await timeOffResponse.json();
        setTimeOffs(timeOffData);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load employee data');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Admin action handlers
  const handleViewTimesheet = (timesheetId: number) => {
    setSelectedTimesheetId(timesheetId);
    setTimesheetViewModalOpen(true);
  };

  const handleCloseTimesheetViewModal = () => {
    setTimesheetViewModalOpen(false);
    setSelectedTimesheetId(null);
  };

  const handleEditTimesheet = (timesheetId: number) => {
    setSelectedTimesheetId(timesheetId);
    setTimesheetEditModalOpen(true);
  };

  const handleCloseTimesheetEditModal = () => {
    setTimesheetEditModalOpen(false);
    setSelectedTimesheetId(null);
  };

  const handleTimesheetEdited = () => {
    // Refresh timesheets data
    fetchEmployeeData();
    setSnackbar({
      open: true,
      message: 'Timesheet updated successfully!',
      severity: 'success'
    });
  };

  const handleApproveTimesheet = async (timesheetId: number) => {
    if (!token) return;
    
    setActionLoading(timesheetId);
    try {
      const response = await fetch(`/api/v1/timesheets/${timesheetId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to approve timesheet');
      }
      
      // Refresh timesheets data
      await fetchEmployeeData();
      setSnackbar({
        open: true,
        message: 'Timesheet approved successfully!',
        severity: 'success'
      });
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.message || 'Failed to approve timesheet',
        severity: 'error'
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectTimesheet = async (timesheetId: number) => {
    if (!token) return;
    
    setActionLoading(timesheetId);
    try {
      const response = await fetch(`/api/v1/timesheets/${timesheetId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'rejected' })
      });
      
      if (!response.ok) {
        throw new Error('Failed to reject timesheet');
      }
      
      // Refresh timesheets data
      await fetchEmployeeData();
      setSnackbar({
        open: true,
        message: 'Timesheet rejected successfully!',
        severity: 'success'
      });
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.message || 'Failed to reject timesheet',
        severity: 'error'
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'dew_admin':
        return 'error';
      case 'client_manager':
        return 'warning';
      case 'consultant':
        return 'primary';
      default:
        return 'default';
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'success' : 'error';
  };

  const getTimesheetStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'submitted':
        return 'warning';
      case 'draft':
        return 'default';
      default:
        return 'default';
    }
  };

  const getTimeOffStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getTimeOffTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'vacation':
        return 'primary';
      case 'sick':
        return 'error';
      case 'personal':
        return 'warning';
      case 'other':
        return 'default';
      default:
        return 'default';
    }
  };

  if (!open || !employee) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: {
          minHeight: '80vh'
        }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <PersonIcon color="primary" />
          <Typography variant="h6" component="div">
            Employee Details: {employee.full_name}
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box>
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <Tabs value={activeTab} onChange={handleTabChange}>
                <Tab 
                  icon={<PersonIcon />} 
                  label="Profile" 
                  iconPosition="start"
                />
                <Tab 
                  icon={<AccessTimeIcon />} 
                  label="Timesheets" 
                  iconPosition="start"
                />
                <Tab 
                  icon={<EventNoteIcon />} 
                  label="Time Off" 
                  iconPosition="start"
                />
              </Tabs>
            </Box>

            {/* Tab Content */}
            {activeTab === 0 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Employee Profile
                </Typography>
                
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                  {/* Basic Information */}
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon color="primary" />
                        Basic Information
                      </Typography>
                      <Stack spacing={2}>
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Full Name
                          </Typography>
                          <Typography variant="body1" fontWeight={500}>
                            {employee.full_name}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Email
                          </Typography>
                          <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <EmailIcon fontSize="small" color="action" />
                            {employee.email}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Role
                          </Typography>
                          <Chip
                            label={employee.role.replace('_', ' ').toUpperCase()}
                            color={getRoleColor(employee.role) as any}
                            size="small"
                          />
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Status
                          </Typography>
                          <Chip
                            label={employee.is_active ? 'Active' : 'Inactive'}
                            color={getStatusColor(employee.is_active) as any}
                            size="small"
                            icon={employee.is_active ? <CheckCircleIcon /> : <CancelIcon />}
                          />
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>

                  {/* Client Assignment */}
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BusinessIcon color="primary" />
                        Client Assignment
                      </Typography>
                      {employee.client ? (
                        <Stack spacing={2}>
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Client Name
                            </Typography>
                            <Typography variant="body1" fontWeight={500}>
                              {employee.client.name}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Client Code
                            </Typography>
                            <Typography variant="body1" fontFamily="monospace">
                              {employee.client.code}
                            </Typography>
                          </Box>
                        </Stack>
                      ) : (
                        <Typography variant="body1" color="text.secondary" fontStyle="italic">
                          No client assigned
                        </Typography>
                      )}
                    </CardContent>
                  </Card>

                  {/* Account Information */}
                  <Card sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarIcon color="primary" />
                        Account Information
                      </Typography>
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>      
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Created Date
                          </Typography>
                          <Typography variant="body1">
                            {dayjs(employee.created_at).format('MMMM DD, YYYY')}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Last Updated
                          </Typography>
                          <Typography variant="body1">
                            {dayjs(employee.updated_at).format('MMMM DD, YYYY')}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              </Box>
            )}

            {activeTab === 1 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Timesheet History
                </Typography>
                
                {timesheets.length === 0 ? (
                  <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="body1" color="text.secondary">
                      No timesheets found for this employee
                    </Typography>
                  </Paper>
                ) : (
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Week Starting</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Total Hours</TableCell>
                          <TableCell>Submitted</TableCell>
                          <TableCell>Processed</TableCell>
                          {userRole === 'dew_admin' && (
                            <TableCell align="right">Actions</TableCell>
                          )}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {timesheets.map((timesheet) => (
                          <TableRow key={timesheet.id} hover>
                            <TableCell>
                              <Typography variant="body2" fontWeight={500}>
                                {dayjs(timesheet.week_start).format('MMM DD, YYYY')}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={timesheet.status.toUpperCase()}
                                color={getTimesheetStatusColor(timesheet.status) as any}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <ScheduleIcon fontSize="small" color="action" />
                                {timesheet.total_hours} hours
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {timesheet.submitted_at ? (
                                <Typography variant="body2">
                                  {dayjs(timesheet.submitted_at).format('MMM DD, YYYY')}
                                </Typography>
                              ) : (
                                <Typography variant="body2" color="text.secondary" fontStyle="italic">
                                  Not submitted
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              {timesheet.approved_at ? (
                                <Typography variant="body2" color="success.main">
                                  Approved {dayjs(timesheet.approved_at).format('MMM DD')}
                                </Typography>
                              ) : timesheet.rejected_at ? (
                                <Typography variant="body2" color="error.main">
                                  Rejected {dayjs(timesheet.rejected_at).format('MMM DD')}
                                </Typography>
                              ) : (
                                <Typography variant="body2" color="text.secondary">
                                  Pending
                                </Typography>
                              )}
                            </TableCell>
                            {userRole === 'dew_admin' && (
                              <TableCell align="right">
                                <Stack direction="row" spacing={1} justifyContent="flex-end">
                                  <Tooltip title="View Details">
                                    <IconButton
                                      size="small"
                                      onClick={() => handleViewTimesheet(timesheet.id)}
                                      color="primary"
                                    >
                                      <ViewIcon />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Edit Timesheet">
                                    <IconButton
                                      size="small"
                                      onClick={() => handleEditTimesheet(timesheet.id)}
                                      color="secondary"
                                    >
                                      <EditIcon />
                                    </IconButton>
                                  </Tooltip>
                                  {timesheet.status === 'submitted' && (
                                    <>
                                      <Tooltip title="Approve Timesheet">
                                        <IconButton
                                          size="small"
                                          onClick={() => handleApproveTimesheet(timesheet.id)}
                                          color="success"
                                          disabled={actionLoading === timesheet.id}
                                        >
                                          {actionLoading === timesheet.id ? (
                                            <CircularProgress size={16} />
                                          ) : (
                                            <ApproveIcon />
                                          )}
                                        </IconButton>
                                      </Tooltip>
                                      <Tooltip title="Reject Timesheet">
                                        <IconButton
                                          size="small"
                                          onClick={() => handleRejectTimesheet(timesheet.id)}
                                          color="error"
                                          disabled={actionLoading === timesheet.id}
                                        >
                                          {actionLoading === timesheet.id ? (
                                            <CircularProgress size={16} />
                                          ) : (
                                            <RejectIcon />
                                          )}
                                        </IconButton>
                                      </Tooltip>
                                    </>
                                  )}
                                </Stack>
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            )}

            {activeTab === 2 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Time-Off Request History
                </Typography>
                
                {timeOffs.length === 0 ? (
                  <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="body1" color="text.secondary">
                      No time-off requests found for this employee
                    </Typography>
                  </Paper>
                ) : (
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Type</TableCell>
                          <TableCell>Date Range</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Submitted</TableCell>
                          <TableCell>Processed</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {timeOffs.map((timeOff) => (
                          <TableRow key={timeOff.id} hover>
                            <TableCell>
                              <Chip
                                label={timeOff.type.toUpperCase()}
                                color={getTimeOffTypeColor(timeOff.type) as any}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {dayjs(timeOff.start_date).format('MMM DD')} - {dayjs(timeOff.end_date).format('MMM DD, YYYY')}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={timeOff.status.toUpperCase()}
                                color={getTimeOffStatusColor(timeOff.status) as any}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {dayjs(timeOff.submitted_at).format('MMM DD, YYYY')}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {timeOff.approved_at ? (
                                <Typography variant="body2" color="success.main">
                                  Approved {dayjs(timeOff.approved_at).format('MMM DD')}
                                </Typography>
                              ) : timeOff.rejected_at ? (
                                <Typography variant="body2" color="error.main">
                                  Rejected {dayjs(timeOff.rejected_at).format('MMM DD')}
                                </Typography>
                              ) : (
                                <Typography variant="body2" color="text.secondary">
                                  Pending
                                </Typography>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>
          Close
        </Button>
      </DialogActions>

      {/* Timesheet Viewer Modal */}
      <TimesheetViewerModal
        open={timesheetViewModalOpen}
        onClose={handleCloseTimesheetViewModal}
        timesheetId={selectedTimesheetId}
        token={token!}
      />

      {/* Timesheet Edit Modal */}
      <TimesheetEditModal
        open={timesheetEditModalOpen}
        onClose={handleCloseTimesheetEditModal}
        timesheetId={selectedTimesheetId}
        token={token!}
        onSuccess={handleTimesheetEdited}
      />

      {/* Success/Error Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default EmployeeViewModal; 