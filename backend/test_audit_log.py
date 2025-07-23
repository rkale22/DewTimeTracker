#!/usr/bin/env python3
"""
Test script to verify AuditLog model and audit trail system
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
from app.models import Client, Employee, EmployeeRole, Timesheet, TimesheetStatus, AuditLog, AuditEventType
from sqlmodel import Session, select

def test_audit_log():
    """Test AuditLog model and audit trail system"""
    try:
        # Create tables
        create_db_and_tables()
        print("✅ Database tables created successfully!")
        
        # Test creating and querying data
        with Session(engine) as session:
            # Create a client
            client = Client(name="Apple Inc.")
            session.add(client)
            session.commit()
            session.refresh(client)
            print(f"✅ Created client: {client.name} (ID: {client.id})")
            
            # Create an employee
            employee = Employee(
                name="Bob Johnson",
                email="bob.johnson@dewsoftware.com",
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
            
            # Create audit log for timesheet creation
            audit_log_created = AuditLog(
                timesheet_id=timesheet.id,
                event=AuditEventType.TIMESHEET_CREATED,
                actor_id=employee.id,
                actor_email=employee.email,
                actor_role=employee.role.value,
                details='{"total_hours": 40, "overtime_hours": 1}',
                ip_address="192.168.1.100",
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            )
            session.add(audit_log_created)
            session.commit()
            print(f"✅ Created audit log: {audit_log_created.event}")
            
            # Test details_data property
            details = audit_log_created.details_data
            print(f"✅ Parsed audit details: {details}")
            
            # Test add_detail method
            audit_log_created.add_detail("browser", "Chrome")
            audit_log_created.add_detail("action", "manual_entry")
            session.commit()
            print(f"✅ Added details to audit log")
            
            # Update timesheet status
            timesheet.status = TimesheetStatus.APPROVED
            timesheet.approved_by = employee.id
            timesheet.approved_at = datetime.utcnow()
            timesheet.comment = "Self-approved for testing"
            session.commit()
            
            # Create audit log for approval
            audit_log_approved = AuditLog(
                timesheet_id=timesheet.id,
                event=AuditEventType.TIMESHEET_APPROVED,
                actor_id=employee.id,
                actor_email=employee.email,
                actor_role=employee.role.value,
                details='{"previous_status": "pending", "comment": "Self-approved for testing"}',
                ip_address="192.168.1.100",
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            )
            session.add(audit_log_approved)
            session.commit()
            print(f"✅ Created approval audit log: {audit_log_approved.event}")
            
            # Test relationship queries
            timesheet_with_audit = session.exec(
                select(Timesheet).where(Timesheet.id == timesheet.id)
            ).first()
            
            print(f"✅ Timesheet has {len(timesheet_with_audit.audit_logs)} audit logs")
            
            # Test employee audit logs
            employee_with_audit = session.exec(
                select(Employee).where(Employee.id == employee.id)
            ).first()
            
            print(f"✅ Employee has {len(employee_with_audit.audit_logs)} audit logs")
            
            # Test audit log queries
            all_audit_logs = session.exec(
                select(AuditLog).order_by(AuditLog.timestamp)
            ).all()
            
            print(f"✅ Total audit logs in system: {len(all_audit_logs)}")
            
            # Test filtering by event type
            timesheet_events = session.exec(
                select(AuditLog).where(AuditLog.event.in_([
                    AuditEventType.TIMESHEET_CREATED,
                    AuditEventType.TIMESHEET_APPROVED
                ]))
            ).all()
            
            print(f"✅ Timesheet-related audit events: {len(timesheet_events)}")
            
            # Clean up test data
            session.delete(audit_log_approved)
            session.delete(audit_log_created)
            session.delete(timesheet)
            session.delete(employee)
            session.delete(client)
            session.commit()
            print("✅ Test data cleaned up")
            
        return True
        
    except Exception as e:
        print(f"❌ Audit log test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("Testing AuditLog model and audit trail system...")
    test_audit_log() 