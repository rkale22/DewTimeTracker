from typing import List, Optional
from sqlalchemy.orm import Session, Query
from sqlalchemy import and_

from app.models.employee import Employee, EmployeeRole
from app.models.timesheet import Timesheet
from app.models.client import Client


def filter_by_client_access(query: Query, user: Employee) -> Query:
    """
    Filter query results based on user's client access
    
    **Logic:**
    1. Dew Admin: no filtering (sees all data)
    2. Others: only see data from their client
    3. Applied to any query that has client_id
    """
    if user.role == EmployeeRole.DEW_ADMIN:
        return query  # No filtering for Dew Admin
    else:
        return query.filter(query.table.client_id == user.client_id)


def get_accessible_timesheets(db: Session, user: Employee) -> List[Timesheet]:
    """
    Get timesheets accessible to the user
    
    **Logic:**
    1. Dew Admin: all timesheets
    2. Client Manager: timesheets from their client
    3. Consultant: their own timesheets from their client
    """
    query = db.query(Timesheet)
    
    if user.role == EmployeeRole.DEW_ADMIN:
        # Dew Admin sees all timesheets
        return query.all()
    
    elif user.role == EmployeeRole.CLIENT_MANAGER:
        # Client Manager sees timesheets from their client
        return query.filter(Timesheet.client_id == user.client_id).all()
    
    else:  # Consultant
        # Consultant sees only their own timesheets
        return query.filter(
            and_(
                Timesheet.employee_id == user.id,
                Timesheet.client_id == user.client_id
            )
        ).all()


def can_approve_timesheet(user: Employee, timesheet: Timesheet) -> bool:
    """
    Check if user can approve a specific timesheet
    
    **Logic:**
    1. Dew Admin: can approve any timesheet
    2. Client Manager: can only approve timesheets from their client
    3. Consultant: cannot approve timesheets
    """
    if user.role == EmployeeRole.DEW_ADMIN:
        return True
    
    elif user.role == EmployeeRole.CLIENT_MANAGER:
        return timesheet.client_id == user.client_id
    
    else:  # Consultant
        return False


def can_view_timesheet(user: Employee, timesheet: Timesheet) -> bool:
    """
    Check if user can view a specific timesheet
    
    **Logic:**
    1. Dew Admin: can view any timesheet
    2. Client Manager: can view timesheets from their client
    3. Consultant: can only view their own timesheets
    """
    if user.role == EmployeeRole.DEW_ADMIN:
        return True
    
    elif user.role == EmployeeRole.CLIENT_MANAGER:
        return timesheet.client_id == user.client_id
    
    else:  # Consultant
        return timesheet.employee_id == user.id and timesheet.client_id == user.client_id


def get_accessible_employees(db: Session, user: Employee) -> List[Employee]:
    """
    Get employees accessible to the user
    
    **Logic:**
    1. Dew Admin: all employees
    2. Client Manager: employees from their client
    3. Consultant: only themselves
    """
    query = db.query(Employee)
    
    if user.role == EmployeeRole.DEW_ADMIN:
        return query.all()
    
    elif user.role == EmployeeRole.CLIENT_MANAGER:
        return query.filter(Employee.client_id == user.client_id).all()
    
    else:  # Consultant
        return query.filter(Employee.id == user.id).all()


def get_accessible_clients(db: Session, user: Employee) -> List[Client]:
    """
    Get clients accessible to the user
    
    **Logic:**
    1. Dew Admin: all clients
    2. Others: only their assigned client
    """
    query = db.query(Client)
    
    if user.role == EmployeeRole.DEW_ADMIN:
        return query.all()
    else:
        return query.filter(Client.id == user.client_id).all()


def validate_client_access(user: Employee, client_id: Optional[int]) -> bool:
    """
    Validate if user has access to a specific client
    
    **Logic:**
    1. Dew Admin: access to any client (including None)
    2. Others: only access to their assigned client
    """
    if user.role == EmployeeRole.DEW_ADMIN:
        return True
    else:
        return user.client_id == client_id 