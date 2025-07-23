from pydantic import BaseModel
from typing import Optional
from app.models.employee import EmployeeRole

class EmployeeBasicResponse(BaseModel):
    id: int
    full_name: str
    email: str

    class Config:
        from_attributes = True

class EmployeeUpdateRequest(BaseModel):
    """Schema for updating employee details (admin/manager only)"""
    full_name: Optional[str] = None
    role: Optional[EmployeeRole] = None
    client_id: Optional[int] = None
    is_active: Optional[bool] = None 