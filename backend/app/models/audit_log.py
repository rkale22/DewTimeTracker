from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum
import json


class AuditEventType(str, Enum):
    """Audit event type enumeration"""
    # Timesheet events
    TIMESHEET_CREATED = "timesheet_created"
    TIMESHEET_UPDATED = "timesheet_updated"
    TIMESHEET_SUBMITTED = "timesheet_submitted"
    TIMESHEET_APPROVED = "timesheet_approved"
    TIMESHEET_REJECTED = "timesheet_rejected"
    
    # Employee events
    EMPLOYEE_CREATED = "employee_created"
    EMPLOYEE_UPDATED = "employee_updated"
    EMPLOYEE_DELETED = "employee_deleted"
    
    # Client events
    CLIENT_CREATED = "client_created"
    CLIENT_UPDATED = "client_updated"
    CLIENT_DELETED = "client_deleted"
    
    # Authentication events
    USER_LOGIN = "user_login"
    USER_LOGOUT = "user_logout"
    PASSWORD_CHANGED = "password_changed"
    
    # System events
    SYSTEM_ERROR = "system_error"
    DATA_EXPORT = "data_export"
    BULK_OPERATION = "bulk_operation"


class AuditLog(SQLModel, table=True):
    """AuditLog model for tracking all system activities"""
    
    id: Optional[int] = Field(default=None, primary_key=True)
    timesheet_id: Optional[int] = Field(default=None, foreign_key="timesheet.id", description="Related timesheet if applicable")
    event: AuditEventType = Field(description="Type of event that occurred")
    actor_id: Optional[int] = Field(default=None, foreign_key="employee.id", description="Employee who performed the action")
    actor_email: str = Field(max_length=255, description="Email of the actor (for external users)")
    actor_role: str = Field(max_length=50, description="Role of the actor at time of event")
    details: Optional[str] = Field(default=None, max_length=2000, description="Additional details about the event")
    ip_address: Optional[str] = Field(default=None, max_length=45, description="IP address of the actor")
    user_agent: Optional[str] = Field(default=None, max_length=500, description="User agent string")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="When the event occurred")
    
    # Relationships
    timesheet: Optional["Timesheet"] = Relationship(back_populates="audit_logs")
    actor: Optional["Employee"] = Relationship(back_populates="audit_logs")
    
    @property
    def details_data(self) -> Dict[str, Any]:
        """Parse details JSON and return as dictionary"""
        if not self.details:
            return {}
        try:
            return json.loads(self.details)
        except (json.JSONDecodeError, TypeError):
            return {"raw_details": self.details}
    
    @details_data.setter
    def details_data(self, value: Dict[str, Any]):
        """Set details from dictionary"""
        self.details = json.dumps(value)
    
    def add_detail(self, key: str, value: Any):
        """Add a detail to the existing details"""
        current_details = self.details_data
        current_details[key] = value
        self.details_data = current_details
    
    class Config:
        schema_extra = {
            "example": {
                "timesheet_id": 1,
                "event": "timesheet_approved",
                "actor_id": 2,
                "actor_email": "manager@client.com",
                "actor_role": "client_manager",
                "details": '{"comment": "Approved - looks good", "previous_status": "pending"}',
                "ip_address": "192.168.1.100",
                "user_agent": "Mozilla/5.0...",
                "timestamp": "2024-01-01T12:00:00"
            }
        } 