#!/usr/bin/env python3
"""
Test script to verify Client and Employee models work correctly
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add the app directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.core.database import engine, create_db_and_tables
from app.models import Client, Employee, EmployeeRole
from sqlmodel import Session, select

def test_models():
    """Test Client and Employee models"""
    try:
        # Create tables
        create_db_and_tables()
        print("✅ Database tables created successfully!")
        
        # Test creating and querying data
        with Session(engine) as session:
            # Create a client
            client = Client(name="Google Inc.")
            session.add(client)
            session.commit()
            session.refresh(client)
            print(f"✅ Created client: {client.name} (ID: {client.id})")
            
            # Create an employee
            employee = Employee(
                name="John Doe",
                email="john.doe@dewsoftware.com",
                client_id=client.id,
                role=EmployeeRole.CONSULTANT
            )
            session.add(employee)
            session.commit()
            session.refresh(employee)
            print(f"✅ Created employee: {employee.name} (ID: {employee.id})")
            
            # Test relationship query
            client_with_employees = session.exec(
                select(Client).where(Client.id == client.id)
            ).first()
            
            print(f"✅ Client '{client_with_employees.name}' has {len(client_with_employees.employees)} employees")
            
            # Test employee query with client
            employee_with_client = session.exec(
                select(Employee).where(Employee.id == employee.id)
            ).first()
            
            print(f"✅ Employee '{employee_with_client.name}' works for '{employee_with_client.client.name}'")
            
            # Clean up test data
            session.delete(employee)
            session.delete(client)
            session.commit()
            print("✅ Test data cleaned up")
            
        return True
        
    except Exception as e:
        print(f"❌ Model test failed: {e}")
        return False

if __name__ == "__main__":
    print("Testing Client and Employee models...")
    test_models() 