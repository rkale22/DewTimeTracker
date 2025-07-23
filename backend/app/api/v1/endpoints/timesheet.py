from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session, joinedload
from typing import List
from datetime import datetime
import json
from fastapi.encoders import jsonable_encoder
from fastapi import Path

from app.core.session import get_db
from app.models.timesheet import Timesheet, TimesheetStatus
from app.models.employee import Employee, EmployeeRole
from app.schemas.timesheet import TimesheetCreateRequest, TimesheetResponse
from app.core.dependencies import get_current_user
from app.models.time_entry import TimeEntry, BreakPeriod
from app.schemas.timesheet import TimeEntryCreate, TimeEntryResponse, BreakPeriodCreate
from app.utils.email import send_email

# Remove prefix here; it will be added in the include_router call
router = APIRouter(tags=["timesheets"])

# List timesheets
@router.get("/", response_model=List[TimesheetResponse])
def list_timesheets(db: Session = Depends(get_db), current_user: Employee = Depends(get_current_user)):
    print(f"🔍 DEBUG: User {current_user.email} (ID: {current_user.id}) with role {current_user.role.value} requesting timesheets")
    print(f"🔍 DEBUG: User client_id: {current_user.client_id}")
    
    if current_user.role == EmployeeRole.DEW_ADMIN:
        timesheets = db.query(Timesheet).options(
            joinedload(Timesheet.employee),
            joinedload(Timesheet.time_entries).joinedload(TimeEntry.break_periods)
        ).all()
        print(f"🔍 DEBUG: DEW_ADMIN - Found {len(timesheets)} timesheets")
    elif current_user.role == EmployeeRole.CLIENT_MANAGER:
        # Managers only see timesheets submitted to them for approval
        timesheets = db.query(Timesheet).join(Employee, Timesheet.employee_id == Employee.id).filter(
            Timesheet.status == TimesheetStatus.SUBMITTED.value,
            Timesheet.manager_email == current_user.email
        ).options(
            joinedload(Timesheet.employee),
            joinedload(Timesheet.time_entries).joinedload(TimeEntry.break_periods)
        ).all()
        print(f"🔍 DEBUG: CLIENT_MANAGER - Found {len(timesheets)} submitted timesheets for manager_email {current_user.email}")
    elif current_user.role == EmployeeRole.CONSULTANT:
        timesheets = db.query(Timesheet).filter(
            Timesheet.employee_id == current_user.id
        ).options(
            joinedload(Timesheet.employee),
            joinedload(Timesheet.time_entries).joinedload(TimeEntry.break_periods)
        ).all()
        print(f"🔍 DEBUG: CONSULTANT - Found {len(timesheets)} timesheets for employee_id {current_user.id}")
    else:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    
    # Debug each timesheet
    for ts in timesheets:
        print(f"🔍 DEBUG: Timesheet {ts.id} belongs to employee_id {ts.employee_id}")
        if hasattr(ts, 'employee') and ts.employee:
            print(f"🔍 DEBUG: Employee name: {ts.employee.full_name}, role: {ts.employee.role.value}, client_id: {ts.employee.client_id}")
    
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
    timesheet = Timesheet(
        employee_id=current_user.id,
        week_start=data.week_start,
        manager_email=data.manager_email,
        comment=data.comment,
        status=TimesheetStatus.DRAFT.value,
        project=data.project
    )
    db.add(timesheet)
    db.commit()
    db.refresh(timesheet)
    return TimesheetResponse.from_orm(timesheet)

# Update timesheet
@router.put("/{timesheet_id}", response_model=TimesheetResponse)
def update_timesheet(timesheet_id: int, data: dict, db: Session = Depends(get_db), current_user: Employee = Depends(get_current_user)):
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
    # Only allow updating comment, status, and project
    if 'comment' in data:
        timesheet.comment = data['comment']
    if 'status' in data:
        # Accepts both enum names (e.g., "DRAFT") and values (e.g., "draft"), always stores lowercase value
        try:
            timesheet.status = TimesheetStatus[data['status'].upper()].value
        except (KeyError, AttributeError):
            timesheet.status = str(data['status']).lower()
    if 'project' in data:
        timesheet.project = data['project']
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
def approve_timesheet(timesheet_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user: Employee = Depends(get_current_user)):
    timesheet = db.query(Timesheet).filter(Timesheet.id == timesheet_id).first()
    if not timesheet:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Timesheet not found")
    if current_user.role != EmployeeRole.CLIENT_MANAGER:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only managers can approve timesheets")
    if timesheet.employee.client_id != current_user.client_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    timesheet.status = TimesheetStatus.APPROVED.value
    timesheet.approved_by = current_user.id
    timesheet.approved_at = datetime.utcnow()
    db.commit()
    db.refresh(timesheet)
    # Email notification to employee
    subject = f"Your Timesheet Was Approved ({timesheet.week_start})"
    body = f"Hello {timesheet.employee.full_name},\n\nYour timesheet for the week starting {timesheet.week_start} has been approved.\n\n-- Dew Time Tracker"
    background_tasks.add_task(send_email, subject, body, [timesheet.employee.email])
    return TimesheetResponse.from_orm(timesheet)

@router.post("/{timesheet_id}/submit", response_model=TimesheetResponse)
def submit_timesheet(timesheet_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user: Employee = Depends(get_current_user)):
    """
    Submit a timesheet for approval. Only the consultant who owns the timesheet can submit.
    Only timesheets in DRAFT status can be submitted.
    """
    timesheet = db.query(Timesheet).filter(Timesheet.id == timesheet_id).first()
    if not timesheet:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Timesheet not found")
    if current_user.role != EmployeeRole.CONSULTANT or timesheet.employee_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to submit this timesheet")
    if timesheet.status != TimesheetStatus.DRAFT.value:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only draft timesheets can be submitted")
    timesheet.status = TimesheetStatus.SUBMITTED.value
    timesheet.submitted_at = datetime.utcnow()
    db.add(timesheet)
    db.commit()
    db.refresh(timesheet)
    # Email notification to manager
    subject = f"Timesheet Submitted for Approval: {current_user.full_name} ({timesheet.week_start})"
    body = f"Hello,\n\nA new timesheet has been submitted for your approval.\n\nEmployee: {current_user.full_name}\nWeek: {timesheet.week_start}\n\nPlease log in to review and approve.\n\n-- Dew Time Tracker"
    background_tasks.add_task(send_email, subject, body, [timesheet.manager_email])
    return TimesheetResponse.from_orm(timesheet)

@router.post("/{timesheet_id}/entries", response_model=TimeEntryResponse)
def add_time_entry(timesheet_id: int, entry_data: TimeEntryCreate, db: Session = Depends(get_db), current_user: Employee = Depends(get_current_user)):
    timesheet = db.query(Timesheet).filter(Timesheet.id == timesheet_id).first()
    if not timesheet:
        raise HTTPException(status_code=404, detail="Timesheet not found")
    if timesheet.employee_id != current_user.id and current_user.role != EmployeeRole.DEW_ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")

    # --- Validation: Overlapping entries, max 24 hours, touching allowed ---
    entries_same_day = db.query(TimeEntry).filter(
        TimeEntry.timesheet_id == timesheet_id,
        TimeEntry.date == entry_data.date
    ).all()
    new_start = entry_data.in_time
    new_end = entry_data.out_time
    if new_end <= new_start:
        raise HTTPException(status_code=400, detail="Out time must be after in time")
    # Check for overlap (touching is allowed)
    def is_overlap(start1, end1, start2, end2):
        return start1 < end2 and start2 < end1  # strict overlap, not touching
    for e in entries_same_day:
        if is_overlap(new_start, new_end, e.in_time, e.out_time):
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Time entry overlaps with an existing entry: "
                    f"{e.in_time.strftime('%H:%M')}–{e.out_time.strftime('%H:%M')}"
                    + (f" (entry ID: {e.id})" if hasattr(e, 'id') else "")
                )
            )
    # --- Validation: Breaks within in/out and no overlap ---
    breaks = entry_data.break_periods
    for i, br1 in enumerate(breaks):
        # Breaks must be within in/out
        if br1.start_time < new_start or br1.end_time > new_end:
            raise HTTPException(status_code=400, detail="Breaks must be within in/out time.")
        if br1.end_time <= br1.start_time:
            raise HTTPException(status_code=400, detail="Break end must be after break start.")
        for j, br2 in enumerate(breaks):
            if i != j:
                if is_overlap(br1.start_time, br1.end_time, br2.start_time, br2.end_time):
                    raise HTTPException(
                        status_code=400,
                        detail=(
                            f"Break period {i+1} ({br1.start_time.strftime('%H:%M')}–{br1.end_time.strftime('%H:%M')}) "
                            f"overlaps with break period {j+1} ({br2.start_time.strftime('%H:%M')}–{br2.end_time.strftime('%H:%M')})"
                        )
                    )
    # --- Validation: Max 24 hours per day ---
    def entry_minutes(e):
        mins = (e.out_time.hour * 60 + e.out_time.minute) - (e.in_time.hour * 60 + e.in_time.minute)
        for br in getattr(e, 'break_periods', []):
            mins -= (br.end_time.hour * 60 + br.end_time.minute) - (br.start_time.hour * 60 + br.start_time.minute)
        return mins
    total_minutes = sum(entry_minutes(e) for e in entries_same_day)
    # Add new entry's minutes
    new_entry_minutes = (new_end.hour * 60 + new_end.minute) - (new_start.hour * 60 + new_start.minute)
    for br in breaks:
        new_entry_minutes -= (br.end_time.hour * 60 + br.end_time.minute) - (br.start_time.hour * 60 + br.start_time.minute)
    if total_minutes + new_entry_minutes > 24 * 60:
        raise HTTPException(status_code=400, detail="Total hours for the day exceed 24.")
    # --- Create entry ---
    time_entry = TimeEntry(
        timesheet_id=timesheet_id,
        date=entry_data.date,
        in_time=entry_data.in_time,
        out_time=entry_data.out_time,
        project=entry_data.project,
        note=entry_data.note
    )
    db.add(time_entry)
    db.flush()  # get time_entry.id
    for br in breaks:
        break_period = BreakPeriod(
            time_entry_id=time_entry.id,
            start_time=br.start_time,
            end_time=br.end_time
        )
        db.add(break_period)
    db.commit()
    db.refresh(time_entry)
    return TimeEntryResponse.from_orm(time_entry)

@router.delete("/{timesheet_id}/entries/{entry_id}", status_code=204)
def delete_time_entry(timesheet_id: int, entry_id: int, db: Session = Depends(get_db), current_user: Employee = Depends(get_current_user)):
    time_entry = db.query(TimeEntry).filter(TimeEntry.id == entry_id, TimeEntry.timesheet_id == timesheet_id).first()
    if not time_entry:
        raise HTTPException(status_code=404, detail="Time entry not found")
    timesheet = db.query(Timesheet).filter(Timesheet.id == timesheet_id).first()
    if not timesheet or (timesheet.employee_id != current_user.id and current_user.role != EmployeeRole.DEW_ADMIN):
        raise HTTPException(status_code=403, detail="Not authorized")
    db.delete(time_entry)
    db.commit()
    return None 