from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any

from server_py.db.session import get_db
from server_py.services.storage import StorageService
from server_py.services.openai_service import OpenAIService

router = APIRouter(prefix="/api/lab-results", tags=["Lab Results"])

def lab_result_to_dict(lab_result) -> Dict[str, Any]:
    return {
        "id": lab_result.id,
        "patientId": lab_result.patient_id,
        "testName": lab_result.test_name,
        "testCategory": lab_result.test_category,
        "fileData": lab_result.file_data,
        "fileName": lab_result.file_name,
        "fileType": lab_result.file_type,
        "testValues": lab_result.test_values,
        "normalRange": lab_result.normal_range,
        "status": lab_result.status,
        "automatedAnalysis": lab_result.automated_analysis,
        "doctorNotes": lab_result.doctor_notes,
        "recommendations": lab_result.recommendations,
        "uploadedBy": lab_result.uploaded_by,
        "reviewedBy": lab_result.reviewed_by,
        "createdAt": lab_result.created_at.isoformat() if lab_result.created_at else None,
        "updatedAt": lab_result.updated_at.isoformat() if lab_result.updated_at else None
    }

@router.get("/patient/{patient_id}")
def get_patient_lab_results(patient_id: str, db: Session = Depends(get_db)):
    storage = StorageService(db)
    lab_results = storage.get_patient_lab_results(patient_id)
    return [lab_result_to_dict(lr) for lr in lab_results]

@router.get("/{lab_result_id}")
def get_lab_result(lab_result_id: str, db: Session = Depends(get_db)):
    storage = StorageService(db)
    lab_result = storage.get_lab_result(lab_result_id)
    
    if not lab_result:
        raise HTTPException(status_code=404, detail="Lab result not found")
    
    return lab_result_to_dict(lab_result)

@router.post("")
def create_lab_result(lab_result_data: Dict[str, Any], db: Session = Depends(get_db)):
    storage = StorageService(db)
    lab_result = storage.create_lab_result(lab_result_data)
    return lab_result_to_dict(lab_result)

@router.patch("/{lab_result_id}")
def update_lab_result(lab_result_id: str, updates: Dict[str, Any], db: Session = Depends(get_db)):
    storage = StorageService(db)
    lab_result = storage.update_lab_result(lab_result_id, updates)
    
    if not lab_result:
        raise HTTPException(status_code=404, detail="Lab result not found")
    
    return lab_result_to_dict(lab_result)

@router.delete("/{lab_result_id}")
def delete_lab_result(lab_result_id: str, db: Session = Depends(get_db)):
    storage = StorageService(db)
    success = storage.delete_lab_result(lab_result_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Lab result not found")
    
    return {"message": "Lab result deleted successfully"}

@router.post("/{lab_result_id}/analyze")
async def analyze_lab_result(lab_result_id: str, db: Session = Depends(get_db)):
    storage = StorageService(db)
    lab_result = storage.get_lab_result(lab_result_id)
    
    if not lab_result:
        raise HTTPException(status_code=404, detail="Lab result not found")
    
    patient = storage.get_patient(lab_result.patient_id)
    patient_data = {
        "age": patient.age if patient else None,
        "gender": patient.gender if patient else None
    }
    
    openai_service = OpenAIService()
    analysis = await openai_service.analyze_lab_results(
        lab_result.test_values or "",
        patient_data
    )
    
    storage.update_lab_result(lab_result_id, {
        "automated_analysis": analysis.get("analysis", "")
    })
    
    return analysis
