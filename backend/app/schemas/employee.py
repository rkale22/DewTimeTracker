from pydantic import BaseModel, EmailStr, validator
from typing import Optional
from datetime import datetime
from app.models.employee import EmployeeRole

class EmployeeBasicResponse(BaseModel):
    id: int
    full_name: str
    email: str

    class Config:
        from_attributes = True

class EmployeeCreateRequest(BaseModel):
    """Schema for creating new employees (admin only)"""
    full_name: str
    email: EmailStr
    password: str
    role: EmployeeRole
    client_id: Optional[int] = None
    is_active: bool = True

    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        return v

    @validator('client_id')
    def validate_client_id(cls, v, values):
        role = values.get('role')
        if role == EmployeeRole.DEW_ADMIN and v is not None:
            raise ValueError('Dew Admin should not have a client_id')
        if role in [EmployeeRole.CONSULTANT, EmployeeRole.CLIENT_MANAGER] and v is None:
            raise ValueError('Client ID required for this role')
        return v

class EmployeeUpdateRequest(BaseModel):
    """Schema for updating employee details (admin/manager only)"""
    full_name: Optional[str] = None
    role: Optional[EmployeeRole] = None
    client_id: Optional[int] = None
    is_active: Optional[bool] = None

class ClientInfo(BaseModel):
    """Client information for employee responses"""
    id: int
    name: str
    code: str

    class Config:
        from_attributes = True

class EmployeeResponse(BaseModel):
    """Comprehensive employee response with client details"""
    id: int
    email: str
    full_name: str
    role: EmployeeRole
    client_id: Optional[int] = None
    client: Optional[ClientInfo] = None
    is_active: bool = True
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True 