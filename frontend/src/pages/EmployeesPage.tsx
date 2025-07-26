import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Stack,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  Snackbar
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useAuth } from '../utils/AuthContext';
import EmployeeEditModal from '../components/EmployeeEditModal';
import EmployeeViewModal from '../components/EmployeeViewModal';
import EmployeeAddModal from '../components/EmployeeAddModal';
import dayjs from 'dayjs';

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

const EmployeesPage: React.FC = () => {
  const { token } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewEmployee, setViewEmployee] = useState<Employee | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ 
    open: false, 
    message: '', 
    severity: 'success' 
  });

  // Fetch employees data
  const fetchEmployees = useCallback(async () => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/v1/employees/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch employees');
      }
      
      const data = await response.json();
      setEmployees(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Filter employees based on search and filter criteria
  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = 
      employee.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.role.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || employee.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && employee.is_active) ||
      (statusFilter === 'inactive' && !employee.is_active);
    const matchesClient = clientFilter === 'all' || 
      (employee.client && employee.client.name.toLowerCase().includes(clientFilter.toLowerCase()));
    
    return matchesSearch && matchesRole && matchesStatus && matchesClient;
  });

  // Get unique clients for filter dropdown
  const uniqueClients = Array.from(
    new Set(
      employees
        .filter(emp => emp.client)
        .map(emp => emp.client!.name)
    )
  ).sort();

  // Get unique roles for filter dropdown
  const uniqueRoles = Array.from(
    new Set(employees.map(emp => emp.role))
  ).sort();

  // Pagination handlers
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Get role color for chips
  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'dew_admin':
        return 'error';
      case 'client_manager':
        return 'warning';
      case 'consultant':
        return 'primary';
      default:
        return 'default';
    }
  };

  // Get status color for chips
  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'success' : 'error';
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setRoleFilter('all');
    setStatusFilter('all');
    setClientFilter('all');
    setPage(0);
  };

  // Handle employee actions
  const handleViewEmployee = (employee: Employee) => {
    setViewEmployee(employee);
    setViewModalOpen(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setEditModalOpen(true);
  };

  const handleSaveEmployee = (updatedEmployee: Employee) => {
    // Update the employee in the local state
    setEmployees(prev => 
      prev.map(emp => 
        emp.id === updatedEmployee.id ? updatedEmployee : emp
      )
    );
    
    setSnackbar({
      open: true,
      message: 'Employee updated successfully!',
      severity: 'success'
    });
  };

  const handleAddEmployee = () => {
    setAddModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setSelectedEmployee(null);
  };

  const handleCloseViewModal = () => {
    setViewModalOpen(false);
    setViewEmployee(null);
  };

  const handleCloseAddModal = () => {
    setAddModalOpen(false);
  };

  const handleEmployeeCreated = () => {
    // Refresh the employees list
    fetchEmployees();
    setSnackbar({
      open: true,
      message: 'Employee created successfully!',
      severity: 'success'
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: '100%' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" color="primary" gutterBottom sx={{ fontWeight: 600 }}>
          Employee Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage employees, roles, and client assignments
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Search and Filter Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack spacing={2}>
            {/* Search Bar */}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField
                fullWidth
                placeholder="Search by name, email, or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
                size="small"
              />
              <Button
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={() => setShowFilters(!showFilters)}
                size="small"
              >
                Filters
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddEmployee}
                size="small"
              >
                Add Employee
              </Button>
            </Box>

            {/* Filter Options */}
            {showFilters && (
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={roleFilter}
                    label="Role"
                    onChange={(e) => setRoleFilter(e.target.value)}
                  >
                    <MenuItem value="all">All Roles</MenuItem>
                    {uniqueRoles.map(role => (
                      <MenuItem key={role} value={role}>
                        {role.replace('_', ' ').toUpperCase()}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={statusFilter}
                    label="Status"
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <MenuItem value="all">All Status</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Client</InputLabel>
                  <Select
                    value={clientFilter}
                    label="Client"
                    onChange={(e) => setClientFilter(e.target.value)}
                  >
                    <MenuItem value="all">All Clients</MenuItem>
                    {uniqueClients.map(client => (
                      <MenuItem key={client} value={client}>
                        {client}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Button
                  variant="outlined"
                  onClick={clearFilters}
                  size="small"
                >
                  Clear Filters
                </Button>
              </Box>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Showing {filteredEmployees.length} of {employees.length} employees
        </Typography>
        {(searchTerm || roleFilter !== 'all' || statusFilter !== 'all' || clientFilter !== 'all') && (
          <Chip 
            label="Filters Applied" 
            color="primary" 
            variant="outlined" 
            size="small" 
          />
        )}
      </Box>

      {/* Employees Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Employee</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Client</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Created</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredEmployees
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((employee) => (
                  <TableRow key={employee.id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="body1" fontWeight={500}>
                          {employee.full_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {employee.email}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={employee.role.replace('_', ' ').toUpperCase()}
                        color={getRoleColor(employee.role) as any}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {employee.client ? (
  <Box>
                          <Typography variant="body2" fontWeight={500}>
                            {employee.client.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {employee.client.code}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary" fontStyle="italic">
                          No client assigned
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={employee.is_active ? 'Active' : 'Inactive'}
                        color={getStatusColor(employee.is_active) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {dayjs(employee.created_at).format('MMM DD, YYYY')}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => handleViewEmployee(employee)}
                            color="primary"
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Employee">
                          <IconButton
                            size="small"
                            onClick={() => handleEditEmployee(employee)}
                            color="primary"
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredEmployees.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Empty State */}
      {filteredEmployees.length === 0 && !loading && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No employees found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchTerm || roleFilter !== 'all' || statusFilter !== 'all' || clientFilter !== 'all'
              ? 'Try adjusting your search or filter criteria'
              : 'No employees have been added yet'}
    </Typography>
        </Box>
      )}

      {/* Employee Edit Modal */}
      <EmployeeEditModal
        open={editModalOpen}
        onClose={handleCloseEditModal}
        employee={selectedEmployee}
        onSave={handleSaveEmployee}
      />

      {/* Employee View Modal */}
      <EmployeeViewModal
        open={viewModalOpen}
        onClose={handleCloseViewModal}
        employee={viewEmployee}
      />

      {/* Employee Add Modal */}
      <EmployeeAddModal
        open={addModalOpen}
        onClose={handleCloseAddModal}
        onSuccess={handleEmployeeCreated}
      />

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
  </Box>
);
};

export default EmployeesPage; 