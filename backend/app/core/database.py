from sqlmodel import SQLModel, create_engine, Session
from app.config import settings

# Import all models to register them with SQLModel
from app.models import Client, Employee, Timesheet, AuditLog

# Create database engine
engine = create_engine(
    settings.database_url,
    echo=settings.debug,  # Print SQL queries in debug mode
    pool_pre_ping=True,   # Verify connections before use
    pool_recycle=300      # Recycle connections every 5 minutes
)

def create_db_and_tables():
    """Create all database tables"""
    SQLModel.metadata.create_all(engine)

def get_session():
    """Get database session"""
    with Session(engine) as session:
        yield session 