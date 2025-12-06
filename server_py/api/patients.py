from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any

from server_py.db.session import get_db
from server_py.services.storage import StorageService
from server_py.services.ml_service import MLHealthService

router = APIRouter(prefix="/api", tags=["Patients"])

def patient_to_dict(patient) -> Dict[str, Any]:
    return {
        "id": patient.id,
        "mrn": patient.mrn,
        "firstName": patient.first_name,
        "lastName": patient.last_name,
        "age": patient.age,
        "gender": patient.gender,
        "phoneNumber": patient.phone_number,
        "email": patient.email,
        "address": patient.address,
        "nin": patient.nin,
        "bloodGroup": patient.blood_group,
        "genotype": patient.genotype,
        "allergies": patient.allergies,
        "symptoms": patient.symptoms,
        "bloodPressureSystolic": patient.bp_systolic,
        "bloodPressureDiastolic": patient.bp_diastolic,
        "temperature": patient.temperature,
        "heartRate": patient.heart_rate,
        "weight": patient.weight,
        "facialRecognitionData": patient.facial_recognition_data,
        "fingerprintData": patient.fingerprint_data,
        "registeredBy": patient.registered_by,
        "lastUpdatedBy": patient.last_updated_by,
        "createdAt": patient.created_at.isoformat() if patient.created_at else None,
        "updatedAt": patient.updated_at.isoformat() if patient.updated_at else None
    }

@router.get("/patients")
def get_all_patients(
    doctor_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Get patients. If doctor_id is provided, returns only patients assigned to that doctor.
    Otherwise returns all patients (for admins).
    """
    from server_py.models.patient import Patient
    
    if doctor_id:
        # Filter by assigned doctor
        patients = db.query(Patient).filter(Patient.assigned_doctor_id == doctor_id).all()
    else:
        # Return all patients
        storage = StorageService(db)
        patients = storage.get_all_patients()
    
    return [patient_to_dict(p) for p in patients]

@router.get("/patients/search")
def search_patients(query: str = Query(...), db: Session = Depends(get_db)):
    storage = StorageService(db)
    patients = storage.search_patients(query)
    return [patient_to_dict(p) for p in patients]

@router.get("/patients/{patient_id}")
def get_patient(patient_id: str, db: Session = Depends(get_db)):
    storage = StorageService(db)
    patient = storage.get_patient(patient_id)
    
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    return patient_to_dict(patient)

@router.post("/patients")
def create_patient(patient_data: Dict[str, Any], db: Session = Depends(get_db)):
    storage = StorageService(db)
    
    if patient_data.get("mrn"):
        existing = storage.get_patient_by_mrn(patient_data["mrn"])
        if existing:
            raise HTTPException(status_code=400, detail="MRN already exists")
    
    patient = storage.create_patient(patient_data)
    return patient_to_dict(patient)

@router.patch("/patients/{patient_id}")
def update_patient(patient_id: str, updates: Dict[str, Any], db: Session = Depends(get_db)):
    storage = StorageService(db)
    patient = storage.update_patient(patient_id, updates)
    
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    return patient_to_dict(patient)

@router.delete("/patients/{patient_id}")
def delete_patient(patient_id: str, db: Session = Depends(get_db)):
    storage = StorageService(db)
    success = storage.delete_patient(patient_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    return {"message": "Patient deleted successfully"}

@router.post("/patients/identify")
def identify_patient(data: Dict[str, Any], db: Session = Depends(get_db)):
    storage = StorageService(db)
    method = data.get("method")
    patient = None
    
    if method == "nin":
        patient = storage.get_patient_by_nin(data.get("nin"))
    elif method == "fingerprint":
        patient = storage.get_patient_by_fingerprint(data.get("fingerprintData"))
    elif method == "facial":
        patient = storage.get_patient_by_facial(data.get("facialData"))
    elif method == "mrn":
        patient = storage.get_patient_by_mrn(data.get("mrn"))
    
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    return patient_to_dict(patient)

@router.get("/health-assessment/{patient_id}")
def get_health_assessment(patient_id: str, db: Session = Depends(get_db)):
    storage = StorageService(db)
    patient = storage.get_patient(patient_id)
    
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    patient_data = patient_to_dict(patient)
    assessment = MLHealthService.generate_health_assessment(patient_data)
    
    return assessment
