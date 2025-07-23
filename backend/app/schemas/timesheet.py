from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime, time
from app.models.timesheet import TimesheetStatus
from app.schemas.employee import EmployeeBasicResponse

# --- BreakPeriod Schemas ---
class BreakPeriodCreate(BaseModel):
    start_time: time
    end_time: time

class BreakPeriodResponse(BaseModel):
    id: int
    start_time: time
    end_time: time
    created_at: datetime

    class Config:
        from_attributes = True

# --- TimeEntry Schemas ---
class TimeEntryCreate(BaseModel):
    date: date
    in_time: time
    out_time: time
    project: Optional[str] = None
    note: Optional[str] = None
    break_periods: List[BreakPeriodCreate] = []

class TimeEntryResponse(BaseModel):
    id: int
    date: date
    in_time: time
    out_time: time
    project: Optional[str]
    note: Optional[str]
    created_at: datetime
    updated_at: datetime
    break_periods: List[BreakPeriodResponse]
    hours_worked: float

    @classmethod
    def from_orm(cls, obj):
        return cls(
            id=obj.id,
            date=obj.date,
            in_time=obj.in_time,
            out_time=obj.out_time,
            project=obj.project,
            note=obj.note,
            created_at=obj.created_at,
            updated_at=obj.updated_at,
            break_periods=[BreakPeriodResponse.from_orm(bp) for bp in getattr(obj, 'break_periods', [])],
            hours_worked=obj.get_hours_worked() if hasattr(obj, 'get_hours_worked') else 0.0
        )

    class Config:
        from_attributes = True

# --- Timesheet Schemas ---
class TimesheetCreateRequest(BaseModel):
    week_start: date
    manager_email: str
    comment: Optional[str] = None
    project: Optional[str] = None

class TimesheetResponse(BaseModel):
    id: int
    employee_id: int
    week_start: date
    status: TimesheetStatus
    manager_email: str
    approved_by: Optional[int]
    approved_at: Optional[datetime]
    comment: Optional[str]
    project: Optional[str]
    created_at: datetime
    updated_at: datetime
    time_entries: List[TimeEntryResponse]
    regular_hours: float
    overtime_hours: float
    total_hours: float
    employee: EmployeeBasicResponse  # <-- new field

    @classmethod
    def from_orm(cls, obj):
        # Calculate hours from time_entries
        total_hours = 0.0
        regular_hours = 0.0
        overtime_hours = 0.0
        
        for entry in getattr(obj, 'time_entries', []):
            hours_worked = entry.get_hours_worked() if hasattr(entry, 'get_hours_worked') else 0.0
            total_hours += hours_worked
            if hours_worked <= 8.0:  # Standard work day
                regular_hours += hours_worked
            else:
                regular_hours += 8.0
                overtime_hours += (hours_worked - 8.0)
        
        return cls(
            id=obj.id,
            employee_id=obj.employee_id,
            week_start=obj.week_start,
            status=obj.status,
            manager_email=obj.manager_email,
            approved_by=obj.approved_by,
            approved_at=obj.approved_at,
            comment=obj.comment,
            project=obj.project,
            created_at=obj.created_at,
            updated_at=obj.updated_at,
            time_entries=[TimeEntryResponse.from_orm(te) for te in getattr(obj, 'time_entries', [])],
            regular_hours=regular_hours,
            overtime_hours=overtime_hours,
            total_hours=total_hours,
            employee=EmployeeBasicResponse.from_orm(obj.employee) if hasattr(obj, 'employee') and obj.employee else None,
        )

    class Config:
        from_attributes = True 