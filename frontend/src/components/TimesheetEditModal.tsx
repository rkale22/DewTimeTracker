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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Snackbar
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { getTimesheet, addTimeEntry, deleteTimeEntry } from '../services/timesheetService';

const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface TimesheetEditModalProps {
  open: boolean;
  onClose: () => void;
  timesheetId: number | null;
  token: string;
  onSuccess: () => void;
}

interface TimeEntry {
  id: number;
  date: string;
  in_time: string;
  out_time: string;
  project?: string;
  note?: string;
  break_periods: BreakPeriod[];
}

interface BreakPeriod {
  id: number;
  start_time: string;
  end_time: string;
}

const TimesheetEditModal: React.FC<TimesheetEditModalProps> = ({
  open,
  onClose,
  timesheetId,
  token,
  onSuccess
}) => {
  const [timesheetData, setTimesheetData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState(0);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ 
    open: false, 
    message: '', 
    severity: 'success' 
  });

  // Form state for editing
  const [editForm, setEditForm] = useState({
    date: dayjs(),
    in_time: dayjs().hour(9).minute(0),
    out_time: dayjs().hour(17).minute(0),
    project: '',
    note: '',
    break_periods: [] as { start_time: Dayjs; end_time: Dayjs }[]
  });

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

  const getSelectedDayEntries = () => {
    if (!timesheetData?.time_entries) return [];
    const weekRange = getWeekRange(timesheetData.week_start);
    const selectedDate = weekRange.start.add(selectedDay, 'day').format('YYYY-MM-DD');
    return timesheetData.time_entries.filter((entry: TimeEntry) => entry.date === selectedDate);
  };

  const handleEditEntry = (entry: TimeEntry) => {
    setEditingEntry(entry);
    setEditForm({
      date: dayjs(entry.date),
      in_time: dayjs(`2000-01-01 ${entry.in_time}`),
      out_time: dayjs(`2000-01-01 ${entry.out_time}`),
      project: entry.project || '',
      note: entry.note || '',
      break_periods: entry.break_periods.map(br => ({
        start_time: dayjs(`2000-01-01 ${br.start_time}`),
        end_time: dayjs(`2000-01-01 ${br.end_time}`)
      }))
    });
  };

  const handleSaveEntry = async () => {
    if (!timesheetId || !token || !editingEntry) return;
    
    setSaving(true);
    try {
      const entryData = {
        date: editForm.date.format('YYYY-MM-DD'),
        in_time: editForm.in_time.format('HH:mm'),
        out_time: editForm.out_time.format('HH:mm'),
        project: editForm.project,
        note: editForm.note,
        break_periods: editForm.break_periods.map(br => ({
          start_time: br.start_time.format('HH:mm'),
          end_time: br.end_time.format('HH:mm')
        }))
      };

      await addTimeEntry(timesheetId, entryData, token);
      await fetchTimesheetData();
      setEditingEntry(null);
      setSnackbar({
        open: true,
        message: 'Time entry updated successfully!',
        severity: 'success'
      });
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err?.response?.data?.detail || 'Failed to update time entry',
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEntry = async (entryId: number) => {
    if (!timesheetId || !token) return;
    
    try {
      await deleteTimeEntry(timesheetId, entryId, token);
      await fetchTimesheetData();
      setSnackbar({
        open: true,
        message: 'Time entry deleted successfully!',
        severity: 'success'
      });
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err?.response?.data?.detail || 'Failed to delete time entry',
        severity: 'error'
      });
    }
  };

  const handleClose = () => {
    setEditingEntry(null);
    setError(null);
    onClose();
  };

  const addBreakPeriod = () => {
    setEditForm(prev => ({
      ...prev,
      break_periods: [...prev.break_periods, {
        start_time: dayjs().hour(12).minute(0),
        end_time: dayjs().hour(13).minute(0)
      }]
    }));
  };

  const removeBreakPeriod = (index: number) => {
    setEditForm(prev => ({
      ...prev,
      break_periods: prev.break_periods.filter((_, i) => i !== index)
    }));
  };

  if (!open || !timesheetId) return null;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog 
        open={open} 
        onClose={handleClose} 
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
            <EditIcon color="primary" />
            <Typography variant="h6" component="div">
              Edit Timesheet
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

              {timesheetData && (
                <Box>
                  {/* Timesheet Info */}
                  <Paper sx={{ p: 2, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Week Starting: {dayjs(timesheetData.week_start).format('MMM DD, YYYY')}
                    </Typography>
                    <Stack direction="row" spacing={2}>
                      <Chip label={`Status: ${timesheetData.status.toUpperCase()}`} color="primary" />
                      <Chip label={`Employee: ${timesheetData.employee?.full_name || 'N/A'}`} />
                    </Stack>
                  </Paper>

                  {/* Day Tabs */}
                  <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                    <Tabs value={selectedDay} onChange={handleDayChange}>
                      {daysOfWeek.map((day, index) => {
                        const weekRange = getWeekRange(timesheetData.week_start);
                        const date = weekRange.start.add(index, 'day');
                        const entries = timesheetData.time_entries?.filter((entry: TimeEntry) => 
                          entry.date === date.format('YYYY-MM-DD')
                        ) || [];
                        const totalHours = entries.reduce((total: number, entry: TimeEntry) => {
                          const [inH, inM] = entry.in_time.split(':').map(Number);
                          const [outH, outM] = entry.out_time.split(':').map(Number);
                          let duration = (outH * 60 + outM) - (inH * 60 + inM);
                          entry.break_periods.forEach((br: BreakPeriod) => {
                            const [bStartH, bStartM] = br.start_time.split(':').map(Number);
                            const [bEndH, bEndM] = br.end_time.split(':').map(Number);
                            duration -= (bEndH * 60 + bEndM) - (bStartH * 60 + bStartM);
                          });
                          return total + duration / 60;
                        }, 0);

                        return (
                          <Tab
                            key={day}
                            label={
                              <Box>
                                <Typography fontWeight={500}>{day}</Typography>
                                <Typography variant="caption">{totalHours > 0 ? `${totalHours.toFixed(1)}h` : '0h'}</Typography>
                              </Box>
                            }
                          />
                        );
                      })}
                    </Tabs>
                  </Box>

                  {/* Day Content */}
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      {dayjs(timesheetData.week_start).add(selectedDay, 'day').format('dddd, MMM DD, YYYY')}
                    </Typography>

                    {editingEntry ? (
                      /* Edit Form */
                      <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>Edit Time Entry</Typography>
                        <Stack spacing={3}>
                          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                            <TimePicker
                              label="In Time"
                              value={editForm.in_time}
                              onChange={(newValue) => setEditForm(prev => ({ ...prev, in_time: newValue || dayjs() }))}
                            />
                            <TimePicker
                              label="Out Time"
                              value={editForm.out_time}
                              onChange={(newValue) => setEditForm(prev => ({ ...prev, out_time: newValue || dayjs() }))}
                            />
                          </Box>
                          
                          <TextField
                            fullWidth
                            label="Project"
                            value={editForm.project}
                            onChange={(e) => setEditForm(prev => ({ ...prev, project: e.target.value }))}
                          />
                          
                          <TextField
                            fullWidth
                            label="Note"
                            multiline
                            rows={3}
                            value={editForm.note}
                            onChange={(e) => setEditForm(prev => ({ ...prev, note: e.target.value }))}
                          />

                          {/* Break Periods */}
                          <Box>
                            <Typography variant="h6" gutterBottom>Break Periods</Typography>
                            {editForm.break_periods.map((breakPeriod, index) => (
                              <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
                                <TimePicker
                                  label="Start"
                                  value={breakPeriod.start_time}
                                  onChange={(newValue) => {
                                    const newBreaks = [...editForm.break_periods];
                                    newBreaks[index].start_time = newValue || dayjs();
                                    setEditForm(prev => ({ ...prev, break_periods: newBreaks }));
                                  }}
                                />
                                <TimePicker
                                  label="End"
                                  value={breakPeriod.end_time}
                                  onChange={(newValue) => {
                                    const newBreaks = [...editForm.break_periods];
                                    newBreaks[index].end_time = newValue || dayjs();
                                    setEditForm(prev => ({ ...prev, break_periods: newBreaks }));
                                  }}
                                />
                                <IconButton
                                  onClick={() => removeBreakPeriod(index)}
                                  color="error"
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Box>
                            ))}
                            <Button
                              startIcon={<AddIcon />}
                              onClick={addBreakPeriod}
                              variant="outlined"
                            >
                              Add Break
                            </Button>
                          </Box>

                          <Stack direction="row" spacing={2}>
                            <Button
                              variant="contained"
                              startIcon={<SaveIcon />}
                              onClick={handleSaveEntry}
                              disabled={saving}
                            >
                              {saving ? 'Saving...' : 'Save Entry'}
                            </Button>
                            <Button
                              variant="outlined"
                              startIcon={<CancelIcon />}
                              onClick={() => setEditingEntry(null)}
                              disabled={saving}
                            >
                              Cancel
                            </Button>
                          </Stack>
                        </Stack>
                      </Paper>
                    ) : (
                      /* Time Entries Table */
                      <TableContainer component={Paper}>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell>In Time</TableCell>
                              <TableCell>Out Time</TableCell>
                              <TableCell>Project</TableCell>
                              <TableCell>Note</TableCell>
                              <TableCell>Breaks</TableCell>
                              <TableCell align="right">Actions</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {getSelectedDayEntries().map((entry: TimeEntry) => (
                              <TableRow key={entry.id} hover>
                                <TableCell>{entry.in_time}</TableCell>
                                <TableCell>{entry.out_time}</TableCell>
                                <TableCell>{entry.project || '-'}</TableCell>
                                <TableCell>{entry.note || '-'}</TableCell>
                                <TableCell>
                                  {entry.break_periods.map((br, idx) => (
                                    <Chip
                                      key={idx}
                                      label={`${br.start_time}–${br.end_time}`}
                                      size="small"
                                      sx={{ mr: 0.5, mb: 0.5 }}
                                    />
                                  ))}
                                </TableCell>
                                <TableCell align="right">
                                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                                    <Tooltip title="Edit Entry">
                                      <IconButton
                                        size="small"
                                        onClick={() => handleEditEntry(entry)}
                                        color="primary"
                                      >
                                        <EditIcon />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Delete Entry">
                                      <IconButton
                                        size="small"
                                        onClick={() => handleDeleteEntry(entry.id)}
                                        color="error"
                                      >
                                        <DeleteIcon />
                                      </IconButton>
                                    </Tooltip>
                                  </Stack>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleClose}>
            Close
          </Button>
        </DialogActions>

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
    </LocalizationProvider>
  );
};

export default TimesheetEditModal; 