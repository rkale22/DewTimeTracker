import axios from 'axios';

export async function createTimesheet(data: any, token: string) {
  const response = await axios.post(
    '/api/v1/timesheets/',
    data,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  return response.data;
} 