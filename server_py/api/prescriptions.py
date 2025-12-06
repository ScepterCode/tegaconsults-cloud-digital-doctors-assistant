from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
import uuid

from server_py.db.session import get_db
from server_py.models.prescription import Prescription
from server_py.models.user import User
from server_py.models.patient import Patient
from pydantic import BaseModel

router = APIRouter(prefix="/api/prescriptions", tags=["prescriptions"])

class PrescriptionCreate(BaseModel):
    patient_id: str
    medication_name: str
    dosage: str
    frequency: str
    duration: str
    instructions: Optional[str] = None

class PrescriptionDispense(BaseModel):
    notes: Optional[str] = None

@router.post("")
def create_prescription(rx_data: PrescriptionCreate, doctor_id: str, db: Session = Depends(get_db)):
    doctor = db.query(User).filter(User.id == doctor_id, User.role == "doctor").first()
    if not doctor:
        raise HTTPException(status_code=403, detail="Only doctors can create prescriptions")
    
    patient = db.query(Patient).filter(Patient.id == rx_data.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    prescription = Prescription(
        id=str(uuid.uuid4()),
        patient_id=rx_data.patient_id,
        doctor_id=doctor_id,
        medication_name=rx_data.medication_name,
        dosage=rx_data.dosage,
        frequency=rx_data.frequency,
        duration=rx_data.duration,
        instructions=rx_data.instructions,
        status="pending"
    )
    
    db.add(prescription)
    db.commit()
    db.refresh(prescription)
    
    return {"prescription": serialize_prescription(prescription, db)}

@router.get("/patient/{patient_id}")
def get_patient_prescriptions(patient_id: str, status: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Prescription).filter(Prescription.patient_id == patient_id)
    
    if status:
        query = query.filter(Prescription.status == status)
    
    prescriptions = query.order_by(Prescription.created_at.desc()).all()
    return {"prescriptions": [serialize_prescription(p, db) for p in prescriptions]}

@router.get("/pending")
def get_pending_prescriptions(db: Session = Depends(get_db)):
    prescriptions = db.query(Prescription).filter(Prescription.status == "pending").all()
    return {"prescriptions": [serialize_prescription(p, db) for p in prescriptions]}

@router.post("/{prescription_id}/dispense")
def dispense_prescription(
    prescription_id: str,
    dispense_data: PrescriptionDispense,
    pharmacist_id: str,
    db: Session = Depends(get_db)
):
    pharmacist = db.query(User).filter(User.id == pharmacist_id, User.role == "pharmacist").first()
    if not pharmacist:
        raise HTTPException(status_code=403, detail="Only pharmacists can dispense prescriptions")
    
    prescription = db.query(Prescription).filter(Prescription.id == prescription_id).first()
    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")
    
    if prescription.status == "dispensed":
        raise HTTPException(status_code=400, detail="Prescription already dispensed")
    
    prescription.status = "dispensed"
    prescription.dispensed_by = pharmacist_id
    prescription.dispensed_at = datetime.now()
    if dispense_data.notes:
        prescription.notes = dispense_data.notes
    
    db.commit()
    db.refresh(prescription)
    
    return {"prescription": serialize_prescription(prescription, db)}

def serialize_prescription(prescription: Prescription, db: Session):
    doctor = db.query(User).filter(User.id == prescription.doctor_id).first()
    patient = db.query(Patient).filter(Patient.id == prescription.patient_id).first()
    pharmacist = None
    if prescription.dispensed_by:
        pharmacist = db.query(User).filter(User.id == prescription.dispensed_by).first()
    
    return {
        "id": prescription.id,
        "patient": {
            "id": patient.id,
            "name": f"{patient.first_name} {patient.last_name}",
            "mrn": patient.mrn
        } if patient else None,
        "doctor": {
            "id": doctor.id,
            "name": doctor.full_name
        } if doctor else None,
        "medicationName": prescription.medication_name,
        "dosage": prescription.dosage,
        "frequency": prescription.frequency,
        "duration": prescription.duration,
        "instructions": prescription.instructions,
        "status": prescription.status,
        "dispensedBy": {
            "id": pharmacist.id,
            "name": pharmacist.full_name
        } if pharmacist else None,
        "dispensedAt": prescription.dispensed_at.isoformat() if prescription.dispensed_at else None,
        "notes": prescription.notes,
        "createdAt": prescription.created_at.isoformat() if prescription.created_at else None
    }
