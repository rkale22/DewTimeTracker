from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import json
from fastapi.encoders import jsonable_encoder

from app.core.session import get_db
from app.models.timesheet import Timesheet, TimesheetStatus
from app.models.employee import Employee, EmployeeRole
from app.schemas.timesheet import TimesheetCreateRequest, TimesheetUpdateRequest, TimesheetResponse
from app.core.dependencies import get_current_user

# Remove prefix here; it will be added in the include_router call
router = APIRouter(tags=["timesheets"])

# List timesheets
@router.get("/", response_model=List[TimesheetResponse])
def list_timesheets(db: Session = Depends(get_db), current_user: Employee = Depends(get_current_user)):
    if current_user.role == EmployeeRole.DEW_ADMIN:
        timesheets = db.query(Timesheet).all()
    elif current_user.role == EmployeeRole.CLIENT_MANAGER:
        timesheets = db.query(Timesheet).join(Employee, Timesheet.employee_id == Employee.id).filter(Employee.client_id == current_user.client_id).all()
    elif current_user.role == EmployeeRole.CONSULTANT:
        timesheets = db.query(Timesheet).filter(Timesheet.employee_id == current_user.id).all()
    else:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    return [TimesheetResponse.from_orm(t) for t in timesheets]

# Get timesheet by ID
@router.get("/{timesheet_id}", response_model=TimesheetResponse)
def get_timesheet(timesheet_id: int, db: Session = Depends(get_db), current_user: Employee = Depends(get_current_user)):
    timesheet = db.query(Timesheet).filter(Timesheet.id == timesheet_id).first()
    if not timesheet:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Timesheet not found")
    if current_user.role == EmployeeRole.DEW_ADMIN:
        pass
    elif current_user.role == EmployeeRole.CLIENT_MANAGER:
        if timesheet.employee.client_id != current_user.client_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    elif current_user.role == EmployeeRole.CONSULTANT:
        if timesheet.employee_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    else:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    return TimesheetResponse.from_orm(timesheet)

# Create timesheet (clock-in)
@router.post("/", response_model=TimesheetResponse, status_code=status.HTTP_201_CREATED)
def create_timesheet(data: TimesheetCreateRequest, db: Session = Depends(get_db), current_user: Employee = Depends(get_current_user)):
    if current_user.role != EmployeeRole.CONSULTANT:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only consultants can create timesheets")
    entries_json = json.dumps(jsonable_encoder(data.entries))
    timesheet = Timesheet(
        employee_id=current_user.id,
        week_start=data.week_start,
        hours_json=entries_json,
        manager_email=data.manager_email,
        comment=data.comment,
        status=TimesheetStatus.PENDING,
        project=data.project
    )
    db.add(timesheet)
    db.commit()
    db.refresh(timesheet)
    return TimesheetResponse.from_orm(timesheet)

# Update timesheet
@router.put("/{timesheet_id}", response_model=TimesheetResponse)
def update_timesheet(timesheet_id: int, data: TimesheetUpdateRequest, db: Session = Depends(get_db), current_user: Employee = Depends(get_current_user)):
    timesheet = db.query(Timesheet).filter(Timesheet.id == timesheet_id).first()
    if not timesheet:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Timesheet not found")
    if current_user.role == EmployeeRole.DEW_ADMIN:
        pass
    elif current_user.role == EmployeeRole.CLIENT_MANAGER:
        if timesheet.employee.client_id != current_user.client_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    elif current_user.role == EmployeeRole.CONSULTANT:
        if timesheet.employee_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    else:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    if data.entries is not None:
        timesheet.hours_json = json.dumps(jsonable_encoder(data.entries))
    if data.comment is not None:
        timesheet.comment = data.comment
    if data.status is not None:
        timesheet.status = data.status
    if data.project is not None:
        timesheet.project = data.project
    timesheet.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(timesheet)
    return TimesheetResponse.from_orm(timesheet)

# Delete timesheet
@router.delete("/{timesheet_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_timesheet(timesheet_id: int, db: Session = Depends(get_db), current_user: Employee = Depends(get_current_user)):
    timesheet = db.query(Timesheet).filter(Timesheet.id == timesheet_id).first()
    if not timesheet:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Timesheet not found")
    if current_user.role == EmployeeRole.DEW_ADMIN:
        pass
    elif current_user.role == EmployeeRole.CLIENT_MANAGER:
        if timesheet.employee.client_id != current_user.client_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    elif current_user.role == EmployeeRole.CONSULTANT:
        if timesheet.employee_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    else:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    db.delete(timesheet)
    db.commit()
    return None

# Clock out (set end time)
@router.post("/{timesheet_id}/clock_out", response_model=TimesheetResponse)
def clock_out(timesheet_id: int, db: Session = Depends(get_db), current_user: Employee = Depends(get_current_user)):
    timesheet = db.query(Timesheet).filter(Timesheet.id == timesheet_id).first()
    if not timesheet:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Timesheet not found")
    if current_user.role != EmployeeRole.CONSULTANT or timesheet.employee_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    timesheet.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(timesheet)
    return TimesheetResponse.from_orm(timesheet)

# Approve timesheet
@router.post("/{timesheet_id}/approve", response_model=TimesheetResponse)
def approve_timesheet(timesheet_id: int, db: Session = Depends(get_db), current_user: Employee = Depends(get_current_user)):
    timesheet = db.query(Timesheet).filter(Timesheet.id == timesheet_id).first()
    if not timesheet:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Timesheet not found")
    if current_user.role != EmployeeRole.CLIENT_MANAGER:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only managers can approve timesheets")
    if timesheet.employee.client_id != current_user.client_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    timesheet.status = TimesheetStatus.APPROVED
    timesheet.approved_by = current_user.id
    timesheet.approved_at = datetime.utcnow()
    db.commit()
    db.refresh(timesheet)
    return TimesheetResponse.from_orm(timesheet) 