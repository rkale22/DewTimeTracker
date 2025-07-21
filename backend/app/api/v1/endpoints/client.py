from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.session import get_db
from app.models.client import Client
from app.models.employee import Employee, EmployeeRole
from app.schemas.client import ClientCreateRequest, ClientUpdateRequest, ClientResponse
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/clients", tags=["clients"])

# List clients
@router.get("/", response_model=List[ClientResponse])
def list_clients(db: Session = Depends(get_db), current_user: Employee = Depends(get_current_user)):
    if current_user.role == EmployeeRole.DEW_ADMIN:
        clients = db.query(Client).all()
    elif current_user.role == EmployeeRole.CLIENT_MANAGER:
        clients = db.query(Client).filter(Client.id == current_user.client_id).all()
    else:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    return clients

# Get client by ID
@router.get("/{client_id}", response_model=ClientResponse)
def get_client(client_id: int, db: Session = Depends(get_db), current_user: Employee = Depends(get_current_user)):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
    if current_user.role == EmployeeRole.DEW_ADMIN:
        return client
    elif current_user.role == EmployeeRole.CLIENT_MANAGER:
        if client.id != current_user.client_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
        return client
    else:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

# Create client
@router.post("/", response_model=ClientResponse, status_code=status.HTTP_201_CREATED)
def create_client(data: ClientCreateRequest, db: Session = Depends(get_db), current_user: Employee = Depends(get_current_user)):
    if current_user.role != EmployeeRole.DEW_ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    # Check for unique code
    if db.query(Client).filter(Client.code == data.code).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Client code already exists")
    client = Client(name=data.name, code=data.code)
    db.add(client)
    db.commit()
    db.refresh(client)
    return client

# Update client
@router.put("/{client_id}", response_model=ClientResponse)
def update_client(client_id: int, data: ClientUpdateRequest, db: Session = Depends(get_db), current_user: Employee = Depends(get_current_user)):
    if current_user.role != EmployeeRole.DEW_ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
    # Check for unique code if updating
    if data.code and data.code != client.code:
        if db.query(Client).filter(Client.code == data.code).first():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Client code already exists")
        client.code = data.code
    if data.name:
        client.name = data.name
    db.commit()
    db.refresh(client)
    return client

# Delete client
@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_client(client_id: int, db: Session = Depends(get_db), current_user: Employee = Depends(get_current_user)):
    if current_user.role != EmployeeRole.DEW_ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
    db.delete(client)
    db.commit()
    return None 