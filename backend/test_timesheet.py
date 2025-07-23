#!/usr/bin/env python3
"""
Test script to verify Timesheet model works correctly
"""

import os
import sys
from dotenv import load_dotenv
from datetime import date, datetime

# Load environment variables
load_dotenv()

# Add the app directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.core.database import engine, create_db_and_tables
from app.models import Client, Employee, EmployeeRole, Timesheet, TimesheetStatus
from sqlmodel import Session, select

def test_timesheet():
    """Test Timesheet model and relationships"""
    try:
        # Create tables
        create_db_and_tables()
        print("✅ Database tables created successfully!")
        
        # Test creating and querying data
        with Session(engine) as session:
            # Create a client
            client = Client(name="Microsoft Corp.")
            session.add(client)
            session.commit()
            session.refresh(client)
            print(f"✅ Created client: {client.name} (ID: {client.id})")
            
            # Create an employee
            employee = Employee(
                name="Jane Smith",
                email="jane.smith@dewsoftware.com",
                client_id=client.id,
                role=EmployeeRole.CONSULTANT
            )
            session.add(employee)
            session.commit()
            session.refresh(employee)
            print(f"✅ Created employee: {employee.name} (ID: {employee.id})")
            
            # Create a timesheet
            # Remove or update any test code that references hours_json, since the field no longer exists.
            # If you want to test timesheet creation, use the new model (no hours_json argument).
            # Example:
            # timesheet = Timesheet(
            #     employee_id=employee.id,
            #     week_start=date(2024, 1, 1),
            #     status=TimesheetStatus.PENDING,
            #     manager_email="manager@microsoft.com"
            # )
            # session.add(timesheet)
            # session.commit()
            # session.refresh(timesheet)
            # print(f"✅ Created timesheet: Week of {timesheet.week_start} (ID: {timesheet.id})")
            
            # Test hours_data property
            # parsed_hours = timesheet.hours_data
            # print(f"✅ Parsed hours data: {parsed_hours['Mon']}")
            
            # Test total hours calculation
            # totals = timesheet.get_total_hours()
            # print(f"✅ Total hours: Regular={totals['regular']}, Overtime={totals['overtime']}, Total={totals['total']}")
            
            # Test relationship query
            employee_with_timesheets = session.exec(
                select(Employee).where(Employee.id == employee.id)
            ).first()
            
            print(f"✅ Employee '{employee_with_timesheets.name}' has {len(employee_with_timesheets.timesheets_created)} timesheets created")
            
            # Test timesheet with employee
            timesheet_with_employee = session.exec(
                select(Timesheet).where(Timesheet.id == timesheet.id)
            ).first()
            
            print(f"✅ Timesheet belongs to '{timesheet_with_employee.employee.name}'")
            
            # Test status update
            timesheet.status = TimesheetStatus.APPROVED.value
            timesheet.approved_by = employee.id
            timesheet.approved_at = datetime.utcnow()
            timesheet.comment = "Approved - looks good"
            session.commit()
            print(f"✅ Updated timesheet status to: {timesheet.status}")
            
            # Clean up test data
            session.delete(timesheet)
            session.delete(employee)
            session.delete(client)
            session.commit()
            print("✅ Test data cleaned up")
            
        return True
        
    except Exception as e:
        print(f"❌ Timesheet test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("Testing Timesheet model...")
    test_timesheet() 