from sqlmodel import SQLModel, Field, Relationship
from typing import List, Optional
from datetime import datetime


class Client(SQLModel, table=True):
    """Client model representing companies that DEW Software works with"""
    
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=255, description="Company name")
    code: str = Field(max_length=50, unique=True, description="Client code (e.g., 'paypal', 'microsoft')")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    employees: List["Employee"] = Relationship(back_populates="client")
    
    class Config:
        schema_extra = {
            "example": {
                "name": "Google Inc.",
                "code": "google",
                "created_at": "2024-01-01T00:00:00",
                "updated_at": "2024-01-01T00:00:00"
            }
        } 