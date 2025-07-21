from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.session import get_db
from app.core.dependencies import (
    get_current_active_user,
    require_dew_admin,
    require_client_manager_or_admin,
    require_consultant
)
from app.utils.access_control import (
    get_accessible_timesheets,
    get_accessible_employees,
    get_accessible_clients
)
from app.models.employee import Employee

router = APIRouter()


@router.get("/protected")
def protected_route(current_user: Employee = Depends(get_current_active_user)):
    """
    Test protected route - requires authentication
    
    **Logic:**
    1. Requires valid JWT token
    2. User must be active
    3. Returns user info
    """
    return {
        "message": "This is a protected route",
        "user": {
            "id": current_user.id,
            "email": current_user.email,
            "role": current_user.role.value,
            "client_id": current_user.client_id
        }
    }


@router.get("/admin-only")
def admin_only_route(current_user: Employee = Depends(require_dew_admin)):
    """
    Test admin-only route
    
    **Logic:**
    1. Requires Dew Admin role
    2. Only Dew Admin can access
    """
    return {
        "message": "This is admin-only content",
        "user": current_user.email
    }


@router.get("/manager-or-admin")
def manager_or_admin_route(
    current_user: Employee = Depends(require_client_manager_or_admin)
):
    """
    Test route for Client Manager or Dew Admin
    
    **Logic:**
    1. Requires Client Manager or Dew Admin role
    2. Used for approval workflows
    """
    return {
        "message": "This is manager/admin content",
        "user": current_user.email,
        "role": current_user.role.value
    }


@router.get("/consultant-only")
def consultant_only_route(current_user: Employee = Depends(require_consultant)):
    """
    Test route for Consultants only
    
    **Logic:**
    1. Requires Consultant role
    2. Only Consultants can access
    """
    return {
        "message": "This is consultant-only content",
        "user": current_user.email
    }


@router.get("/my-data")
def my_data_route(
    current_user: Employee = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Test route showing user's accessible data
    
    **Logic:**
    1. Shows data based on user's role and client
    2. Demonstrates access control in action
    """
    # Get accessible data based on role
    timesheets = get_accessible_timesheets(db, current_user)
    employees = get_accessible_employees(db, current_user)
    clients = get_accessible_clients(db, current_user)
    
    return {
        "message": "Your accessible data",
        "user": {
            "id": current_user.id,
            "email": current_user.email,
            "role": current_user.role.value,
            "client_id": current_user.client_id
        },
        "accessible_data": {
            "timesheets_count": len(timesheets),
            "employees_count": len(employees),
            "clients_count": len(clients)
        }
    } 