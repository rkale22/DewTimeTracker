import React, { useState, useEffect } from 'react';
// If using Material-UI, uncomment the following imports:
// import { Tabs, Tab, Box, Typography } from '@mui/material';
import { useAuth } from '../utils/AuthContext';
import { fetchTimesheets, approveTimesheet, rejectTimesheet } from '../services/timesheetService';
import { fetchTimeOffRequests, approveTimeOff, rejectTimeOff } from '../services/timeOffService';
// Material-UI imports
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, CircularProgress, Snackbar, Alert, Accordion, AccordionSummary, AccordionDetails, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useTheme } from '@mui/material/styles';

const ApprovalsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [timesheets, setTimesheets] = useState<any[]>([]);
  const [timeOffRequests, setTimeOffRequests] = useState<any[]>([]);
  const [loadingTimesheets, setLoadingTimesheets] = useState(true);
  const [loadingTimeOff, setLoadingTimeOff] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null); // id of item being actioned
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  const { token } = useAuth();
  const theme = useTheme();

  const fetchData = async () => {
    setLoadingTimesheets(true);
    setLoadingTimeOff(true);
    setError(null);
    try {
      const [tsData, toData] = await Promise.all([
        fetchTimesheets(token!),
        fetchTimeOffRequests(token!)
      ]);
      setTimesheets(tsData);
      setTimeOffRequests(toData);
    } catch (err: any) {
      setError('Failed to fetch approvals data.');
    } finally {
      setLoadingTimesheets(false);
      setLoadingTimeOff(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [token]);

  const handleApproveTimesheet = async (id: number) => {
    setActionLoading(id);
    try {
      await approveTimesheet(id, token!);
      setSnackbar({ open: true, message: 'Timesheet approved!', severity: 'success' });
      fetchData();
    } catch {
      setSnackbar({ open: true, message: 'Failed to approve timesheet.', severity: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectTimesheet = async (id: number) => {
    setActionLoading(id);
    try {
      await rejectTimesheet(id, token!);
      setSnackbar({ open: true, message: 'Timesheet rejected.', severity: 'success' });
      fetchData();
    } catch {
      setSnackbar({ open: true, message: 'Failed to reject timesheet.', severity: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveTimeOff = async (id: number) => {
    setActionLoading(id);
    try {
      await approveTimeOff(id, token!);
      setSnackbar({ open: true, message: 'Time off approved!', severity: 'success' });
      fetchData();
    } catch {
      setSnackbar({ open: true, message: 'Failed to approve time off.', severity: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectTimeOff = async (id: number) => {
    setActionLoading(id);
    try {
      await rejectTimeOff(id, token!);
      setSnackbar({ open: true, message: 'Time off rejected.', severity: 'success' });
      fetchData();
    } catch {
      setSnackbar({ open: true, message: 'Failed to reject time off.', severity: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  // Group timesheets by employee
  const groupedTimesheets = timesheets.reduce((acc: Record<string, any[]>, ts) => {
    const empName = ts.employee?.full_name || ts.employee_name || 'N/A';
    if (!acc[empName]) acc[empName] = [];
    acc[empName].push(ts);
    return acc;
  }, {});

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <h2>Manager Approvals</h2>
      <div style={{ display: 'flex', borderBottom: '1px solid #ccc', marginBottom: 16 }}>
        <button
          style={{
            flex: 1,
            padding: 12,
            background: activeTab === 0 ? theme.palette.background.default : 'white',
            border: 'none',
            borderBottom: activeTab === 0 ? `2px solid ${theme.palette.primary.main}` : 'none',
            cursor: 'pointer',
            fontWeight: activeTab === 0 ? 'bold' : 'normal',
            color: theme.palette.text.primary,
          }}
          onClick={() => setActiveTab(0)}
        >
          Timesheet Approvals
        </button>
        <button
          style={{
            flex: 1,
            padding: 12,
            background: activeTab === 1 ? theme.palette.background.default : 'white',
            border: 'none',
            borderBottom: activeTab === 1 ? `2px solid ${theme.palette.primary.main}` : 'none',
            cursor: 'pointer',
            fontWeight: activeTab === 1 ? 'bold' : 'normal',
            color: theme.palette.text.primary,
          }}
          onClick={() => setActiveTab(1)}
        >
          Time Off Approvals
        </button>
      </div>
      <div>
        {error && <Alert severity="error" style={{ marginBottom: 16 }}>{error}</Alert>}
        {activeTab === 0 && (
          <div>
            <h3>Timesheet Approvals</h3>
            {loadingTimesheets ? (
              <CircularProgress />
            ) : (
              Object.keys(groupedTimesheets).length === 0 ? (
                <Paper style={{ padding: 24, textAlign: 'center' }}>No timesheets pending approval.</Paper>
              ) : (
                Object.entries(groupedTimesheets).map(([empName, empTimesheets]) => (
                  <Accordion key={empName} defaultExpanded={true} style={{ marginBottom: 12 }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="subtitle1" fontWeight={600}>{empName}</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <TableContainer component={Paper} elevation={0}>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell>Week Start</TableCell>
                              <TableCell>Status</TableCell>
                              <TableCell align="right">Actions</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {empTimesheets.map((ts) => (
                              <TableRow key={ts.id}>
                                <TableCell>{ts.week_start}</TableCell>
                                <TableCell>{ts.status}</TableCell>
                                <TableCell align="right">
                                  <Button
                                    variant="contained"
                                    color="primary"
                                    size="small"
                                    style={{ marginRight: 8 }}
                                    disabled={actionLoading === ts.id}
                                    onClick={() => handleApproveTimesheet(ts.id)}
                                  >
                                    {actionLoading === ts.id ? <CircularProgress size={20} /> : 'Approve'}
                                  </Button>
                                  <Button
                                    variant="contained"
                                    color="secondary"
                                    size="small"
                                    disabled={actionLoading === ts.id}
                                    onClick={() => handleRejectTimesheet(ts.id)}
                                  >
                                    {actionLoading === ts.id ? <CircularProgress size={20} /> : 'Reject'}
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </AccordionDetails>
                  </Accordion>
                ))
              )
            )}
          </div>
        )}
        {activeTab === 1 && (
          <div>
            <h3>Time Off Approvals</h3>
            {loadingTimeOff ? (
              <CircularProgress />
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Employee</TableCell>
                      <TableCell>Date Range</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {timeOffRequests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center">No time off requests pending approval.</TableCell>
                      </TableRow>
                    ) : (
                      timeOffRequests.map((to) => (
                        <TableRow key={to.id}>
                          <TableCell>{to.employee?.full_name || to.employee_name || 'N/A'}</TableCell>
                          <TableCell>{to.start_date} - {to.end_date}</TableCell>
                          <TableCell>{to.status}</TableCell>
                          <TableCell align="right">
                            <Button
                              variant="contained"
                              color="primary"
                              size="small"
                              style={{ marginRight: 8 }}
                              disabled={actionLoading === to.id}
                              onClick={() => handleApproveTimeOff(to.id)}
                            >
                              {actionLoading === to.id ? <CircularProgress size={20} /> : 'Approve'}
                            </Button>
                            <Button
                              variant="contained"
                              color="secondary"
                              size="small"
                              disabled={actionLoading === to.id}
                              onClick={() => handleRejectTimeOff(to.id)}
                            >
                              {actionLoading === to.id ? <CircularProgress size={20} /> : 'Reject'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </div>
        )}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </div>
    </div>
  );
};

export default ApprovalsPage; 