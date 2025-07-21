from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ClientCreateRequest(BaseModel):
    name: str = Field(..., max_length=255, description="Company name")
    code: str = Field(..., max_length=50, description="Client code (unique, e.g., 'paypal')")

class ClientUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, max_length=255, description="Company name")
    code: Optional[str] = Field(None, max_length=50, description="Client code (unique, e.g., 'paypal')")

class ClientResponse(BaseModel):
    id: int
    name: str
    code: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True 