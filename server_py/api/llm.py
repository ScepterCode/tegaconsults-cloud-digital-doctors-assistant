from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import Dict, Any

from server_py.db.session import get_db
from server_py.services.storage import StorageService
# Temporarily disabled due to compatibility issues
# from server_py.services.advanced_llm_service import AdvancedLLMService
# from server_py.services.openai_service import OpenAIService

router = APIRouter(prefix="/api/llm", tags=["Advanced LLM"])

@router.post("/drug-alternatives")
async def get_drug_alternatives(data: Dict[str, Any]):
    drug_name = data.get("drugName")
    reason = data.get("reason", "Patient preference")
    
    if not drug_name:
        raise HTTPException(status_code=400, detail="Drug name is required")
    
    service = AdvancedLLMService()
    result = await service.get_drug_alternatives(drug_name, reason)
    return result

@router.post("/treatment-plan")
async def generate_treatment_plan(data: Dict[str, Any], db: Session = Depends(get_db)):
    diagnosis = data.get("diagnosis")
    patient_id = data.get("patientId")
    
    if not diagnosis:
        raise HTTPException(status_code=400, detail="Diagnosis is required")
    
    patient_data = {}
    if patient_id:
        storage = StorageService(db)
        patient = storage.get_patient(patient_id)
        if patient:
            patient_data = {
                "age": patient.age,
                "gender": patient.gender,
                "allergies": patient.allergies,
                "symptoms": patient.symptoms
            }
    
    service = AdvancedLLMService()
    result = await service.generate_treatment_plan(diagnosis, patient_data)
    return result

@router.post("/predict-outcome")
async def predict_outcome(data: Dict[str, Any], db: Session = Depends(get_db)):
    diagnosis = data.get("diagnosis")
    treatment_plan = data.get("treatmentPlan", "")
    patient_id = data.get("patientId")
    
    if not diagnosis:
        raise HTTPException(status_code=400, detail="Diagnosis is required")
    
    patient_data = {}
    if patient_id:
        storage = StorageService(db)
        patient = storage.get_patient(patient_id)
        if patient:
            patient_data = {
                "age": patient.age,
                "genotype": patient.genotype,
                "symptoms": patient.symptoms
            }
    
    service = AdvancedLLMService()
    result = await service.predict_outcome(diagnosis, treatment_plan, patient_data)
    return result

@router.get("/guidelines/{condition}")
async def get_clinical_guidelines(condition: str):
    service = AdvancedLLMService()
    result = await service.get_clinical_guidelines(condition)
    return result

@router.post("/chat")
async def chat_with_dr_tega(data: Dict[str, Any]):
    message = data.get("message")
    context = data.get("context")
    
    if not message:
        raise HTTPException(status_code=400, detail="Message is required")
    
    service = OpenAIService()
    response = await service.chat_with_dr_tega(message, context)
    return {"response": response}

@router.post("/diagnosis-assistance")
async def get_diagnosis_assistance(data: Dict[str, Any], db: Session = Depends(get_db)):
    symptoms = data.get("symptoms")
    patient_id = data.get("patientId")
    
    if not symptoms:
        raise HTTPException(status_code=400, detail="Symptoms are required")
    
    patient_data = {}
    if patient_id:
        storage = StorageService(db)
        patient = storage.get_patient(patient_id)
        if patient:
            patient_data = {
                "age": patient.age,
                "gender": patient.gender,
                "bloodGroup": patient.blood_group,
                "genotype": patient.genotype,
                "allergies": patient.allergies,
                "bloodPressureSystolic": patient.bp_systolic,
                "bloodPressureDiastolic": patient.bp_diastolic,
                "heartRate": patient.heart_rate,
                "temperature": patient.temperature
            }
    
    service = OpenAIService()
    result = await service.get_diagnosis_assistance(symptoms, patient_data)
    return result
