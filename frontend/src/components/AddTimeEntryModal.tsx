import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, IconButton, Stack, Typography, Box
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import dayjs from 'dayjs';

interface BreakPeriod {
  start: string;
  end: string;
}

interface AddTimeEntryModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (entry: any) => void;
  defaultDate: string;
}

const AddTimeEntryModal: React.FC<AddTimeEntryModalProps> = ({ open, onClose, onSave, defaultDate }) => {
  const [date, setDate] = useState(defaultDate);
  const [inTime, setInTime] = useState('');
  const [outTime, setOutTime] = useState('');
  const [breaks, setBreaks] = useState<BreakPeriod[]>([]);
  const [project, setProject] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const handleAddBreak = () => setBreaks([...breaks, { start: '', end: '' }]);
  const handleRemoveBreak = (idx: number) => setBreaks(breaks.filter((_, i) => i !== idx));
  const handleBreakChange = (idx: number, field: 'start' | 'end', value: string) => {
    setBreaks(breaks.map((br, i) => i === idx ? { ...br, [field]: value } : br));
  };

  const handleSave = () => {
    setError('');
    if (!inTime || !outTime) {
      setError('In and Out times are required');
      return;
    }
    if (outTime <= inTime) {
      setError('Out time must be after In time');
      return;
    }
    for (const br of breaks) {
      if (!br.start || !br.end) {
        setError('All breaks must have start and end times');
        return;
      }
      if (br.end <= br.start) {
        setError('Break end must be after start');
        return;
      }
    }
    onSave({
      date,
      in_time: inTime,
      out_time: outTime,
      breaks,
      project,
      note,
    });
    // Reset form
    setInTime('');
    setOutTime('');
    setBreaks([]);
    setProject('');
    setNote('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Add Time Entry</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          <TextField
            label="Date"
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <Stack direction="row" spacing={2}>
            <TextField
              label="In Time"
              type="time"
              value={inTime}
              onChange={e => setInTime(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="Out Time"
              type="time"
              value={outTime}
              onChange={e => setOutTime(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Stack>
          <Box>
            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
              <Typography variant="subtitle2">Breaks</Typography>
              <IconButton size="small" onClick={handleAddBreak}><AddIcon fontSize="small" /></IconButton>
            </Stack>
            {breaks.map((br, idx) => (
              <Stack direction="row" spacing={1} alignItems="center" key={idx} mb={1}>
                <TextField
                  label="Start"
                  type="time"
                  value={br.start}
                  onChange={e => handleBreakChange(idx, 'start', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                />
                <TextField
                  label="End"
                  type="time"
                  value={br.end}
                  onChange={e => handleBreakChange(idx, 'end', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                />
                <IconButton size="small" onClick={() => handleRemoveBreak(idx)}><RemoveIcon fontSize="small" /></IconButton>
              </Stack>
            ))}
          </Box>
          <TextField
            label="Project"
            value={project}
            onChange={e => setProject(e.target.value)}
            fullWidth
          />
          <TextField
            label="Note"
            value={note}
            onChange={e => setNote(e.target.value)}
            fullWidth
            multiline
            rows={2}
          />
          {error && <Typography color="error">{error}</Typography>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">Save</Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddTimeEntryModal; 