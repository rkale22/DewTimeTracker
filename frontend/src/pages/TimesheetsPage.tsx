import React, { useEffect, useState } from 'react';
import { Box, Typography, Tabs, Tab, IconButton, Paper, Stack, CircularProgress, Button, TextField } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import axios from 'axios';
import dayjs, { Dayjs } from 'dayjs';
import { useAuth } from '../utils/AuthContext';
import AddTimeEntryModal from '../components/AddTimeEntryModal';

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

  useEffect(() => {
    const fetchTimesheets = async () => {
      setLoading(true);
      try {
        const res = await axios.get('/api/v1/timesheets/', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTimesheets(res.data);
      } catch (err) {
        // handle error
      } finally {
        setLoading(false);
      }
    };
    fetchTimesheets();
  }, [token]);

  // Find timesheet for the selected week
  const weekRange = getWeekRange(selectedWeek);
  const weekTimesheet = timesheets.find((t) => t.week_start === weekRange.start.format('YYYY-MM-DD'));
  const entries = weekTimesheet?.entries || {};

  // Calculate total hours per day
  const getTotalHours = (dateStr: string) => {
    const dayEntries = entries[dateStr] || [];
    let total = 0;
    for (const entry of dayEntries) {
      const inTime = entry.in_time;
      const outTime = entry.out_time;
      if (inTime && outTime) {
        const [inH, inM] = inTime.split(':').map(Number);
        const [outH, outM] = outTime.split(':').map(Number);
        let duration = (outH * 60 + outM) - (inH * 60 + inM);
        for (const br of entry.breaks || []) {
          const [bStartH, bStartM] = br.start.split(':').map(Number);
          const [bEndH, bEndM] = br.end.split(':').map(Number);
          duration -= (bEndH * 60 + bEndM) - (bStartH * 60 + bStartM);
        }
        total += duration / 60;
      }
    }
    return total;
  };

  // Add new entry to local state (for now)
  const handleAddEntry = (entry: any) => {
    const date = entry.date;
    if (!weekTimesheet) return; // Only allow if timesheet exists for week
    const updated = { ...weekTimesheet };
    updated.entries = { ...updated.entries };
    if (!updated.entries[date]) updated.entries[date] = [];
    updated.entries[date].push({
      in_time: entry.in_time,
      out_time: entry.out_time,
      breaks: entry.breaks,
      project: entry.project,
      note: entry.note,
    });
    setTimesheets(ts => ts.map(t => t.id === updated.id ? updated : t));
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
      const res = await axios.post(
        '/api/v1/timesheets/',
        {
          week_start: weekRange.start.format('YYYY-MM-DD'),
          entries: {},
          manager_email: managerEmail,
          comment: '',
          project: '',
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTimesheets(ts => [...ts, res.data]);
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to create timesheet');
    } finally {
      setCreatingTimesheet(false);
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
            <Typography variant="body2" color="text.secondary">
              Regular Hours: <b>{weekTimesheet.regular_hours?.toFixed(2) ?? '0.00'}</b>
              &nbsp;|&nbsp; Overtime Hours: <b>{weekTimesheet.overtime_hours?.toFixed(2) ?? '0.00'}</b>
              &nbsp;|&nbsp; Total Hours: <b>{weekTimesheet.total_hours?.toFixed(2) ?? '0.00'}</b>
            </Typography>
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
            <Button variant="contained" onClick={() => setAddModalOpen(true)} disabled={!weekTimesheet}>
              Add Time Entry
            </Button>
          </Box>
          {/* TimeEntriesList for selected day */}
          <Typography variant="h5" align="center" color="text.secondary" mt={4}>
            Time Entries for {dayjs(selectedDay).format('ddd, DD MMM')}
          </Typography>
          {(() => {
            const dayEntries = entries[selectedDay] || [];
            let dayTotal = 0;
            for (const entry of dayEntries) {
              const inTime = entry.in_time;
              const outTime = entry.out_time;
              if (inTime && outTime) {
                const [inH, inM] = inTime.split(':').map(Number);
                const [outH, outM] = outTime.split(':').map(Number);
                let duration = (outH * 60 + outM) - (inH * 60 + inM);
                for (const br of entry.breaks || []) {
                  const [bStartH, bStartM] = br.start.split(':').map(Number);
                  const [bEndH, bEndM] = br.end.split(':').map(Number);
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
              const dayEntries = entries[selectedDay] || [];
              if (dayEntries.length === 0) {
                return (
                  <Typography align="center" color="text.secondary" mt={4}>
                    There are no time entries on this day.
                  </Typography>
                );
              }
              return dayEntries.map((entry: any, idx: number) => (
                <Paper key={idx} sx={{ p: 2, mb: 2 }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Typography fontWeight={600} color="primary.main">
                      {entry.in_time} - {entry.out_time}
                    </Typography>
                    <Typography color="text.secondary">
                      Project: {entry.project || '-'}
                    </Typography>
                    <Typography color="text.secondary">
                      Note: {entry.note || '-'}
    </Typography>
                  </Stack>
                  {entry.breaks && entry.breaks.length > 0 && (
                    <Box mt={1} ml={2}>
                      <Typography variant="body2" color="text.secondary">Breaks:</Typography>
                      <ul style={{ margin: 0, paddingLeft: 16 }}>
                        {entry.breaks.map((br: any, bidx: number) => (
                          <li key={bidx}>
                            {br.start} - {br.end}
                          </li>
                        ))}
                      </ul>
                    </Box>
                  )}
                </Paper>
              ));
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
  </Box>
);
};

export default TimesheetsPage; 