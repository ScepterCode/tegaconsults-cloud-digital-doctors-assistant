"""
Python ML Microservice for Digital Doctors Assistant
Handles: Health analysis, lab result analysis, disease prediction, drug recommendations
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict
import os

app = FastAPI(title="Medical ML Service", version="1.0.0")

# Pydantic models for requests/responses
class VitalsData(BaseModel):
    bloodPressureSystolic: int
    bloodPressureDiastolic: int
    temperature: float
    heartRate: int
    weight: float
    age: int
    gender: str
    genotype: str
    bloodGroup: str
    symptoms: Optional[str] = None

class LabResultData(BaseModel):
    testName: str
    testValues: Dict
    normalRange: Dict

class HealthAssessmentResponse(BaseModel):
    healthRiskScore: float
    riskLevel: str
    riskFactors: List[str]
    suggestedDiagnosis: List[Dict]
    recommendations: List[Dict]
    prescribedDrugs: List[Dict]

class LabAnalysisResponse(BaseModel):
    overallStatus: str
    severity: str
    flaggedAbnormalities: List[Dict]
    recommendations: List[str]

# ML Analysis Functions
def assess_health(vitals: VitalsData) -> dict:
    """Analyze patient vitals and predict health risks"""
    risk_score = 0
    risk_factors = []
    
    # Blood pressure analysis
    if vitals.bloodPressureSystolic > 140 or vitals.bloodPressureDiastolic > 90:
        risk_score += 25
        risk_factors.append("Hypertension")
    elif vitals.bloodPressureSystolic > 130 or vitals.bloodPressureDiastolic > 85:
        risk_score += 15
        risk_factors.append("Elevated Blood Pressure")
    
    # Heart rate analysis
    if vitals.heartRate > 100 or vitals.heartRate < 60:
        risk_score += 15
        risk_factors.append("Abnormal Heart Rate")
    
    # Temperature analysis
    if vitals.temperature > 38.5 or vitals.temperature < 36:
        risk_score += 10
        risk_factors.append("Abnormal Temperature")
    
    # Age-related risk
    if vitals.age > 60:
        risk_score += 20
        risk_factors.append("Age-related Risk")
    
    # Genotype-related risk
    if vitals.genotype == "SS":
        risk_score += 30
        risk_factors.append("Sickle Cell Disease")
    elif vitals.genotype == "AS":
        risk_score += 10
        risk_factors.append("Sickle Cell Trait")
    
    risk_score = min(risk_score, 100)
    
    # Determine risk level
    if risk_score >= 75:
        risk_level = "CRITICAL"
    elif risk_score >= 50:
        risk_level = "HIGH"
    elif risk_score >= 25:
        risk_level = "MODERATE"
    else:
        risk_level = "LOW"
    
    # Generate diagnosis suggestions
    diagnoses = []
    if "Hypertension" in risk_factors:
        diagnoses.append({
            "condition": "Essential Hypertension",
            "confidence": 0.85,
            "symptoms": ["headache", "chest pain", "shortness of breath"],
            "severity": "moderate"
        })
    
    if "Abnormal Heart Rate" in risk_factors:
        diagnoses.append({
            "condition": "Arrhythmia",
            "confidence": 0.7,
            "symptoms": ["palpitations", "dizziness", "fatigue"],
            "severity": "moderate"
        })
    
    if "Sickle Cell Disease" in risk_factors:
        diagnoses.append({
            "condition": "Sickle Cell Disease",
            "confidence": 0.98,
            "symptoms": ["pain crisis", "fatigue", "jaundice"],
            "severity": "severe"
        })
    
    # Generate recommendations
    recommendations = []
    if risk_score > 50:
        recommendations.append({
            "category": "Immediate",
            "recommendation": "Schedule urgent medical consultation",
            "priority": "high",
            "action": "Contact physician within 24 hours"
        })
    
    if "Hypertension" in risk_factors:
        recommendations.append({
            "category": "Lifestyle",
            "recommendation": "Reduce sodium intake and increase physical activity",
            "priority": "high",
            "action": "Aim for 150 min of moderate exercise weekly"
        })
    
    recommendations.append({
        "category": "Follow-up",
        "recommendation": "Regular health monitoring",
        "priority": "medium",
        "action": "Schedule follow-up in 2 weeks"
    })
    
    # Generate drug recommendations
    drugs = []
    if "Hypertension" in risk_factors:
        drugs.append({
            "drugName": "Lisinopril",
            "dosage": "10mg",
            "frequency": "Once daily",
            "duration": "Ongoing",
            "indication": "Hypertension management",
            "contraindications": ["Pregnancy", "Kidney disease"],
            "sideEffects": ["Dry cough", "Dizziness", "Fatigue"]
        })
    
    return {
        "healthRiskScore": risk_score,
        "riskLevel": risk_level,
        "riskFactors": list(set(risk_factors)),
        "suggestedDiagnosis": diagnoses,
        "recommendations": recommendations,
        "prescribedDrugs": drugs,
        "analysisDetails": {
            "bpAnalysis": f"BP: {vitals.bloodPressureSystolic}/{vitals.bloodPressureDiastolic}",
            "heartRateAnalysis": f"HR: {vitals.heartRate} bpm",
            "temperatureAnalysis": f"Temp: {vitals.temperature}°C",
            "weightAnalysis": f"Weight: {vitals.weight} kg",
            "ageRiskAnalysis": f"Age: {vitals.age} years",
            "genotypeBenefit": f"Genotype: {vitals.genotype}"
        }
    }

def analyze_lab_results(lab: LabResultData) -> dict:
    """Analyze laboratory test results"""
    abnormalities = []
    status = "normal"
    severity = "low"
    
    for param, value in lab.testValues.items():
        if param in lab.normalRange:
            normal_min, normal_max = lab.normalRange[param]
            if value < normal_min or value > normal_max:
                status = "abnormal"
                severity = "moderate" if abs(value - normal_max) < normal_max * 0.2 else "high"
                abnormalities.append({
                    "parameter": param,
                    "value": str(value),
                    "normalRange": f"{normal_min}-{normal_max}",
                    "status": "abnormal",
                    "clinicalSignificance": f"Value is outside normal range for {param}"
                })
    
    return {
        "testName": lab.testName,
        "overallStatus": status,
        "severity": severity,
        "flaggedAbnormalities": abnormalities,
        "recommendations": [
            "Consult with healthcare provider for interpretation",
            "Repeat test if necessary",
            "Monitor for changes in next follow-up"
        ]
    }

# API Endpoints
@app.post("/health-analysis", response_model=HealthAssessmentResponse)
async def health_analysis(vitals: VitalsData):
    """Analyze patient vitals and return health assessment"""
    try:
        result = assess_health(vitals)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/lab-analysis", response_model=LabAnalysisResponse)
async def lab_analysis(lab: LabResultData):
    """Analyze laboratory results"""
    try:
        result = analyze_lab_results(lab)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "service": "ml_service"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("ML_SERVICE_PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)
