import React, { useEffect, useState } from 'react';
import { Box, Typography, Tabs, Tab, IconButton, Paper, Stack, CircularProgress, Button, TextField, Table, TableHead, TableRow, TableCell, TableBody, Chip } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import axios from 'axios';
import dayjs, { Dayjs } from 'dayjs';
import { useAuth } from '../utils/AuthContext';
import AddTimeEntryModal from '../components/AddTimeEntryModal';
import { addTimeEntry, deleteTimeEntry, fetchTimesheets, createTimesheet, submitTimesheet } from '../services/timesheetService';
import DeleteIcon from '@mui/icons-material/Delete';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getWeekRange(date: Dayjs) {
  const start = date.startOf('week').add(1, 'day'); // Monday
  const end = start.add(6, 'day');
  return { start, end };
}

const TimesheetsPage: React.FC = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [timesheets, setTimesheets] = useState<any[]>([]);
  const [selectedWeek, setSelectedWeek] = useState(dayjs().startOf('week').add(1, 'day'));
  const [selectedDay, setSelectedDay] = useState(dayjs().format('YYYY-MM-DD'));
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [managerEmail, setManagerEmail] = useState('');
  const [creatingTimesheet, setCreatingTimesheet] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return; // Safely handle missing token
      setLoading(true);
      try {
        const data = await fetchTimesheets(token);
        setTimesheets(data);
      } catch (err) {
        // handle error
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  // Find timesheet for the selected week
  const weekRange = getWeekRange(selectedWeek);
  const weekTimesheet = timesheets.find((t) => t.week_start === weekRange.start.format('YYYY-MM-DD'));
  // Group time_entries by date
  const groupedEntries: { [date: string]: any[] } = {};
  if (weekTimesheet && weekTimesheet.time_entries) {
    for (const entry of weekTimesheet.time_entries) {
      const date = entry.date;
      if (!groupedEntries[date]) groupedEntries[date] = [];
      groupedEntries[date].push(entry);
    }
  }

  // Calculate total hours per day
  const getTotalHours = (dateStr: string) => {
    const dayEntries = groupedEntries[dateStr] || [];
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

  // Add new entry to local state (for now)
  const handleAddEntry = async (entry: any) => {
    if (!weekTimesheet || !token) return;
    try {
      // Map breaks to break_periods for backend compatibility
      const break_periods = (entry.breaks || []).map((br: any) => ({
        start_time: br.start,
        end_time: br.end,
      }));

      const payload = {
        date: entry.date,
      in_time: entry.in_time,
      out_time: entry.out_time,
      project: entry.project,
      note: entry.note,
        break_periods,
      };

      await addTimeEntry(weekTimesheet.id, payload, token);
      // Refetch timesheets to update UI
      const data = await fetchTimesheets(token);
      setTimesheets(data);
      setSnackbar({ open: true, message: 'Entry added!', severity: 'success' });
    } catch (err: any) {
      setSnackbar({ open: true, message: err?.response?.data?.detail || 'Failed to add entry', severity: 'error' });
    }
  };

  // Handle week navigation
  const handlePrevWeek = () => setSelectedWeek((prev) => prev.subtract(1, 'week'));
  const handleNextWeek = () => setSelectedWeek((prev) => prev.add(1, 'week'));

  // Handle day tab change
  const handleDayChange = (_: any, newValue: number) => {
    const date = weekRange.start.add(newValue, 'day').format('YYYY-MM-DD');
    setSelectedDay(date);
  };

  // Create timesheet for the week
  const handleCreateTimesheet = async () => {
    setCreatingTimesheet(true);
    try {
      await createTimesheet(
        {
          week_start: weekRange.start.format('YYYY-MM-DD'),
          manager_email: managerEmail,
          comment: '',
          project: '',
        },
        token!
      );
      // Refetch timesheets to update UI
      const data = await fetchTimesheets(token!);
      setTimesheets(data);
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to create timesheet');
    } finally {
      setCreatingTimesheet(false);
    }
  };

  const handleDeleteEntry = async (entryId: number) => {
    if (!weekTimesheet || !token) return;
    try {
      await deleteTimeEntry(weekTimesheet.id, entryId, token);
      // Refetch timesheets to update UI
      const data = await fetchTimesheets(token);
      setTimesheets(data);
      setSnackbar({ open: true, message: 'Entry deleted!', severity: 'success' });
    } catch (err: any) {
      setSnackbar({ open: true, message: err?.response?.data?.detail || 'Failed to delete entry', severity: 'error' });
    }
  };

  return (
    <Box maxWidth={900} mx="auto" mt={4}>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <IconButton onClick={handlePrevWeek}><ArrowBackIosNewIcon /></IconButton>
          <Typography variant="h6">
            Weekly Summary: {weekRange.start.format('DD MMM')} - {weekRange.end.format('DD MMM')}
          </Typography>
          <IconButton onClick={handleNextWeek}><ArrowForwardIosIcon /></IconButton>
        </Stack>
        {weekTimesheet ? (
          <Box mt={2} mb={1}>
            <Typography variant="body2" color="text.secondary">
              Manager Email: <b>{weekTimesheet.manager_email}</b>
            </Typography>
            <Stack direction="row" alignItems="center" spacing={2} mt={1}>
              <Chip label={weekTimesheet.status} color={
                weekTimesheet.status === 'draft' ? 'default' :
                weekTimesheet.status === 'submitted' ? 'info' :
                weekTimesheet.status === 'approved' ? 'success' :
                weekTimesheet.status === 'rejected' ? 'error' : 'default'
              } />
              {weekTimesheet.status === 'draft' && (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={async () => {
                    if (!token) return;
                    try {
                      await submitTimesheet(weekTimesheet.id, token);
                      const data = await fetchTimesheets(token);
                      setTimesheets(data);
                      setSnackbar({ open: true, message: 'Timesheet submitted for approval!', severity: 'success' });
                    } catch (err: any) {
                      setSnackbar({ open: true, message: err?.response?.data?.detail || 'Failed to submit timesheet', severity: 'error' });
                    }
                  }}
                >
                  Submit for Approval
                </Button>
              )}
            </Stack>
          </Box>
        ) : (
          <Stack direction="row" alignItems="center" spacing={2} mt={2} mb={1}>
            <TextField
              label="Manager Email"
              type="email"
              value={managerEmail}
              onChange={e => setManagerEmail(e.target.value)}
              size="small"
            />
            <Button
              variant="contained"
              onClick={handleCreateTimesheet}
              disabled={!managerEmail || creatingTimesheet}
            >
              Create Timesheet for Week
            </Button>
          </Stack>
        )}
        <Tabs value={dayjs(selectedDay).diff(weekRange.start, 'day')} onChange={handleDayChange} sx={{ mt: 2 }}>
          {daysOfWeek.map((day, idx) => {
            const date = weekRange.start.add(idx, 'day').format('YYYY-MM-DD');
            const total = getTotalHours(date);
            return (
              <Tab
                key={day}
                label={
                  <Box>
                    <Typography fontWeight={500}>{day}</Typography>
                    <Typography variant="caption">{total > 0 ? `${total.toFixed(1)}h` : '0h'}</Typography>
                  </Box>
                }
              />
            );
          })}
        </Tabs>
      </Paper>
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
          <CircularProgress />
        </Box>
      ) : (
  <Box>
          <Box display="flex" justifyContent="flex-end" mb={2}>
            <Button variant="contained" onClick={() => setAddModalOpen(true)} disabled={!weekTimesheet || weekTimesheet.status !== 'draft'}>
              Add Time Entry
            </Button>
          </Box>
          {/* TimeEntriesList for selected day */}
          <Typography variant="h5" align="center" color="text.secondary" mt={4}>
            Time Entries for {dayjs(selectedDay).format('ddd, DD MMM')}
          </Typography>
          {(() => {
            const dayEntries = groupedEntries[selectedDay] || [];
            let dayTotal = 0;
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
                dayTotal += duration / 60;
              }
            }
            const regular = Math.min(dayTotal, 8);
            const overtime = Math.max(dayTotal - 8, 0);
            return (
              <Box mb={2}>
                <Typography align="center" color="text.secondary">
                  Regular Hours: <b>{regular.toFixed(2)}</b>
                  &nbsp;|&nbsp; Overtime Hours: <b>{overtime.toFixed(2)}</b>
                  &nbsp;|&nbsp; Total Hours: <b>{dayTotal.toFixed(2)}</b>
                </Typography>
              </Box>
            );
          })()}
          <Box mt={2}>
            {(() => {
              const dayEntries = groupedEntries[selectedDay] || [];
              if (dayEntries.length === 0) {
                return (
                  <Typography align="center" color="text.secondary" mt={4}>
                    There are no time entries on this day.
                  </Typography>
                );
              }
              return (
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>In</TableCell>
                      <TableCell>Out</TableCell>
                      <TableCell>Project</TableCell>
                      <TableCell>Note</TableCell>
                      <TableCell>Breaks</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dayEntries.map((entry: any) => (
                      <TableRow key={entry.id}>
                        <TableCell>{entry.in_time}</TableCell>
                        <TableCell>{entry.out_time}</TableCell>
                        <TableCell>{entry.project}</TableCell>
                        <TableCell>{entry.note}</TableCell>
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
                          <IconButton onClick={() => handleDeleteEntry(entry.id)} disabled={weekTimesheet.status !== 'draft'}>
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              );
            })()}
          </Box>
          <AddTimeEntryModal
            open={addModalOpen}
            onClose={() => setAddModalOpen(false)}
            onSave={handleAddEntry}
            defaultDate={dayjs(selectedDay).format('YYYY-MM-DD')}
          />
        </Box>
      )}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity as any} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
  </Box>
);
};

export default TimesheetsPage; 