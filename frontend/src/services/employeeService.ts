import axios from 'axios';

// Types
export interface Employee {
  id: number;
  full_name: string;
  email: string;
  role: string;
  client_id?: number;
  client?: {
    id: number;
    name: string;
    code: string;
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateEmployeeRequest {
  full_name: string;
  email: string;
  password: string;
  role: string;
  client_id?: number;
  is_active?: boolean;
}

export interface UpdateEmployeeRequest {
  full_name?: string;
  role?: string;
  client_id?: number;
  is_active?: boolean;
}

// API functions
export async function fetchEmployees(token: string): Promise<Employee[]> {
  const response = await axios.get('/api/v1/employees/', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
}

export async function getEmployee(employeeId: number, token: string): Promise<Employee> {
  const response = await axios.get(`/api/v1/employees/${employeeId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
}

export async function createEmployee(employeeData: CreateEmployeeRequest, token: string): Promise<Employee> {
  const response = await axios.post('/api/v1/employees/', employeeData, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
}

export async function updateEmployee(employeeId: number, employeeData: UpdateEmployeeRequest, token: string): Promise<Employee> {
  const response = await axios.put(`/api/v1/employees/${employeeId}`, employeeData, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
}

export async function deleteEmployee(employeeId: number, token: string): Promise<void> {
  await axios.delete(`/api/v1/employees/${employeeId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
} 