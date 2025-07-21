from sqlmodel import SQLModel, Field, Relationship
from typing import Optional
from datetime import date, datetime
from enum import Enum

class TimeOffType(str, Enum):
    VACATION = "vacation"
    SICK = "sick"
    OTHER = "other"

class TimeOffStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class TimeOff(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    employee_id: int = Field(foreign_key="employee.id")
    start_date: date
    end_date: date
    type: TimeOffType
    status: TimeOffStatus = Field(default=TimeOffStatus.PENDING)
    comment: Optional[str] = None
    manager_comment: Optional[str] = None
    approved_by: Optional[int] = Field(default=None, foreign_key="employee.id")
    approved_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    employee: Optional["Employee"] = Relationship(back_populates="time_off_requests", sa_relationship_kwargs={"foreign_keys": "TimeOff.employee_id"})
    approver: Optional["Employee"] = Relationship(back_populates=None, sa_relationship_kwargs={"foreign_keys": "TimeOff.approved_by"}) 