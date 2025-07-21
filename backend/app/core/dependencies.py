from typing import Optional
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.session import get_db
from app.utils.auth import get_current_user_dependency
from app.models.employee import Employee, EmployeeRole


def get_current_active_user(
    current_user: Employee = Depends(get_current_user_dependency)
) -> Employee:
    """
    Dependency to get current active user
    
    **Logic:**
    1. Extract user from JWT token
    2. Check if user is active
    3. Return user or raise 401 error
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Inactive user"
        )
    return current_user


def require_role(required_role: EmployeeRole):
    """
    Dependency factory to require specific role
    
    **Logic:**
    1. Creates a dependency that checks user role
    2. Compares user role with required role
    3. Raises 403 if role doesn't match
    """
    def role_checker(
        current_user: Employee = Depends(get_current_active_user)
    ) -> Employee:
        if current_user.role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role {required_role.value} required"
            )
        return current_user
    return role_checker


def require_roles(required_roles: list[EmployeeRole]):
    """
    Dependency factory to require one of multiple roles
    
    **Logic:**
    1. Creates a dependency that checks user role
    2. Compares user role with any of the required roles
    3. Raises 403 if role doesn't match any required role
    """
    def role_checker(
        current_user: Employee = Depends(get_current_active_user)
    ) -> Employee:
        if current_user.role not in required_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"One of roles {[r.value for r in required_roles]} required"
            )
        return current_user
    return role_checker


def require_dew_admin(
    current_user: Employee = Depends(get_current_active_user)
) -> Employee:
    """
    Dependency to require Dew Admin role
    
    **Logic:**
    1. Checks if user is Dew Admin
    2. Dew Admin has access to everything
    """
    if current_user.role != EmployeeRole.DEW_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Dew Admin access required"
        )
    return current_user


def require_client_manager_or_admin(
    current_user: Employee = Depends(get_current_active_user)
) -> Employee:
    """
    Dependency to require Client Manager or Dew Admin role
    
    **Logic:**
    1. Checks if user is Client Manager or Dew Admin
    2. These roles can approve timesheets
    """
    if current_user.role not in [EmployeeRole.CLIENT_MANAGER, EmployeeRole.DEW_ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Client Manager or Dew Admin access required"
        )
    return current_user


def get_user_with_client_access(
    current_user: Employee = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Employee:
    """
    Dependency to get user with client-based access validation
    
    **Logic:**
    1. For Dew Admin: no client restriction (access to all)
    2. For others: ensures user has client_id
    3. Used for client-specific operations
    """
    if current_user.role != EmployeeRole.DEW_ADMIN and current_user.client_id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User must be assigned to a client"
        )
    return current_user


# Convenience functions for common role requirements
require_consultant = require_role(EmployeeRole.CONSULTANT)
require_client_manager = require_role(EmployeeRole.CLIENT_MANAGER)
require_dew_admin_role = require_role(EmployeeRole.DEW_ADMIN)

get_current_user = get_current_user_dependency 