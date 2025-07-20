from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, Dict, Any
from datetime import datetime, date
from enum import Enum
import json


class TimesheetStatus(str, Enum):
    """Timesheet status enumeration"""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class Timesheet(SQLModel, table=True):
    """Timesheet model representing weekly time entries"""
    
    id: Optional[int] = Field(default=None, primary_key=True)
    employee_id: int = Field(foreign_key="employee.id", description="Employee who created the timesheet")
    week_start: date = Field(description="Start date of the week (Monday)")
    hours_json: str = Field(description="JSON string containing daily hours")
    status: TimesheetStatus = Field(default=TimesheetStatus.PENDING, description="Current status")
    manager_email: str = Field(max_length=255, description="Email of manager for approval")
    approved_by: Optional[int] = Field(default=None, foreign_key="employee.id", description="Employee who approved/rejected")
    approved_at: Optional[datetime] = Field(default=None, description="When approval/rejection happened")
    comment: Optional[str] = Field(default=None, max_length=1000, description="Approval/rejection comment")
    token_hash: Optional[str] = Field(default=None, max_length=255, description="Hash for approval token")
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
    
    @property
    def hours_data(self) -> Dict[str, Any]:
        """Parse hours_json and return as dictionary"""
        try:
            return json.loads(self.hours_json)
        except (json.JSONDecodeError, TypeError):
            return {}
    
    @hours_data.setter
    def hours_data(self, value: Dict[str, Any]):
        """Set hours_json from dictionary"""
        self.hours_json = json.dumps(value)
    
    def get_total_hours(self) -> Dict[str, float]:
        """Calculate total regular and overtime hours"""
        hours = self.hours_data
        total_regular = 0.0
        total_overtime = 0.0
        
        for day_data in hours.values():
            if isinstance(day_data, dict):
                total_regular += day_data.get("regular", 0.0)
                total_overtime += day_data.get("overtime", 0.0)
        
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
                "hours_json": '{"Mon": {"regular": 8, "overtime": 0}, "Tue": {"regular": 8, "overtime": 1.5}}',
                "status": "pending",
                "manager_email": "manager@client.com",
                "created_at": "2024-01-01T00:00:00",
                "updated_at": "2024-01-01T00:00:00"
            }
        } 