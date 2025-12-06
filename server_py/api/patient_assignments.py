from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from server_py.db.session import get_db
from server_py.models.patient import Patient
from server_py.models.user import User
from pydantic import BaseModel

router = APIRouter(prefix="/api/patient-assignments", tags=["patient-assignments"])

class PatientAssignment(BaseModel):
    patient_id: str
    doctor_id: Optional[str] = None

class BulkAssignment(BaseModel):
    patient_ids: List[str]
    doctor_id: Optional[str] = None

@router.post("/assign")
def assign_patient_to_doctor(
    assignment: PatientAssignment,
    admin_id: str,
    db: Session = Depends(get_db)
):
    """Assign or reassign a patient to a doctor"""
    admin = db.query(User).filter(User.id == admin_id).first()
    if not admin or admin.role not in ["hospital_admin", "system_admin"]:
        raise HTTPException(status_code=403, detail="Only admins can assign patients")
    
    patient = db.query(Patient).filter(Patient.id == assignment.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    if assignment.doctor_id:
        doctor = db.query(User).filter(User.id == assignment.doctor_id, User.role == "doctor").first()
        if not doctor:
            raise HTTPException(status_code=404, detail="Doctor not found")
    
    old_doctor_id = patient.assigned_doctor_id
    patient.assigned_doctor_id = assignment.doctor_id
    patient.last_updated_by = admin_id
    patient.updated_at = datetime.now()
    
    db.commit()
    db.refresh(patient)
    
    return {
        "message": "Patient assigned successfully",
        "patient": serialize_patient_assignment(patient, db),
        "previous_doctor_id": old_doctor_id
    }

@router.post("/bulk-assign")
def bulk_assign_patients(
    assignment: BulkAssignment,
    admin_id: str,
    db: Session = Depends(get_db)
):
    """Assign multiple patients to a doctor"""
    admin = db.query(User).filter(User.id == admin_id).first()
    if not admin or admin.role not in ["hospital_admin", "system_admin"]:
        raise HTTPException(status_code=403, detail="Only admins can assign patients")
    
    if assignment.doctor_id:
        doctor = db.query(User).filter(User.id == assignment.doctor_id, User.role == "doctor").first()
        if not doctor:
            raise HTTPException(status_code=404, detail="Doctor not found")
    
    updated_count = 0
    for patient_id in assignment.patient_ids:
        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        if patient:
            patient.assigned_doctor_id = assignment.doctor_id
            patient.last_updated_by = admin_id
            patient.updated_at = datetime.now()
            updated_count += 1
    
    db.commit()
    
    return {
        "message": f"Successfully assigned {updated_count} patients",
        "updated_count": updated_count
    }

@router.get("/unassigned")
def get_unassigned_patients(
    hospital_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all patients without an assigned doctor"""
    query = db.query(Patient).filter(Patient.assigned_doctor_id.is_(None))
    
    if hospital_id:
        query = query.filter(Patient.hospital_id == hospital_id)
    
    patients = query.all()
    return {
        "patients": [serialize_patient_assignment(p, db) for p in patients],
        "count": len(patients)
    }

@router.get("/by-doctor/{doctor_id}")
def get_patients_by_doctor(doctor_id: str, db: Session = Depends(get_db)):
    """Get all patients assigned to a specific doctor"""
    doctor = db.query(User).filter(User.id == doctor_id, User.role == "doctor").first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    
    patients = db.query(Patient).filter(Patient.assigned_doctor_id == doctor_id).all()
    
    return {
        "doctor": {
            "id": doctor.id,
            "name": doctor.full_name,
            "department_id": doctor.department_id
        },
        "patients": [serialize_patient_assignment(p, db) for p in patients],
        "count": len(patients)
    }

@router.get("/stats")
def get_assignment_stats(
    hospital_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get patient assignment statistics"""
    query = db.query(Patient)
    
    if hospital_id:
        query = query.filter(Patient.hospital_id == hospital_id)
    
    total_patients = query.count()
    assigned_patients = query.filter(Patient.assigned_doctor_id.isnot(None)).count()
    unassigned_patients = total_patients - assigned_patients
    
    # Get doctor workload
    doctors = db.query(User).filter(User.role == "doctor").all()
    doctor_workload = []
    
    for doctor in doctors:
        patient_count = db.query(Patient).filter(Patient.assigned_doctor_id == doctor.id).count()
        if patient_count > 0:
            doctor_workload.append({
                "doctor_id": doctor.id,
                "doctor_name": doctor.full_name,
                "patient_count": patient_count
            })
    
    doctor_workload.sort(key=lambda x: x["patient_count"], reverse=True)
    
    return {
        "total_patients": total_patients,
        "assigned_patients": assigned_patients,
        "unassigned_patients": unassigned_patients,
        "assignment_rate": round((assigned_patients / total_patients * 100) if total_patients > 0 else 0, 1),
        "doctor_workload": doctor_workload
    }

def serialize_patient_assignment(patient: Patient, db: Session):
    assigned_doctor = None
    if patient.assigned_doctor_id:
        doctor = db.query(User).filter(User.id == patient.assigned_doctor_id).first()
        if doctor:
            assigned_doctor = {
                "id": doctor.id,
                "name": doctor.full_name,
                "department_id": doctor.department_id
            }
    
    return {
        "id": patient.id,
        "mrn": patient.mrn,
        "firstName": patient.first_name,
        "lastName": patient.last_name,
        "fullName": f"{patient.first_name} {patient.last_name}",
        "age": patient.age,
        "gender": patient.gender,
        "phoneNumber": patient.phone_number,
        "assignedDoctor": assigned_doctor,
        "hospitalId": patient.hospital_id,
        "departmentId": patient.department_id,
        "createdAt": patient.created_at.isoformat() if patient.created_at else None,
        "updatedAt": patient.updated_at.isoformat() if patient.updated_at else None
    }
