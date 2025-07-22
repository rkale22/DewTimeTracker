from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, Dict, Any, List
from datetime import datetime, date, time
from enum import Enum
import json


class TimesheetStatus(str, Enum):
    """Timesheet status enumeration"""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class Timesheet(SQLModel, table=True):
    """Timesheet model representing weekly time entries (per-day in/out/breaks)"""
    
    id: Optional[int] = Field(default=None, primary_key=True)
    employee_id: int = Field(foreign_key="employee.id", description="Employee who created the timesheet")
    week_start: date = Field(description="Start date of the week (Monday)")
    hours_json: str = Field(description="JSON string containing per-day time entries (see schemas/timesheet.py)")
    status: TimesheetStatus = Field(default=TimesheetStatus.PENDING, description="Current status")
    manager_email: str = Field(max_length=255, description="Email of manager for approval")
    approved_by: Optional[int] = Field(default=None, foreign_key="employee.id", description="Employee who approved/rejected")
    approved_at: Optional[datetime] = Field(default=None, description="When approval/rejection happened")
    comment: Optional[str] = Field(default=None, max_length=1000, description="Approval/rejection comment")
    token_hash: Optional[str] = Field(default=None, max_length=255, description="Hash for approval token")
    project: Optional[str] = Field(default=None, max_length=255, description="Project name (free text)")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    employee: "Employee" = Relationship(
        back_populates="timesheets_created",
        sa_relationship_kwargs={"foreign_keys": "[Timesheet.employee_id]"}
    )
    approver: Optional["Employee"] = Relationship(
        back_populates="timesheets_approved",
        sa_relationship_kwargs={"foreign_keys": "[Timesheet.approved_by]"}
    )
    audit_logs: List["AuditLog"] = Relationship(back_populates="timesheet")

    @property
    def entries_data(self) -> Dict[str, Any]:
        """Parse hours_json and return as per-day time entry dictionary"""
        try:
            return json.loads(self.hours_json)
        except (json.JSONDecodeError, TypeError):
            return {}

    @entries_data.setter
    def entries_data(self, value: Dict[str, Any]):
        """Set hours_json from per-day time entry dictionary"""
        self.hours_json = json.dumps(value)

    @property
    def entries(self) -> Dict[str, Any]:
        """Expose entries for Pydantic serialization (used by TimesheetResponse)"""
        return self.entries_data

    def get_total_hours(self) -> Dict[str, float]:
        """Calculate total regular and overtime hours from in/out/breaks structure"""
        entries = self.entries_data
        total_regular = 0.0
        total_overtime = 0.0
        for day_entries in entries.values():
            day_total = 0.0
            for entry in day_entries:
                in_time = entry.get("in_time")
                out_time = entry.get("out_time")
                breaks = entry.get("breaks", [])
                if in_time and out_time:
                    t_in = int(in_time[:2]) * 60 + int(in_time[3:5])
                    t_out = int(out_time[:2]) * 60 + int(out_time[3:5])
                    duration = t_out - t_in
                    for br in breaks:
                        b_start = int(br["start"][:2]) * 60 + int(br["start"][3:5])
                        b_end = int(br["end"][:2]) * 60 + int(br["end"][3:5])
                        duration -= (b_end - b_start)
                    day_total += duration / 60.0
            if day_total > 8:
                total_regular += 8
                total_overtime += (day_total - 8)
            else:
                total_regular += day_total
        return {
            "regular": total_regular,
            "overtime": total_overtime,
            "total": total_regular + total_overtime
        }

    class Config:
        schema_extra = {
            "example": {
                "employee_id": 1,
                "week_start": "2024-01-01",
                "hours_json": '{"2025-07-21": [{"in_time": "09:00", "out_time": "18:00", "breaks": [{"start": "12:00", "end": "12:30"}], "project": "Project X", "note": "Worked on feature Y"}]}',
                "status": "pending",
                "manager_email": "manager@client.com",
                "created_at": "2024-01-01T00:00:00",
                "updated_at": "2024-01-01T00:00:00"
            }
        } 