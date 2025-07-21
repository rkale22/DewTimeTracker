#!/usr/bin/env python3
"""
Setup test data for authentication system testing
Creates sample clients for testing client-based validation
"""

from sqlalchemy.orm import Session
from app.core.session import get_db
from app.models.client import Client
from app.models.employee import Employee, EmployeeRole
from app.utils.auth import get_password_hash


def setup_test_data():
    """Setup test clients and users"""
    db = next(get_db())
    
    try:
        print("🔧 Setting up test data...")
        
        # Create test clients
        clients = [
            {"name": "PayPal", "code": "paypal"},
            {"name": "Microsoft", "code": "microsoft"},
            {"name": "Meta", "code": "meta"}
        ]
        
        created_clients = []
        for client_data in clients:
            # Check if client already exists
            existing_client = db.query(Client).filter(
                Client.code == client_data["code"]
            ).first()
            
            if existing_client:
                print(f"✅ Client {client_data['name']} already exists")
                created_clients.append(existing_client)
            else:
                client = Client(
                    name=client_data["name"],
                    code=client_data["code"]
                )
                db.add(client)
                db.commit()
                db.refresh(client)
                created_clients.append(client)
                print(f"✅ Created client: {client.name} (ID: {client.id})")
        
        # Create test users (if they don't exist)
        test_users = [
            {
                "email": "john@paypal.com",
                "password": "password123",
                "full_name": "John Doe",
                "role": EmployeeRole.CONSULTANT,
                "client_id": created_clients[0].id  # PayPal
            },
            {
                "email": "manager@paypal.com", 
                "password": "password123",
                "full_name": "PayPal Manager",
                "role": EmployeeRole.CLIENT_MANAGER,
                "client_id": created_clients[0].id  # PayPal
            },
            {
                "email": "alice@microsoft.com",
                "password": "password123", 
                "full_name": "Alice Smith",
                "role": EmployeeRole.CONSULTANT,
                "client_id": created_clients[1].id  # Microsoft
            }
        ]
        
        for user_data in test_users:
            existing_user = db.query(Employee).filter(
                Employee.email == user_data["email"]
            ).first()
            
            if existing_user:
                print(f"✅ User {user_data['email']} already exists")
            else:
                hashed_password = get_password_hash(user_data["password"])
                user = Employee(
                    email=user_data["email"],
                    password_hash=hashed_password,
                    full_name=user_data["full_name"],
                    role=user_data["role"],
                    client_id=user_data["client_id"],
                    is_active=True
                )
                db.add(user)
                db.commit()
                db.refresh(user)
                print(f"✅ Created user: {user.email} ({user.role.value})")
        
        print("\n🎉 Test data setup complete!")
        print("\n📋 Available test clients:")
        for client in created_clients:
            print(f"  - {client.name} (ID: {client.id}, Code: {client.code})")
        
        print("\n👥 Available test users:")
        print("  - admin@dew.com / changeme (Dew Admin)")
        print("  - john@paypal.com / password123 (PayPal Consultant)")
        print("  - manager@paypal.com / password123 (PayPal Manager)")
        print("  - alice@microsoft.com / password123 (Microsoft Consultant)")
        
    except Exception as e:
        print(f"❌ Error setting up test data: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    setup_test_data() 