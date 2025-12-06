from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel

from server_py.db.session import get_db
from server_py.models.patient import Patient
from server_py.models.doctor_note import DoctorNote
from server_py.models.lab_result import LabResult
from server_py.models.user import User
from server_py.services.ai_clinical_assistant import AIClinicalAssistant

router = APIRouter(prefix="/api/ai-clinical-insights", tags=["ai-clinical-insights"])

class ClinicalQuestion(BaseModel):
    question: str
    patient_id: Optional[str] = None

class TreatmentRequest(BaseModel):
    patient_id: str
    diagnosis: str

@router.get("/patient-summary/{patient_id}")
def get_patient_summary(patient_id: str, doctor_id: str, db: Session = Depends(get_db)):
    """Generate AI-powered summary of patient's medical history"""
    
    # Verify doctor
    doctor = db.query(User).filter(User.id == doctor_id, User.role == "doctor").first()
    if not doctor:
        raise HTTPException(status_code=403, detail="Only doctors can access AI insights")
    
    # Get patient data
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Get notes
    notes = db.query(DoctorNote).filter(
        DoctorNote.patient_id == patient_id,
        (DoctorNote.is_private == "0") | 
        ((DoctorNote.is_private == "1") & (DoctorNote.doctor_id == doctor_id))
    ).order_by(DoctorNote.created_at.desc()).limit(20).all()
    
    # Get lab results
    lab_results = db.query(LabResult).filter(
        LabResult.patient_id == patient_id
    ).order_by(LabResult.test_date.desc()).limit(10).all()
    
    # Prepare data
    patient_data = {
        "firstName": patient.first_name,
        "lastName": patient.last_name,
        "age": patient.age,
        "gender": patient.gender,
        "bloodGroup": patient.blood_group,
        "genotype": patient.genotype,
        "allergies": patient.allergies,
        "symptoms": patient.symptoms,
        "bpSystolic": patient.bp_systolic,
        "bpDiastolic": patient.bp_diastolic,
        "temperature": patient.temperature,
        "heartRate": patient.heart_rate,
        "weight": patient.weight
    }
    
    notes_data = [{
        "noteType": n.note_type,
        "title": n.title,
        "content": n.content,
        "createdAt": n.created_at.isoformat() if n.created_at else None
    } for n in notes]
    
    lab_data = [{
        "testName": lr.test_name,
        "result": lr.result,
        "status": lr.status,
        "testDate": lr.test_date.isoformat() if lr.test_date else None
    } for lr in lab_results]
    
    # Generate AI summary
    try:
        ai_assistant = AIClinicalAssistant()
        summary = ai_assistant.summarize_patient_history(patient_data, notes_data, lab_data)
        
        return {
            "summary": summary,
            "patient": patient_data,
            "notes_count": len(notes_data),
            "lab_results_count": len(lab_data)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")

@router.get("/lab-analysis/{patient_id}")
def analyze_lab_results(patient_id: str, doctor_id: str, db: Session = Depends(get_db)):
    """AI analysis of patient's lab results"""
    
    doctor = db.query(User).filter(User.id == doctor_id, User.role == "doctor").first()
    if not doctor:
        raise HTTPException(status_code=403, detail="Only doctors can access AI insights")
    
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    lab_results = db.query(LabResult).filter(
        LabResult.patient_id == patient_id
    ).order_by(LabResult.test_date.desc()).limit(15).all()
    
    if not lab_results:
        raise HTTPException(status_code=404, detail="No lab results found for this patient")
    
    patient_data = {
        "firstName": patient.first_name,
        "lastName": patient.last_name,
        "age": patient.age,
        "gender": patient.gender
    }
    
    lab_data = [{
        "testName": lr.test_name,
        "result": lr.result,
        "status": lr.status,
        "referenceRange": lr.reference_range,
        "testDate": lr.test_date.isoformat() if lr.test_date else None
    } for lr in lab_results]
    
    try:
        ai_assistant = AIClinicalAssistant()
        analysis = ai_assistant.analyze_lab_results(lab_data, patient_data)
        
        return {
            "analysis": analysis,
            "lab_results_analyzed": len(lab_data)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")

@router.post("/treatment-recommendations")
def get_treatment_recommendations(request: TreatmentRequest, doctor_id: str, db: Session = Depends(get_db)):
    """Get AI-powered treatment recommendations"""
    
    doctor = db.query(User).filter(User.id == doctor_id, User.role == "doctor").first()
    if not doctor:
        raise HTTPException(status_code=403, detail="Only doctors can access AI insights")
    
    patient = db.query(Patient).filter(Patient.id == request.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    notes = db.query(DoctorNote).filter(
        DoctorNote.patient_id == request.patient_id
    ).order_by(DoctorNote.created_at.desc()).limit(10).all()
    
    patient_data = {
        "age": patient.age,
        "gender": patient.gender,
        "allergies": patient.allergies,
        "symptoms": patient.symptoms
    }
    
    notes_data = [{
        "noteType": n.note_type,
        "title": n.title,
        "content": n.content
    } for n in notes]
    
    try:
        ai_assistant = AIClinicalAssistant()
        recommendations = ai_assistant.generate_treatment_recommendations(
            patient_data, request.diagnosis, notes_data
        )
        
        return {
            "recommendations": recommendations,
            "diagnosis": request.diagnosis
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")

@router.get("/risk-assessment/{patient_id}")
def assess_risk_factors(patient_id: str, doctor_id: str, db: Session = Depends(get_db)):
    """AI-powered risk factor assessment"""
    
    doctor = db.query(User).filter(User.id == doctor_id, User.role == "doctor").first()
    if not doctor:
        raise HTTPException(status_code=403, detail="Only doctors can access AI insights")
    
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    notes = db.query(DoctorNote).filter(
        DoctorNote.patient_id == patient_id
    ).order_by(DoctorNote.created_at.desc()).limit(15).all()
    
    lab_results = db.query(LabResult).filter(
        LabResult.patient_id == patient_id
    ).order_by(LabResult.test_date.desc()).limit(10).all()
    
    patient_data = {
        "age": patient.age,
        "gender": patient.gender,
        "bloodGroup": patient.blood_group,
        "genotype": patient.genotype,
        "allergies": patient.allergies,
        "bpSystolic": patient.bp_systolic,
        "bpDiastolic": patient.bp_diastolic,
        "heartRate": patient.heart_rate,
        "weight": patient.weight
    }
    
    notes_data = [{
        "noteType": n.note_type,
        "content": n.content
    } for n in notes]
    
    lab_data = [{
        "testName": lr.test_name,
        "result": lr.result,
        "status": lr.status
    } for lr in lab_results]
    
    try:
        ai_assistant = AIClinicalAssistant()
        risk_assessment = ai_assistant.identify_risk_factors(patient_data, notes_data, lab_data)
        
        return {
            "risk_assessment": risk_assessment
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")

@router.post("/ask-question")
def ask_clinical_question(question: ClinicalQuestion, doctor_id: str, db: Session = Depends(get_db)):
    """Ask AI a clinical question with optional patient context"""
    
    doctor = db.query(User).filter(User.id == doctor_id, User.role == "doctor").first()
    if not doctor:
        raise HTTPException(status_code=403, detail="Only doctors can access AI insights")
    
    patient_context = None
    if question.patient_id:
        patient = db.query(Patient).filter(Patient.id == question.patient_id).first()
        if patient:
            patient_context = {
                "age": patient.age,
                "gender": patient.gender,
                "symptoms": patient.symptoms,
                "allergies": patient.allergies
            }
    
    try:
        ai_assistant = AIClinicalAssistant()
        answer = ai_assistant.answer_clinical_question(question.question, patient_context)
        
        return {
            "question": question.question,
            "answer": answer,
            "has_patient_context": patient_context is not None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")
