from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List, TYPE_CHECKING
from datetime import datetime, date
from enum import Enum


class TimesheetStatus(str, Enum):
    """Timesheet status enumeration"""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


if TYPE_CHECKING:
    from .time_entry import TimeEntry


class Timesheet(SQLModel, table=True):
    """Timesheet model representing weekly time entries (per-day in/out/breaks)"""
    
    id: Optional[int] = Field(default=None, primary_key=True)
    employee_id: int = Field(foreign_key="employee.id", description="Employee who created the timesheet")
    week_start: date = Field(description="Start date of the week (Monday)")
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
    time_entries: List["TimeEntry"] = Relationship(
        back_populates="timesheet",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )

    class Config:
        schema_extra = {
            "example": {
                "employee_id": 1,
                "week_start": "2024-01-01",
                "status": "pending",
                "manager_email": "manager@client.com",
                "created_at": "2024-01-01T00:00:00",
                "updated_at": "2024-01-01T00:00:00"
            }
        } 