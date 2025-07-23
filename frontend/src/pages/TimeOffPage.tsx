import React, { useEffect, useState } from 'react';
import { Typography, Box, TextField, Button, Paper, Stack, Table, TableHead, TableRow, TableCell, TableBody, Chip, Snackbar, Alert, MenuItem } from '@mui/material';
import dayjs from 'dayjs';
import { useAuth } from '../utils/AuthContext';
import { createTimeOffRequest, fetchTimeOffRequests, deleteTimeOffRequest } from '../services/timeOffService';

const timeOffTypes = [
  { value: 'vacation', label: 'Vacation' },
  { value: 'sick', label: 'Sick' },
  { value: 'other', label: 'Other' },
];

const TimeOffPage: React.FC = () => {
  const { token } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    start_date: dayjs().format('YYYY-MM-DD'),
    end_date: dayjs().format('YYYY-MM-DD'),
    type: 'vacation',
    manager_email: '',
    comment: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetchTimeOffRequests(token)
      .then(setRequests)
      .finally(() => setLoading(false));
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createTimeOffRequest(form, token!);
      setSnackbar({ open: true, message: 'Time off request submitted!', severity: 'success' });
      setForm({ ...form, comment: '' });
      const data = await fetchTimeOffRequests(token!);
      setRequests(data);
    } catch (err: any) {
      setSnackbar({ open: true, message: err?.response?.data?.detail || 'Failed to submit request', severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!token) return;
    try {
      await deleteTimeOffRequest(id, token);
      setSnackbar({ open: true, message: 'Request deleted!', severity: 'success' });
      setRequests(requests.filter(r => r.id !== id));
    } catch (err: any) {
      setSnackbar({ open: true, message: err?.response?.data?.detail || 'Failed to delete request', severity: 'error' });
    }
  };

  return (
    <Box maxWidth={800} mx="auto" mt={4}>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h5" color="primary" gutterBottom>Request Time Off</Typography>
        <form onSubmit={handleSubmit}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <TextField
              label="Start Date"
              type="date"
              name="start_date"
              value={form.start_date}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
              size="small"
              required
            />
            <TextField
              label="End Date"
              type="date"
              name="end_date"
              value={form.end_date}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
              size="small"
              required
            />
            <TextField
              select
              label="Type"
              name="type"
              value={form.type}
              onChange={handleChange}
              size="small"
              required
              sx={{ minWidth: 120 }}
            >
              {timeOffTypes.map(opt => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </TextField>
            <TextField
              label="Manager Email"
              type="email"
              name="manager_email"
              value={form.manager_email}
              onChange={handleChange}
              size="small"
              required
            />
            <TextField
              label="Comment"
              name="comment"
              value={form.comment}
              onChange={handleChange}
              size="small"
              sx={{ minWidth: 180 }}
            />
            <Button type="submit" variant="contained" disabled={submitting || !form.manager_email}>Submit</Button>
          </Stack>
        </form>
      </Paper>
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>Your Time Off Requests</Typography>
        {loading ? (
          <Typography>Loading...</Typography>
        ) : requests.length === 0 ? (
          <Typography color="text.secondary">No requests yet.</Typography>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Dates</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Manager</TableCell>
                <TableCell>Comment</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests.map((req: any) => (
                <TableRow key={req.id}>
                  <TableCell>{dayjs(req.start_date).format('DD MMM')} - {dayjs(req.end_date).format('DD MMM')}</TableCell>
                  <TableCell>{req.type.charAt(0).toUpperCase() + req.type.slice(1)}</TableCell>
                  <TableCell>
                    <Chip label={req.status} color={
                      req.status === 'pending' ? 'info' :
                      req.status === 'approved' ? 'success' :
                      req.status === 'rejected' ? 'error' : 'default'
                    } />
                  </TableCell>
                  <TableCell>{req.manager_email}</TableCell>
                  <TableCell>{req.comment}</TableCell>
                  <TableCell>
                    {req.status === 'pending' && (
                      <Button color="error" size="small" onClick={() => handleDelete(req.id)}>Delete</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>
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

export default TimeOffPage; 