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
  Stack
} from '@mui/material';
import dayjs, { Dayjs } from 'dayjs';
import { getTimesheet } from '../services/timesheetService';

const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface TimesheetViewerModalProps {
  open: boolean;
  onClose: () => void;
  timesheetId: number | null;
  token: string;
}

const TimesheetViewerModal: React.FC<TimesheetViewerModalProps> = ({
  open,
  onClose,
  timesheetId,
  token
}) => {
  const [timesheetData, setTimesheetData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState(0); // 0 = Monday

  // Fetch timesheet data when modal opens
  useEffect(() => {
    if (open && timesheetId && token) {
      fetchTimesheetData();
    }
  }, [open, timesheetId, token]);

  const fetchTimesheetData = async () => {
    if (!timesheetId || !token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await getTimesheet(timesheetId, token);
      setTimesheetData(data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to load timesheet data');
    } finally {
      setLoading(false);
    }
  };

  const handleDayChange = (_: any, newValue: number) => {
    setSelectedDay(newValue);
  };

  const getWeekRange = (weekStart: string) => {
    const start = dayjs(weekStart);
    const end = start.add(6, 'day');
    return { start, end };
  };

  const getTotalHours = (dateStr: string) => {
    if (!timesheetData?.time_entries) return 0;
    
    const dayEntries = timesheetData.time_entries.filter((entry: any) => entry.date === dateStr);
    let total = 0;
    
    for (const entry of dayEntries) {
      const inTime = entry.in_time;
      const outTime = entry.out_time;
      if (inTime && outTime) {
        const [inH, inM] = inTime.split(':').map(Number);
        const [outH, outM] = outTime.split(':').map(Number);
        let duration = (outH * 60 + outM) - (inH * 60 + inM);
        
        for (const br of entry.break_periods || []) {
          const [bStartH, bStartM] = br.start_time.split(':').map(Number);
          const [bEndH, bEndM] = br.end_time.split(':').map(Number);
          duration -= (bEndH * 60 + bEndM) - (bStartH * 60 + bStartM);
        }
        total += duration / 60;
      }
    }
    return total;
  };

  const getSelectedDayEntries = () => {
    if (!timesheetData?.time_entries) return [];
    
    const weekRange = getWeekRange(timesheetData.week_start);
    const selectedDate = weekRange.start.add(selectedDay, 'day').format('YYYY-MM-DD');
    
    return timesheetData.time_entries.filter((entry: any) => entry.date === selectedDate);
  };

  const getSelectedDayHours = () => {
    if (!timesheetData?.time_entries) return { regular: 0, overtime: 0, total: 0 };
    
    const weekRange = getWeekRange(timesheetData.week_start);
    const selectedDate = weekRange.start.add(selectedDay, 'day').format('YYYY-MM-DD');
    const dayTotal = getTotalHours(selectedDate);
    
    const regular = Math.min(dayTotal, 8);
    const overtime = Math.max(dayTotal - 8, 0);
    
    return { regular, overtime, total: dayTotal };
  };

  if (!open) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: {
          minHeight: '80vh',
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" component="div">
            Timesheet Review
          </Typography>
          <Button onClick={onClose} color="inherit">
            ✕
          </Button>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        ) : timesheetData ? (
          <Box>
            {/* Timesheet Header Info */}
            <Paper sx={{ p: 2, mb: 2, background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' }}>
              <Stack direction="row" spacing={3} alignItems="center">
                <Box>
                  <Typography variant="subtitle1" fontWeight={600} color="#003366">
                    Employee: {timesheetData.employee?.full_name || 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Week: {dayjs(timesheetData.week_start).format('MMM DD')} - {dayjs(timesheetData.week_start).add(6, 'day').format('MMM DD, YYYY')}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle1" fontWeight={600} color="#003366">
                    Project: {timesheetData.project || 'Not specified'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Status: {timesheetData.status}
                  </Typography>
                </Box>
                {timesheetData.comment && (
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600} color="#003366">
                      Comment:
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {timesheetData.comment}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Paper>

            {/* Day Tabs */}
            <Paper sx={{ mb: 2 }}>
              <Tabs 
                value={selectedDay} 
                onChange={handleDayChange}
                variant="scrollable"
                scrollButtons="auto"
              >
                {daysOfWeek.map((day, idx) => {
                  const weekRange = getWeekRange(timesheetData.week_start);
                  const date = weekRange.start.add(idx, 'day').format('YYYY-MM-DD');
                  const total = getTotalHours(date);
                  
                  return (
                    <Tab
                      key={day}
                      label={
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography fontWeight={500} variant="body2">
                            {day}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {total > 0 ? `${total.toFixed(1)}h` : '0h'}
                          </Typography>
                        </Box>
                      }
                    />
                  );
                })}
              </Tabs>
            </Paper>

            {/* Selected Day Content */}
            <Box>
              <Typography variant="h6" align="center" color="text.secondary" gutterBottom>
                Time Entries for {dayjs(timesheetData.week_start).add(selectedDay, 'day').format('ddd, DD MMM')}
              </Typography>
              
              {/* Hours Summary */}
              {(() => {
                const { regular, overtime, total } = getSelectedDayHours();
                return (
                  <Box sx={{ textAlign: 'center', mb: 2, p: 2, background: 'rgba(0, 51, 102, 0.05)', borderRadius: 1 }}>
                    <Typography variant="body1" color="text.secondary">
                      Regular Hours: <b>{regular.toFixed(2)}</b>
                      &nbsp;|&nbsp; Overtime Hours: <b>{overtime.toFixed(2)}</b>
                      &nbsp;|&nbsp; Total Hours: <b>{total.toFixed(2)}</b>
                    </Typography>
                  </Box>
                );
              })()}

              {/* Time Entries Table */}
              <Box>
                {(() => {
                  const dayEntries = getSelectedDayEntries();
                  
                  if (dayEntries.length === 0) {
                    return (
                      <Paper sx={{ p: 4, textAlign: 'center' }}>
                        <Typography color="text.secondary">
                          No time entries for this day.
                        </Typography>
                      </Paper>
                    );
                  }

                  return (
                    <TableContainer component={Paper}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>In Time</TableCell>
                            <TableCell>Out Time</TableCell>
                            <TableCell>Project</TableCell>
                            <TableCell>Note</TableCell>
                            <TableCell>Breaks</TableCell>
                            <TableCell>Hours</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {dayEntries.map((entry: any) => {
                            // Calculate hours for this entry
                            const inTime = entry.in_time;
                            const outTime = entry.out_time;
                            let hours = 0;
                            
                            if (inTime && outTime) {
                              const [inH, inM] = inTime.split(':').map(Number);
                              const [outH, outM] = outTime.split(':').map(Number);
                              let duration = (outH * 60 + outM) - (inH * 60 + inM);
                              
                              for (const br of entry.break_periods || []) {
                                const [bStartH, bStartM] = br.start_time.split(':').map(Number);
                                const [bEndH, bEndM] = br.end_time.split(':').map(Number);
                                duration -= (bEndH * 60 + bEndM) - (bStartH * 60 + bStartM);
                              }
                              hours = duration / 60;
                            }

                            return (
                              <TableRow key={entry.id}>
                                <TableCell>{entry.in_time}</TableCell>
                                <TableCell>{entry.out_time}</TableCell>
                                <TableCell>{entry.project || '-'}</TableCell>
                                <TableCell>{entry.note || '-'}</TableCell>
                                <TableCell>
                                  {(entry.break_periods || []).map((br: any, idx: number) => (
                                    <Chip
                                      key={idx}
                                      label={`${br.start_time}–${br.end_time}`}
                                      size="small"
                                      sx={{ mr: 0.5, mb: 0.5 }}
                                    />
                                  ))}
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2" fontWeight={500}>
                                    {hours.toFixed(2)}h
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  );
                })()}
              </Box>
            </Box>
          </Box>
        ) : null}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TimesheetViewerModal; 