from typing import Generator
from sqlmodel import Session
from app.core.database import engine

def get_db() -> Generator[Session, None, None]:
    """
    Dependency to get database session.
    This will be used in FastAPI route dependencies.
    """
    with Session(engine) as session:
        try:
            yield session
        finally:
            session.close()

# Alias for backward compatibility
get_db_session = get_db 