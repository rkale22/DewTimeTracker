from sqlmodel import SQLModel, Field, Relationship
from typing import List, Optional
from datetime import datetime
from enum import Enum


class EmployeeRole(str, Enum):
    """Employee role enumeration"""
    CONSULTANT = "consultant"
    CLIENT_MANAGER = "client_manager"
    DEW_ADMIN = "dew_admin"


class Employee(SQLModel, table=True):
    """Employee model representing consultants and managers"""
    
    id: Optional[int] = Field(default=None, primary_key=True)
    full_name: str = Field(max_length=255, description="Employee full name")
    email: str = Field(max_length=255, unique=True, description="Employee email address")
    password_hash: str = Field(description="Hashed password")
    client_id: Optional[int] = Field(default=None, foreign_key="client.id", description="Associated client")
    role: EmployeeRole = Field(default=EmployeeRole.CONSULTANT, description="Employee role")
    is_active: bool = Field(default=True, description="Whether the account is active")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    client: Optional["Client"] = Relationship(back_populates="employees")
    timesheets_created: List["Timesheet"] = Relationship(
        back_populates="employee",
        sa_relationship_kwargs={"foreign_keys": "[Timesheet.employee_id]"}
    )
    timesheets_approved: List["Timesheet"] = Relationship(
        back_populates="approver",
        sa_relationship_kwargs={"foreign_keys": "[Timesheet.approved_by]"}
    )
    audit_logs: List["AuditLog"] = Relationship(back_populates="actor")
    
    class Config:
        schema_extra = {
            "example": {
                "full_name": "John Doe",
                "email": "john.doe@dewsoftware.com",
                "password_hash": "hashed_password_here",
                "client_id": 1,
                "role": "consultant",
                "is_active": True,
                "created_at": "2024-01-01T00:00:00",
                "updated_at": "2024-01-01T00:00:00"
            }
        } 