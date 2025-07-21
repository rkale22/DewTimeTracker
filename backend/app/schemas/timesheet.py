from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import date, datetime
from app.models.timesheet import TimesheetStatus

class TimesheetCreateRequest(BaseModel):
    week_start: date = Field(..., description="Start date of the week (Monday)")
    hours: Dict[str, Any] = Field(..., description="Daily hours as a dict, e.g., {'Mon': {'regular': 8, 'overtime': 0}}")
    manager_email: str = Field(..., max_length=255, description="Manager's email for approval")
    comment: Optional[str] = Field(None, max_length=1000, description="Optional comment")

class TimesheetUpdateRequest(BaseModel):
    hours: Optional[Dict[str, Any]] = Field(None, description="Daily hours as a dict")
    comment: Optional[str] = Field(None, max_length=1000, description="Optional comment")
    status: Optional[TimesheetStatus] = Field(None, description="Status (for manager approval)")

class TimesheetResponse(BaseModel):
    id: int
    employee_id: int
    week_start: date
    hours: Dict[str, Any]
    status: TimesheetStatus
    manager_email: str
    approved_by: Optional[int]
    approved_at: Optional[datetime]
    comment: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True 