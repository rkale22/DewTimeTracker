import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Stack
} from '@mui/material';
import { useAuth } from '../utils/AuthContext';

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

interface Client {
  id: number;
  name: string;
  code: string;
}

interface EmployeeEditModalProps {
  open: boolean;
  onClose: () => void;
  employee: Employee | null;
  onSave: (updatedEmployee: Employee) => void;
}

const EmployeeEditModal: React.FC<EmployeeEditModalProps> = ({
  open,
  onClose,
  employee,
  onSave
}) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  
  // Form state
  const [formData, setFormData] = useState({
    full_name: '',
    role: '',
    client_id: '',
    is_active: true
  });

  // Load clients when modal opens
  useEffect(() => {
    if (open) {
      fetchClients();
    }
  }, [open]);

  // Update form data when employee changes
  useEffect(() => {
    if (employee) {
      setFormData({
        full_name: employee.full_name,
        role: employee.role,
        client_id: employee.client_id?.toString() || '',
        is_active: employee.is_active
      });
    }
  }, [employee]);

  const fetchClients = async () => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/v1/clients/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch clients');
      }
      
      const data = await response.json();
      setClients(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!formData.full_name.trim()) {
      setError('Full name is required');
      return false;
    }
    
    if (!formData.role) {
      setError('Role is required');
      return false;
    }
    
    // Validate client_id based on role
    if (formData.role === 'dew_admin' && formData.client_id) {
      setError('Dew Admin should not have a client assigned');
      return false;
    }
    
    if (formData.role !== 'dew_admin' && !formData.client_id) {
      setError('Client assignment is required for this role');
      return false;
    }
    
    return true;
  };

  const handleSave = async () => {
    if (!employee || !token) return;
    
    if (!validateForm()) {
      return;
    }
    
    setSaving(true);
    setError(null);
    
    try {
      const updateData: any = {
        full_name: formData.full_name.trim(),
        role: formData.role,
        is_active: formData.is_active
      };
      
      // Handle client_id based on role
      if (formData.role === 'dew_admin') {
        updateData.client_id = null;
      } else {
        updateData.client_id = formData.client_id ? parseInt(formData.client_id) : null;
      }
      
      const response = await fetch(`/api/v1/employees/${employee.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update employee');
      }
      
      const updatedEmployee = await response.json();
      onSave(updatedEmployee);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update employee');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setFormData({
      full_name: '',
      role: '',
      client_id: '',
      is_active: true
    });
    onClose();
  };

  if (!open) return null;

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          minHeight: '60vh'
        }
      }}
    >
      <DialogTitle>
        <Typography variant="h6" component="div">
          Edit Employee
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Stack spacing={3} sx={{ mt: 1 }}>
            {error && (
              <Alert severity="error">
                {error}
              </Alert>
            )}
            
            {/* Employee Name */}
            <TextField
              fullWidth
              label="Full Name"
              value={formData.full_name}
              onChange={(e) => handleInputChange('full_name', e.target.value)}
              required
              error={!formData.full_name.trim()}
              helperText={!formData.full_name.trim() ? 'Full name is required' : ''}
            />
            
            {/* Email (Read-only) */}
            <TextField
              fullWidth
              label="Email"
              value={employee?.email || ''}
              disabled
              helperText="Email cannot be changed"
            />
            
            {/* Role */}
            <FormControl fullWidth required error={!formData.role}>
              <InputLabel>Role</InputLabel>
              <Select
                value={formData.role}
                label="Role"
                onChange={(e) => handleInputChange('role', e.target.value)}
              >
                <MenuItem value="consultant">Consultant</MenuItem>
                <MenuItem value="client_manager">Client Manager</MenuItem>
                <MenuItem value="dew_admin">Dew Admin</MenuItem>
              </Select>
              {!formData.role && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                  Role is required
                </Typography>
              )}
            </FormControl>
            
            {/* Client Assignment */}
            <FormControl 
              fullWidth 
              required={formData.role !== 'dew_admin'}
              error={formData.role !== 'dew_admin' && !formData.client_id}
              disabled={formData.role === 'dew_admin'}
            >
              <InputLabel>Client Assignment</InputLabel>
              <Select
                value={formData.client_id}
                label="Client Assignment"
                onChange={(e) => handleInputChange('client_id', e.target.value)}
              >
                <MenuItem value="">
                  <em>Select a client</em>
                </MenuItem>
                {clients.map((client) => (
                  <MenuItem key={client.id} value={client.id.toString()}>
                    {client.name} ({client.code})
                  </MenuItem>
                ))}
              </Select>
              {formData.role !== 'dew_admin' && !formData.client_id && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                  Client assignment is required for this role
                </Typography>
              )}
              {formData.role === 'dew_admin' && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, ml: 1.5 }}>
                  Dew Admins are not assigned to specific clients
                </Typography>
              )}
            </FormControl>
            
            {/* Active Status */}
            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_active}
                  onChange={(e) => handleInputChange('is_active', e.target.checked)}
                  color="primary"
                />
              }
              label="Active Account"
            />
            
            {/* Current Assignment Info */}
            {employee?.client && (
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Current Assignment:</strong> {employee.client.name} ({employee.client.code})
                </Typography>
              </Box>
            )}
          </Stack>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose} disabled={saving}>
          Cancel
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          disabled={saving || loading}
          startIcon={saving ? <CircularProgress size={16} /> : null}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EmployeeEditModal; 