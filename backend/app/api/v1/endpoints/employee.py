from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List

from app.core.session import get_db
from app.models.employee import Employee, EmployeeRole
from app.models.client import Client
from app.schemas.employee import EmployeeUpdateRequest, EmployeeResponse, EmployeeCreateRequest
from app.schemas.auth import UserResponse
from app.core.dependencies import get_current_user
from app.utils.auth import get_password_hash

router = APIRouter(tags=["employees"])

# Create new employee
@router.post("/", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
def create_employee(employee_data: EmployeeCreateRequest, db: Session = Depends(get_db), current_user: Employee = Depends(get_current_user)):
    """Create a new employee (admin only)"""
    # Only DEW_ADMIN can create employees
    if current_user.role != EmployeeRole.DEW_ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only Dew Admin can create employees")
    
    # Check if email already exists
    existing_employee = db.query(Employee).filter(Employee.email == employee_data.email).first()
    if existing_employee:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    
    # Validate client exists if client_id is provided
    if employee_data.client_id:
        client = db.query(Client).filter(Client.id == employee_data.client_id).first()
        if not client:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid client ID")
    
    # Hash password
    hashed_password = get_password_hash(employee_data.password)
    
    # Create new employee
    new_employee = Employee(
        full_name=employee_data.full_name,
        email=employee_data.email,
        password_hash=hashed_password,
        role=employee_data.role,
        client_id=employee_data.client_id,
        is_active=employee_data.is_active
    )
    
    db.add(new_employee)
    db.commit()
    db.refresh(new_employee)
    
    # Return employee with client details
    return db.query(Employee).options(joinedload(Employee.client)).filter(Employee.id == new_employee.id).first()

# List employees
@router.get("/", response_model=List[EmployeeResponse])
def list_employees(db: Session = Depends(get_db), current_user: Employee = Depends(get_current_user)):
    if current_user.role == EmployeeRole.DEW_ADMIN:
        employees = db.query(Employee).options(joinedload(Employee.client)).all()
    elif current_user.role == EmployeeRole.CLIENT_MANAGER:
        employees = db.query(Employee).filter(Employee.client_id == current_user.client_id).options(joinedload(Employee.client)).all()
    else:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    return employees

# Get employee by ID
@router.get("/{employee_id}", response_model=EmployeeResponse)
def get_employee(employee_id: int, db: Session = Depends(get_db), current_user: Employee = Depends(get_current_user)):
    employee = db.query(Employee).options(joinedload(Employee.client)).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    if current_user.role == EmployeeRole.DEW_ADMIN:
        return employee
    elif current_user.role == EmployeeRole.CLIENT_MANAGER:
        if employee.client_id != current_user.client_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
        return employee
    else:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

# Update employee
@router.put("/{employee_id}", response_model=EmployeeResponse)
def update_employee(employee_id: int, update_data: EmployeeUpdateRequest, db: Session = Depends(get_db), current_user: Employee = Depends(get_current_user)):
    employee = db.query(Employee).options(joinedload(Employee.client)).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    # Access control
    if current_user.role == EmployeeRole.CLIENT_MANAGER:
        if employee.client_id != current_user.client_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
        if update_data.role == EmployeeRole.DEW_ADMIN:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot promote to Dew Admin")
        if update_data.client_id and update_data.client_id != current_user.client_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot assign to another client")
    elif current_user.role != EmployeeRole.DEW_ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    # Role/client_id validation
    if update_data.role == EmployeeRole.DEW_ADMIN and update_data.client_id is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Dew Admin should not have a client_id")
    if update_data.role in [EmployeeRole.CONSULTANT, EmployeeRole.CLIENT_MANAGER] and not update_data.client_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Client ID required for this role")
    # Apply updates
    for field, value in update_data.dict(exclude_unset=True).items():
        setattr(employee, field, value)
    db.commit()
    db.refresh(employee)
    return employee

# Delete employee
@router.delete("/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_employee(employee_id: int, db: Session = Depends(get_db), current_user: Employee = Depends(get_current_user)):
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    if current_user.role == EmployeeRole.DEW_ADMIN:
        pass
    elif current_user.role == EmployeeRole.CLIENT_MANAGER:
        if employee.client_id != current_user.client_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    else:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    db.delete(employee)
    db.commit()
    return None 