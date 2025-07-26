import axios from 'axios';

export async function createTimesheet(data: any, token: string) {
  // Remove 'entries' from data if present
  const { entries, ...rest } = data;
  const response = await axios.post(
    '/api/v1/timesheets/',
    rest,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  return response.data;
}

export async function addTimeEntry(timesheetId: number, entry: any, token: string) {
  const response = await axios.post(
    `/api/v1/timesheets/${timesheetId}/entries`,
    entry,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  return response.data;
}

export async function deleteTimeEntry(timesheetId: number, entryId: number, token: string) {
  await axios.delete(
    `/api/v1/timesheets/${timesheetId}/entries/${entryId}`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
}

export async function fetchTimesheets(token: string) {
  const response = await axios.get(
    '/api/v1/timesheets/',
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  return response.data;
}

export async function getTimesheet(timesheetId: number, token: string) {
  const response = await axios.get(
    `/api/v1/timesheets/${timesheetId}`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  return response.data;
}

export async function submitTimesheet(timesheetId: number, token: string) {
  const response = await axios.post(
    `/api/v1/timesheets/${timesheetId}/submit`,
    {},
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  return response.data;
} 

export async function approveTimesheet(timesheetId: number, token: string) {
  const response = await axios.post(
    `/api/v1/timesheets/${timesheetId}/approve`,
    {},
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  return response.data;
}

export async function rejectTimesheet(timesheetId: number, token: string) {
  // If /reject endpoint exists, use it. Otherwise, fallback to update status.
  // We'll update this if /reject is confirmed.
  const response = await axios.put(
    `/api/v1/timesheets/${timesheetId}`,
    { status: 'rejected' },
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  return response.data;
} 