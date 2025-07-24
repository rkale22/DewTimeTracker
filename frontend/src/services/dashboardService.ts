// Dashboard service for fetching dashboard summary data
// Note: This service needs to be used within a component that has access to AuthContext
// The token should be passed as a parameter to getDashboardSummary

// TypeScript interfaces for dashboard data
export interface DashboardNotification {
  type: string;
  message: string;
}

export interface TrackedHoursData {
  date: string;
  worked: number;
  breaks: number;
  overtime: number;
}

export interface UpcomingTimeOffData {
  start: string;
  end: string;
  type: string;
  status: string;
}

export interface TeamTrackedHoursData {
  employee: string;
  date: string;
  worked: number;
}

export interface UpcomingTeamTimeOffData {
  employee: string;
  start: string;
  end: string;
  type: string;
}

export interface PendingApprovalsData {
  timesheets: number;
  timeoff: number;
}

export interface OrgStatsData {
  totalUsers: number;
  totalTimesheets: number;
  totalHours: number;
}

// Role-specific dashboard interfaces
export interface EmployeeDashboardSummary {
  userName: string;
  trackedHours: TrackedHoursData[];
  upcomingTimeOff: UpcomingTimeOffData[];
  notifications: DashboardNotification[];
}

export interface ManagerDashboardSummary {
  userName: string;
  pendingApprovals: PendingApprovalsData;
  teamTrackedHours: TeamTrackedHoursData[];
  upcomingTeamTimeOff: UpcomingTeamTimeOffData[];
  notifications: DashboardNotification[];
}

export interface AdminDashboardSummary {
  orgStats: OrgStatsData;
  notifications: DashboardNotification[];
}

export type DashboardSummary = EmployeeDashboardSummary | ManagerDashboardSummary | AdminDashboardSummary;

// API base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8002/api/v1';

/**
 * Fetch dashboard summary data from the backend
 * Returns role-based dashboard data (employee, manager, or admin)
 */
export const getDashboardSummary = async (token: string): Promise<DashboardSummary> => {
  try {
    if (!token) {
      throw new Error('No authentication token provided');
    }

    const response = await fetch(`${API_BASE_URL}/dashboard/summary`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    throw error;
  }
}; 