from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List, TYPE_CHECKING
from datetime import datetime, date, time

if TYPE_CHECKING:
    from .timesheet import Timesheet


class TimeEntry(SQLModel, table=True):
    """Individual time entry for a specific day"""
    
    id: Optional[int] = Field(default=None, primary_key=True)
    timesheet_id: int = Field(foreign_key="timesheet.id")
    date: date
    in_time: time
    out_time: time
    project: Optional[str] = Field(default=None, max_length=255)
    note: Optional[str] = Field(default=None, max_length=1000)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Use only string references in Relationship fields
    timesheet: Optional["Timesheet"] = Relationship(back_populates="time_entries")
    break_periods: List["BreakPeriod"] = Relationship(back_populates="time_entry", sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    
    def get_hours_worked(self) -> float:
        """Calculate hours worked minus breaks"""
        # Convert times to minutes for easier calculation
        start_minutes = self.in_time.hour * 60 + self.in_time.minute
        end_minutes = self.out_time.hour * 60 + self.out_time.minute
        
        total_minutes = end_minutes - start_minutes
        
        # Subtract break time
        for break_period in self.break_periods:
            break_start = break_period.start_time.hour * 60 + break_period.start_time.minute
            break_end = break_period.end_time.hour * 60 + break_period.end_time.minute
            total_minutes -= (break_end - break_start)
        
        return total_minutes / 60.0


class BreakPeriod(SQLModel, table=True):
    """Break period within a time entry"""
    
    id: Optional[int] = Field(default=None, primary_key=True)
    time_entry_id: int = Field(foreign_key="timeentry.id")
    start_time: time
    end_time: time
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Use only string reference in Relationship field
    time_entry: Optional["TimeEntry"] = Relationship(back_populates="break_periods") 