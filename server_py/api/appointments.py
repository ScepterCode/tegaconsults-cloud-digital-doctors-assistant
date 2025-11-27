from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any, List

from server_py.db.session import get_db
from server_py.services.storage import StorageService

router = APIRouter(prefix="/api/appointments", tags=["Appointments"])

def appointment_to_dict(appointment) -> Dict[str, Any]:
    return {
        "id": appointment.id,
        "patientId": appointment.patient_id,
        "doctorId": appointment.doctor_id,
        "appointmentDate": appointment.appointment_date,
        "appointmentTime": appointment.appointment_time,
        "reason": appointment.reason,
        "status": appointment.status,
        "notes": appointment.notes,
        "createdBy": appointment.created_by,
        "createdAt": appointment.created_at.isoformat() if appointment.created_at else None,
        "updatedAt": appointment.updated_at.isoformat() if appointment.updated_at else None
    }

@router.get("")
def get_all_appointments(db: Session = Depends(get_db)):
    storage = StorageService(db)
    appointments = storage.get_all_appointments()
    return [appointment_to_dict(a) for a in appointments]

@router.get("/{appointment_id}")
def get_appointment(appointment_id: str, db: Session = Depends(get_db)):
    storage = StorageService(db)
    appointment = storage.get_appointment(appointment_id)
    
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    return appointment_to_dict(appointment)

@router.post("")
def create_appointment(appointment_data: Dict[str, Any], db: Session = Depends(get_db)):
    storage = StorageService(db)
    appointment = storage.create_appointment(appointment_data)
    return appointment_to_dict(appointment)

@router.patch("/{appointment_id}")
def update_appointment(appointment_id: str, updates: Dict[str, Any], db: Session = Depends(get_db)):
    storage = StorageService(db)
    appointment = storage.update_appointment(appointment_id, updates)
    
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    return appointment_to_dict(appointment)

@router.delete("/{appointment_id}")
def delete_appointment(appointment_id: str, db: Session = Depends(get_db)):
    storage = StorageService(db)
    success = storage.delete_appointment(appointment_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    return {"message": "Appointment deleted successfully"}

@router.get("/patient/{patient_id}")
def get_patient_appointments(patient_id: str, db: Session = Depends(get_db)):
    storage = StorageService(db)
    appointments = storage.get_patient_appointments(patient_id)
    return [appointment_to_dict(a) for a in appointments]

@router.get("/doctor/{doctor_id}")
def get_doctor_appointments(doctor_id: str, db: Session = Depends(get_db)):
    storage = StorageService(db)
    appointments = storage.get_doctor_appointments(doctor_id)
    return [appointment_to_dict(a) for a in appointments]
