from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session, joinedload
from typing import List
from datetime import datetime

from app.core.session import get_db
from app.models.time_off import TimeOff, TimeOffStatus
from app.models.employee import Employee, EmployeeRole
from app.schemas.time_off import TimeOffCreateRequest, TimeOffUpdateRequest, TimeOffResponse
from app.core.dependencies import get_current_user
from app.utils.email import send_email

router = APIRouter(tags=["time_off"])

# List time off requests
@router.get("/", response_model=List[TimeOffResponse])
def list_time_off(
    employee_id: int = None,
    db: Session = Depends(get_db), 
    current_user: Employee = Depends(get_current_user)
):
    if current_user.role == EmployeeRole.DEW_ADMIN:
        query = db.query(TimeOff).options(
            joinedload(TimeOff.employee)
        )
        if employee_id:
            query = query.filter(TimeOff.employee_id == employee_id)
        requests = query.all()
        return [TimeOffResponse.from_orm(r) for r in requests]
    elif current_user.role == EmployeeRole.CLIENT_MANAGER:
        # Only requests submitted to this manager and pending
        query = db.query(TimeOff).options(
            joinedload(TimeOff.employee)
        ).filter(
            TimeOff.manager_email == current_user.email,
            TimeOff.status == TimeOffStatus.PENDING
        )
        if employee_id:
            query = query.filter(TimeOff.employee_id == employee_id)
        requests = query.all()
        return [TimeOffResponse.from_orm(r) for r in requests]
    elif current_user.role == EmployeeRole.CONSULTANT:
        query = db.query(TimeOff).options(
            joinedload(TimeOff.employee)
        ).filter(TimeOff.employee_id == current_user.id)
        if employee_id and employee_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view other employee time-off requests")
        requests = query.all()
        return [TimeOffResponse.from_orm(r) for r in requests]
    else:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

# Get time off request by ID
@router.get("/{request_id}", response_model=TimeOffResponse)
def get_time_off(request_id: int, db: Session = Depends(get_db), current_user: Employee = Depends(get_current_user)):
    req = db.query(TimeOff).filter(TimeOff.id == request_id).first()
    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    if current_user.role == EmployeeRole.CLIENT_MANAGER:
        if req.employee.client_id != current_user.client_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    elif current_user.role == EmployeeRole.CONSULTANT:
        if req.employee_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    else:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    return req

# Create time off request
@router.post("/", response_model=TimeOffResponse, status_code=status.HTTP_201_CREATED)
def create_time_off(data: TimeOffCreateRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user: Employee = Depends(get_current_user)):
    if current_user.role != EmployeeRole.CONSULTANT:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only consultants can request time off")
    req = TimeOff(
        employee_id=current_user.id,
        start_date=data.start_date,
        end_date=data.end_date,
        type=data.type,
        comment=data.comment,
        manager_email=data.manager_email,
        status=TimeOffStatus.PENDING
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    # Email notification to manager
    subject = f"Time Off Request Submitted: {current_user.full_name} ({data.start_date} to {data.end_date})"
    body = f"Hello,\n\nA new time off request has been submitted for your approval.\n\nEmployee: {current_user.full_name}\nDates: {data.start_date} to {data.end_date}\nType: {data.type}\n\nPlease log in to review and approve.\n\n-- Dew Time Tracker"
    background_tasks.add_task(send_email, subject, body, [data.manager_email])
    return req

# Update time off request
@router.put("/{request_id}", response_model=TimeOffResponse)
def update_time_off(request_id: int, data: TimeOffUpdateRequest, db: Session = Depends(get_db), current_user: Employee = Depends(get_current_user)):
    req = db.query(TimeOff).filter(TimeOff.id == request_id).first()
    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    if current_user.role != EmployeeRole.CONSULTANT or req.employee_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    if req.status != TimeOffStatus.PENDING:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only pending requests can be updated")
    if data.start_date is not None:
        req.start_date = data.start_date
    if data.end_date is not None:
        req.end_date = data.end_date
    if data.type is not None:
        req.type = data.type
    if data.comment is not None:
        req.comment = data.comment
    req.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(req)
    return req

# Delete time off request
@router.delete("/{request_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_time_off(request_id: int, db: Session = Depends(get_db), current_user: Employee = Depends(get_current_user)):
    req = db.query(TimeOff).filter(TimeOff.id == request_id).first()
    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    if current_user.role != EmployeeRole.CONSULTANT or req.employee_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    if req.status != TimeOffStatus.PENDING:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only pending requests can be deleted")
    db.delete(req)
    db.commit()
    return None

# Approve time off request
@router.post("/{request_id}/approve", response_model=TimeOffResponse)
def approve_time_off(request_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user: Employee = Depends(get_current_user)):
    req = db.query(TimeOff).filter(TimeOff.id == request_id).first()
    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    if current_user.role != EmployeeRole.CLIENT_MANAGER:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only managers can approve requests")
    if req.manager_email != current_user.email:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    if req.status != TimeOffStatus.PENDING:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only pending requests can be approved")
    req.status = TimeOffStatus.APPROVED
    req.approved_by = current_user.id
    req.approved_at = datetime.utcnow()
    req.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(req)
    # Email notification to employee
    subject = f"Your Time Off Request Was Approved ({req.start_date} to {req.end_date})"
    body = f"Hello {req.employee.full_name},\n\nYour time off request for {req.start_date} to {req.end_date} has been approved.\n\n-- Dew Time Tracker"
    background_tasks.add_task(send_email, subject, body, [req.employee.email])
    return req

# Reject time off request
@router.post("/{request_id}/reject", response_model=TimeOffResponse)
def reject_time_off(request_id: int, data: TimeOffUpdateRequest, db: Session = Depends(get_db), current_user: Employee = Depends(get_current_user)):
    req = db.query(TimeOff).filter(TimeOff.id == request_id).first()
    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    if current_user.role != EmployeeRole.CLIENT_MANAGER:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only managers can reject requests")
    if req.manager_email != current_user.email:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    if req.status != TimeOffStatus.PENDING:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only pending requests can be rejected")
    req.status = TimeOffStatus.REJECTED
    req.manager_comment = data.manager_comment
    req.approved_by = current_user.id
    req.approved_at = datetime.utcnow()
    req.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(req)
    return req 