from fastapi import APIRouter, Depends
from app.models.employee import Employee, EmployeeRole
from app.core.dependencies import get_current_user

router = APIRouter()

@router.get("/summary")
def dashboard_summary(current_user: Employee = Depends(get_current_user)):
    role = current_user.role.value
    if role == "consultant":
        # Employee dashboard mock data
        return {
            "userName": current_user.full_name,
            "trackedHours": [
                {"date": "2024-07-22", "worked": 8, "breaks": 1, "overtime": 0},
                {"date": "2024-07-23", "worked": 7.5, "breaks": 1, "overtime": 0.5},
            ],
            "upcomingTimeOff": [
                {"start": "2024-08-01", "end": "2024-08-03", "type": "vacation", "status": "approved"}
            ],
            "notifications": [
                {"type": "reminder", "message": "You have 1 timesheet not submitted."}
            ]
        }
    elif role == "client_manager":
        # Manager dashboard mock data
        return {
            "userName": current_user.full_name,
            "pendingApprovals": {"timesheets": 3, "timeoff": 2},
            "teamTrackedHours": [
                {"employee": "Alice Smith", "date": "2024-07-22", "worked": 8},
                {"employee": "Bob Jones", "date": "2024-07-22", "worked": 7},
            ],
            "upcomingTeamTimeOff": [
                {"employee": "Alice Smith", "start": "2024-08-01", "end": "2024-08-03", "type": "vacation"}
            ],
            "notifications": [
                {"type": "pending", "message": "3 timesheets pending your approval."}
            ]
        }
    elif role == "dew_admin":
        # Admin dashboard mock data
        return {
            "userName": current_user.full_name,
            "orgStats": {"totalUsers": 25, "totalTimesheets": 120, "totalHours": 960},
            "notifications": [
                {"type": "system", "message": "All systems operational."}
            ]
        }
    else:
        return {"message": "Unknown role"} 