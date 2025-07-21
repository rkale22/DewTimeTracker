from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional
from enum import Enum

from app.models.employee import EmployeeRole


class TokenResponse(BaseModel):
    """Response model for authentication tokens"""
    access_token: str
    token_type: str = "bearer"
    user_id: int
    email: str
    role: EmployeeRole
    full_name: str
    client_id: Optional[int] = None


class LoginRequest(BaseModel):
    """Request model for user login"""
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=1, description="User password")


class SignupRequest(BaseModel):
    """Request model for user signup"""
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=6, description="Password (minimum 6 characters)")
    full_name: str = Field(..., min_length=1, description="User's full name")
    role: EmployeeRole = Field(..., description="User role")
    client_id: Optional[int] = Field(None, description="Client ID (required for non-admin roles)")

    @validator('client_id')
    def validate_client_id(cls, v, values):
        """Validate client_id based on role"""
        role = values.get('role')
        if role == EmployeeRole.DEW_ADMIN:
            # Dew Admin doesn't need client_id
            if v is not None:
                raise ValueError("Dew Admin should not have a client_id")
        else:
            # Other roles need client_id
            if v is None:
                raise ValueError("Client ID is required for this role")
        return v


class UserResponse(BaseModel):
    """Response model for user data"""
    id: int
    email: str
    full_name: str
    role: EmployeeRole
    client_id: Optional[int] = None
    is_active: bool = True
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True 