"""
Staff Management API Endpoints
Hospital Admin: Manage staff in their hospital
"""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from server_py.db.session import get_db
from server_py.models.user import User
from server_py.services.permissions import PermissionService
from pydantic import BaseModel
from typing import List, Optional
import uuid
import json

router = APIRouter(prefix="/api/staff", tags=["staff"])

# Pydantic schemas
class StaffCreate(BaseModel):
    username: str
    password: str
    full_name: str
    role: str  # doctor, nurse, pharmacist, lab_tech, receptionist
    hospital_id: str
    department_id: Optional[str] = None
    permissions: Optional[dict] = None

class StaffUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    department_id: Optional[str] = None
    permissions: Optional[dict] = None
    is_active: Optional[int] = None

class StaffResponse(BaseModel):
    id: str
    username: str
    full_name: str
    role: str
    hospital_id: Optional[str]
    department_id: Optional[str]
    is_active: int
    
    class Config:
        from_attributes = True

@router.get("/hospital/{hospital_id}", response_model=List[StaffResponse])
async def list_hospital_staff(hospital_id: str, db: Session = Depends(get_db)):
    """List all staff members in a hospital"""
    staff = db.query(User).filter(
        User.hospital_id == hospital_id,
        User.role.in_(["hospital_admin", "doctor", "nurse", "pharmacist", "lab_tech", "receptionist", "accountant", "accounts_manager"])
    ).all()
    return staff

@router.post("/", response_model=StaffResponse, status_code=201)
async def add_staff_member(staff_data: StaffCreate, db: Session = Depends(get_db)):
    """Add a new staff member (Hospital Admin only)"""
    
    # Check if username already exists
    existing_user = db.query(User).filter(User.username == staff_data.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    # Validate role
    valid_roles = ["doctor", "nurse", "pharmacist", "lab_tech", "receptionist"]
    if staff_data.role not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {', '.join(valid_roles)}")
    
    # Check hospital exists
    from server_py.models.hospital import Hospital
    hospital = db.query(Hospital).filter(Hospital.id == staff_data.hospital_id).first()
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
    
    # Check staff limit
    current_staff_count = db.query(User).filter(
        User.hospital_id == staff_data.hospital_id,
        User.role.in_(valid_roles)
    ).count()
    
    if current_staff_count >= hospital.max_staff:
        raise HTTPException(
            status_code=400,
            detail=f"Hospital has reached maximum staff limit ({hospital.max_staff}). Upgrade subscription to add more staff."
        )
    
    # Create staff member
    permissions_json = json.dumps(staff_data.permissions) if staff_data.permissions else None
    
    new_staff = User(
        id=str(uuid.uuid4()),
        username=staff_data.username,
        password=staff_data.password,  # In production, hash this!
        full_name=staff_data.full_name,
        role=staff_data.role,
        hospital_id=staff_data.hospital_id,
        department_id=staff_data.department_id,
        permissions=permissions_json,
        is_active=1
    )
    
    db.add(new_staff)
    db.commit()
    db.refresh(new_staff)
    
    return new_staff

@router.get("/{staff_id}", response_model=StaffResponse)
async def get_staff_member(staff_id: str, db: Session = Depends(get_db)):
    """Get staff member details"""
    staff = db.query(User).filter(User.id == staff_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")
    return staff

@router.patch("/{staff_id}", response_model=StaffResponse)
async def update_staff_member(
    staff_id: str,
    staff_data: StaffUpdate,
    db: Session = Depends(get_db)
):
    """Update staff member details (Hospital Admin only)"""
    staff = db.query(User).filter(User.id == staff_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")
    
    # Update fields
    update_data = staff_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        if field == "permissions" and value:
            setattr(staff, field, json.dumps(value))
        else:
            setattr(staff, field, value)
    
    db.commit()
    db.refresh(staff)
    return staff

@router.delete("/{staff_id}", status_code=204)
async def remove_staff_member(staff_id: str, db: Session = Depends(get_db)):
    """Remove staff member (Hospital Admin only)"""
    staff = db.query(User).filter(User.id == staff_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")
    
    # Don't allow deleting hospital admins or system admins
    if staff.role in ["system_admin", "hospital_admin"]:
        raise HTTPException(status_code=403, detail="Cannot delete admin users via this endpoint")
    
    db.delete(staff)
    db.commit()
    return None

@router.get("/hospital/{hospital_id}/by-role/{role}", response_model=List[StaffResponse])
async def list_staff_by_role(hospital_id: str, role: str, db: Session = Depends(get_db)):
    """List staff members by role in a hospital"""
    staff = db.query(User).filter(
        User.hospital_id == hospital_id,
        User.role == role
    ).all()
    return staff
