from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from app.models.time_off import TimeOffType, TimeOffStatus

class TimeOffBase(BaseModel):
    start_date: date
    end_date: date
    type: TimeOffType
    comment: Optional[str] = None

class TimeOffCreateRequest(TimeOffBase):
    manager_email: str

class TimeOffUpdateRequest(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    type: Optional[TimeOffType] = None
    comment: Optional[str] = None
    manager_comment: Optional[str] = None
    status: Optional[TimeOffStatus] = None

class TimeOffResponse(TimeOffBase):
    id: int
    employee_id: int
    status: TimeOffStatus
    manager_email: str
    manager_comment: Optional[str] = None
    approved_by: Optional[int] = None
    approved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True 