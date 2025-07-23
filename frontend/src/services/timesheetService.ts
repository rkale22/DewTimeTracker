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