"""
Hospital Management API Endpoints
System Admin: Manage all hospitals
Hospital Admin: Manage their own hospital
"""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from server_py.db.session import get_db
from server_py.models.hospital import Hospital, HospitalStatus, SubscriptionTier
from server_py.models.user import User
from server_py.services.permissions import PermissionService
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import uuid

router = APIRouter(prefix="/api/hospitals", tags=["hospitals"])

# Pydantic schemas
class HospitalCreate(BaseModel):
    name: str
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    subscription_tier: str = "free"
    admin_user_id: str

class HospitalUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    subscription_tier: Optional[str] = None
    subscription_status: Optional[str] = None
    max_staff: Optional[int] = None
    max_patients: Optional[int] = None

class HospitalResponse(BaseModel):
    id: str
    name: str
    address: Optional[str]
    phone: Optional[str]
    email: Optional[str]
    subscription_tier: str
    subscription_status: str
    max_staff: int
    max_patients: int
    admin_user_id: str
    created_at: datetime
    
    class Config:
        from_attributes = True

# System Admin Endpoints
@router.get("/", response_model=List[HospitalResponse])
async def list_all_hospitals(db: Session = Depends(get_db)):
    """List all hospitals (System Admin only)"""
    hospitals = db.query(Hospital).all()
    return hospitals

@router.post("/", response_model=HospitalResponse, status_code=201)
async def create_hospital(hospital_data: HospitalCreate, db: Session = Depends(get_db)):
    """Create a new hospital (System Admin only)"""
    
    # Verify admin user exists
    admin_user = db.query(User).filter(User.id == hospital_data.admin_user_id).first()
    if not admin_user:
        raise HTTPException(status_code=404, detail="Admin user not found")
    
    # Create hospital
    new_hospital = Hospital(
        id=str(uuid.uuid4()),
        name=hospital_data.name,
        address=hospital_data.address,
        phone=hospital_data.phone,
        email=hospital_data.email,
        subscription_tier=SubscriptionTier(hospital_data.subscription_tier),
        subscription_status=HospitalStatus.ACTIVE,
        admin_user_id=hospital_data.admin_user_id,
        max_staff=5 if hospital_data.subscription_tier == "free" else 50,
        max_patients=100 if hospital_data.subscription_tier == "free" else 10000
    )
    
    db.add(new_hospital)
    
    # Update admin user's hospital_id and role
    admin_user.hospital_id = new_hospital.id
    if admin_user.role not in ["system_admin", "hospital_admin"]:
        admin_user.role = "hospital_admin"
    
    db.commit()
    db.refresh(new_hospital)
    
    return new_hospital

@router.get("/{hospital_id}", response_model=HospitalResponse)
async def get_hospital(hospital_id: str, db: Session = Depends(get_db)):
    """Get hospital details"""
    hospital = db.query(Hospital).filter(Hospital.id == hospital_id).first()
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
    return hospital

@router.patch("/{hospital_id}", response_model=HospitalResponse)
async def update_hospital(
    hospital_id: str,
    hospital_data: HospitalUpdate,
    db: Session = Depends(get_db)
):
    """Update hospital details (System Admin or Hospital Admin)"""
    hospital = db.query(Hospital).filter(Hospital.id == hospital_id).first()
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
    
    # Update fields
    update_data = hospital_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        if field == "subscription_tier" and value:
            setattr(hospital, field, SubscriptionTier(value))
        elif field == "subscription_status" and value:
            setattr(hospital, field, HospitalStatus(value))
        else:
            setattr(hospital, field, value)
    
    db.commit()
    db.refresh(hospital)
    return hospital

@router.delete("/{hospital_id}", status_code=204)
async def delete_hospital(hospital_id: str, db: Session = Depends(get_db)):
    """Delete hospital (System Admin only)"""
    hospital = db.query(Hospital).filter(Hospital.id == hospital_id).first()
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
    
    db.delete(hospital)
    db.commit()
    return None

# Hospital Statistics
@router.get("/{hospital_id}/stats")
async def get_hospital_stats(hospital_id: str, db: Session = Depends(get_db)):
    """Get hospital statistics"""
    hospital = db.query(Hospital).filter(Hospital.id == hospital_id).first()
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
    
    # Count staff
    staff_count = db.query(User).filter(
        User.hospital_id == hospital_id,
        User.role.in_(["doctor", "nurse", "pharmacist", "lab_tech", "receptionist"])
    ).count()
    
    # Count patients (those registered by this hospital's staff)
    from server_py.models.patient import Patient
    patient_count = db.query(Patient).filter(
        Patient.registered_by.in_(
            db.query(User.id).filter(User.hospital_id == hospital_id)
        )
    ).count()
    
    # Count appointments
    from server_py.models.appointment import Appointment
    appointment_count = db.query(Appointment).join(
        User, Appointment.doctor_id == User.id
    ).filter(User.hospital_id == hospital_id).count()
    
    return {
        "hospital_id": hospital_id,
        "hospital_name": hospital.name,
        "subscription_tier": hospital.subscription_tier,
        "staff_count": staff_count,
        "max_staff": hospital.max_staff,
        "patient_count": patient_count,
        "max_patients": hospital.max_patients,
        "appointment_count": appointment_count,
        "status": hospital.subscription_status
    }
