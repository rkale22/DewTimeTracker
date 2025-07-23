import axios from 'axios';

export async function createTimeOffRequest(data: any, token: string) {
  const response = await axios.post(
    '/api/v1/time_off/',
    data,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  return response.data;
}

export async function fetchTimeOffRequests(token: string) {
  const response = await axios.get(
    '/api/v1/time_off/',
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  return response.data;
}

export async function deleteTimeOffRequest(requestId: number, token: string) {
  await axios.delete(
    `/api/v1/time_off/${requestId}`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
} 