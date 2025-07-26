import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Stack,
  Chip,
  Divider
} from '@mui/material';
import dayjs from 'dayjs';
import { getTimeOff } from '../services/timeOffService';

interface TimeOffViewerModalProps {
  open: boolean;
  onClose: () => void;
  timeOffId: number | null;
  token: string;
}

const TimeOffViewerModal: React.FC<TimeOffViewerModalProps> = ({
  open,
  onClose,
  timeOffId,
  token
}) => {
  const [timeOffData, setTimeOffData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch time-off data when modal opens
  useEffect(() => {
    if (open && timeOffId && token) {
      fetchTimeOffData();
    }
  }, [open, timeOffId, token]);

  const fetchTimeOffData = async () => {
    if (!timeOffId || !token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await getTimeOff(timeOffId, token);
      setTimeOffData(data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to load time-off request data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
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

  const getTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'vacation':
        return 'primary';
      case 'sick':
        return 'error';
      case 'other':
        return 'default';
      default:
        return 'default';
    }
  };

  const calculateDuration = (startDate: string, endDate: string) => {
    const start = dayjs(startDate);
    const end = dayjs(endDate);
    const diffDays = end.diff(start, 'day') + 1; // Include both start and end dates
    
    if (diffDays === 1) {
      return '1 day';
    } else {
      return `${diffDays} days`;
    }
  };

  if (!open) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          minHeight: '60vh',
          maxHeight: '80vh'
        }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" component="div">
            Time-Off Request Review
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
        ) : timeOffData ? (
          <Box>
            {/* Time-Off Header Info */}
            <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' }}>
              <Stack spacing={3}>
                {/* Employee and Basic Info */}
                <Box>
                  <Typography variant="h6" fontWeight={600} color="#003366" gutterBottom>
                    Employee Information
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {timeOffData.employee?.full_name || 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {timeOffData.employee?.email || 'N/A'}
                  </Typography>
                </Box>

                <Divider />

                {/* Request Details */}
                <Box>
                  <Typography variant="h6" fontWeight={600} color="#003366" gutterBottom>
                    Request Details
                  </Typography>
                  <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                    <Chip 
                      label={timeOffData.type || 'N/A'} 
                      color={getTypeColor(timeOffData.type) as any}
                      variant="outlined"
                    />
                    <Chip 
                      label={timeOffData.status || 'N/A'} 
                      color={getStatusColor(timeOffData.status) as any}
                    />
                  </Stack>
                  
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
                        Date Range:
                      </Typography>
                      <Typography variant="body1">
                        {dayjs(timeOffData.start_date).format('MMM DD, YYYY')} - {dayjs(timeOffData.end_date).format('MMM DD, YYYY')}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Duration: {calculateDuration(timeOffData.start_date, timeOffData.end_date)}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
                        Submitted:
                      </Typography>
                      <Typography variant="body2">
                        {dayjs(timeOffData.created_at).format('MMM DD, YYYY [at] h:mm A')}
                      </Typography>
                    </Box>

                    {timeOffData.approved_at && (
                      <Box>
                        <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
                          {timeOffData.status === 'approved' ? 'Approved' : 'Rejected'}:
                        </Typography>
                        <Typography variant="body2">
                          {dayjs(timeOffData.approved_at).format('MMM DD, YYYY [at] h:mm A')}
                        </Typography>
                        {timeOffData.approver && (
                          <Typography variant="body2" color="text.secondary">
                            by {timeOffData.approver.full_name}
                          </Typography>
                        )}
                      </Box>
                    )}
                  </Stack>
                </Box>

                <Divider />

                {/* Comments Section */}
                <Box>
                  <Typography variant="h6" fontWeight={600} color="#003366" gutterBottom>
                    Comments
                  </Typography>
                  
                  {timeOffData.comment && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" fontWeight={600} color="text.secondary" gutterBottom>
                        Employee Comment:
                      </Typography>
                      <Paper sx={{ p: 2, background: 'rgba(0, 51, 102, 0.05)' }}>
                        <Typography variant="body2">
                          {timeOffData.comment}
                        </Typography>
                      </Paper>
                    </Box>
                  )}

                  {timeOffData.manager_comment && (
                    <Box>
                      <Typography variant="subtitle2" fontWeight={600} color="text.secondary" gutterBottom>
                        Manager Comment:
                      </Typography>
                      <Paper sx={{ p: 2, background: 'rgba(0, 51, 102, 0.05)' }}>
                        <Typography variant="body2">
                          {timeOffData.manager_comment}
                        </Typography>
                      </Paper>
                    </Box>
                  )}

                  {!timeOffData.comment && !timeOffData.manager_comment && (
                    <Typography variant="body2" color="text.secondary" fontStyle="italic">
                      No comments provided.
                    </Typography>
                  )}
                </Box>
              </Stack>
            </Paper>
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

export default TimeOffViewerModal; 