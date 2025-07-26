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
  Stack,
  InputAdornment,
  IconButton
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '../utils/AuthContext';
import { createEmployee, CreateEmployeeRequest } from '../services/employeeService';

interface Client {
  id: number;
  name: string;
  code: string;
}

interface EmployeeAddModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const EmployeeAddModal: React.FC<EmployeeAddModalProps> = ({
  open,
  onClose,
  onSuccess
}) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
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
    
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    if (!formData.password) {
      setError('Password is required');
      return false;
    }
    
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
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
    if (!token) return;
    
    if (!validateForm()) {
      return;
    }
    
    setSaving(true);
    setError(null);
    
    try {
      const employeeData: CreateEmployeeRequest = {
        full_name: formData.full_name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        role: formData.role,
        is_active: formData.is_active
      };
      
      // Handle client_id based on role
      if (formData.role === 'dew_admin') {
        employeeData.client_id = undefined;
      } else {
        employeeData.client_id = formData.client_id ? parseInt(formData.client_id) : undefined;
      }
      
      await createEmployee(employeeData, token);
      onSuccess();
      handleClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to create employee');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setFormData({
      full_name: '',
      email: '',
      password: '',
      role: '',
      client_id: '',
      is_active: true
    });
    setShowPassword(false);
    onClose();
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
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
          minHeight: '70vh'
        }
      }}
    >
      <DialogTitle>
        <Typography variant="h6" component="div">
          Add New Employee
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
            
            {/* Email */}
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              required
              error={!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)}
              helperText={
                !formData.email.trim() ? 'Email is required' :
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) ? 'Please enter a valid email address' : ''
              }
            />
            
            {/* Password */}
            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              required
              error={!formData.password || formData.password.length < 8}
              helperText={
                !formData.password ? 'Password is required' :
                formData.password.length < 8 ? 'Password must be at least 8 characters long' : ''
              }
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleTogglePasswordVisibility}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
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
          {saving ? 'Creating...' : 'Create Employee'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EmployeeAddModal; 