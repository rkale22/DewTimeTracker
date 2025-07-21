from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.session import get_db
from app.schemas.auth import LoginRequest, SignupRequest, TokenResponse, UserResponse
from app.utils.auth import (
    authenticate_user,
    create_access_token,
    get_password_hash,
    get_current_user
)
from app.models.employee import Employee, EmployeeRole
from app.models.client import Client
from app.config import settings

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate user and return JWT token
    
    **Logic:**
    1. Validate email/password format
    2. Check if user exists in database
    3. Verify password hash matches
    4. Generate JWT token with user info
    5. Return token with user details
    """
    # Authenticate user
    user = authenticate_user(db, login_data.email, login_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is disabled"
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=access_token_expires
    )
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user_id=user.id,
        email=user.email,
        role=user.role,
        full_name=user.full_name,
        client_id=user.client_id
    )


@router.post("/signup", response_model=TokenResponse)
def signup(signup_data: SignupRequest, db: Session = Depends(get_db)):
    """
    Register new user and return JWT token
    
    **Logic:**
    1. Validate signup data (email, password, role, client_id)
    2. Check if email already exists
    3. Validate client_id exists (for non-admin roles)
    4. Hash password securely
    5. Create user in database
    6. Generate JWT token
    7. Return token with user details
    """
    # Check if email already exists
    existing_user = db.query(Employee).filter(Employee.email == signup_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Validate client_id for non-admin roles
    if signup_data.role != EmployeeRole.DEW_ADMIN:
        if signup_data.client_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Client ID is required for non-admin roles"
            )
        # Validate client exists
        client = db.query(Client).filter(Client.id == signup_data.client_id).first()
        if not client:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid client ID"
            )
    
    # Create new user
    hashed_password = get_password_hash(signup_data.password)
    db_user = Employee(
        email=signup_data.email,
        password_hash=hashed_password,
        full_name=signup_data.full_name,
        role=signup_data.role,
        client_id=signup_data.client_id,
        is_active=True
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": str(db_user.id)},
        expires_delta=access_token_expires
    )
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user_id=db_user.id,
        email=db_user.email,
        role=db_user.role,
        full_name=db_user.full_name,
        client_id=db_user.client_id
    )


@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: Employee = Depends(get_current_user)):
    """
    Get current user information
    
    **Logic:**
    1. Extract user from JWT token (handled by dependency)
    2. Return user information
    3. Used for frontend to get current user details
    """
    return current_user 