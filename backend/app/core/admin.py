from sqlalchemy.orm import Session
from app.core.session import get_db
from app.models.employee import Employee, EmployeeRole
from app.utils.auth import get_password_hash


def create_seeded_admin(db: Session) -> Employee:
    """
    Create the seeded Dew Admin user if it doesn't exist
    
    **Logic:**
    1. Check if any Dew Admin exists
    2. If not, create admin@dew.com with default password
    3. This ensures there's always an admin to manage the system
    4. Only runs on first startup
    """
    # Check if Dew Admin already exists
    existing_admin = db.query(Employee).filter(
        Employee.role == EmployeeRole.DEW_ADMIN
    ).first()
    
    if existing_admin:
        return existing_admin
    
    # Create seeded admin
    admin_password = "changeme"  # Default password - should be changed immediately
    hashed_password = get_password_hash(admin_password)
    
    seeded_admin = Employee(
        email="admin@dew.com",
        password_hash=hashed_password,
        full_name="Dew Admin",
        role=EmployeeRole.DEW_ADMIN,
        client_id=None,  # Dew Admin has no client (access to all)
        is_active=True
    )
    
    db.add(seeded_admin)
    db.commit()
    db.refresh(seeded_admin)
    
    print("✅ Seeded Dew Admin created: admin@dew.com / changeme")
    print("⚠️  IMPORTANT: Change the default password immediately!")
    
    return seeded_admin


def ensure_seeded_admin():
    """
    Ensure seeded admin exists - called during startup
    """
    db = next(get_db())
    try:
        create_seeded_admin(db)
    finally:
        db.close() 