from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import date, datetime, time
from app.models.timesheet import TimesheetStatus

# New: Model for a single break period
class BreakPeriod(BaseModel):
    start: time
    end: time

# New: Model for a single time entry (in/out/breaks per day)
class TimeEntry(BaseModel):
    in_time: time = Field(..., description="Clock-in time")
    out_time: time = Field(..., description="Clock-out time")
    breaks: Optional[List[BreakPeriod]] = Field(default_factory=list, description="List of break periods")
    project: Optional[str] = Field(None, description="Project name (free text)")
    note: Optional[str] = Field(None, description="Optional note")

# New: Per-day entries (date string -> list of time entries)
TimeEntriesDict = Dict[str, List[TimeEntry]]

class TimesheetCreateRequest(BaseModel):
    week_start: date = Field(..., description="Start date of the week (Monday)")
    entries: TimeEntriesDict = Field(..., description="Per-day time entries, e.g. { '2025-07-21': [ ... ] }")
    manager_email: str = Field(..., max_length=255, description="Manager's email for approval")
    comment: Optional[str] = Field(None, max_length=1000, description="Optional comment")
    project: Optional[str] = Field(None, max_length=255, description="Project name (free text)")

class TimesheetUpdateRequest(BaseModel):
    entries: Optional[TimeEntriesDict] = Field(None, description="Per-day time entries")
    comment: Optional[str] = Field(None, max_length=1000, description="Optional comment")
    status: Optional[TimesheetStatus] = Field(None, description="Status (for manager approval)")
    project: Optional[str] = Field(None, max_length=255, description="Project name (free text)")

class TimesheetResponse(BaseModel):
    id: int
    employee_id: int
    week_start: date
    entries: TimeEntriesDict
    status: TimesheetStatus
    manager_email: str
    approved_by: Optional[int]
    approved_at: Optional[datetime]
    comment: Optional[str]
    project: Optional[str]
    created_at: datetime
    updated_at: datetime
    regular_hours: float
    overtime_hours: float
    total_hours: float

    @classmethod
    def from_orm(cls, obj):
        hours = obj.get_total_hours() if hasattr(obj, 'get_total_hours') else {"regular": 0, "overtime": 0, "total": 0}
        return cls(
            id=obj.id,
            employee_id=obj.employee_id,
            week_start=obj.week_start,
            entries=obj.entries,
            status=obj.status,
            manager_email=obj.manager_email,
            approved_by=obj.approved_by,
            approved_at=obj.approved_at,
            comment=obj.comment,
            project=obj.project,
            created_at=obj.created_at,
            updated_at=obj.updated_at,
            regular_hours=hours.get("regular", 0),
            overtime_hours=hours.get("overtime", 0),
            total_hours=hours.get("total", 0),
        )

    class Config:
        from_attributes = True
        orm_mode = True 