from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List

from server_py.services.nlp_service import NLPService

router = APIRouter(prefix="/api/nlp", tags=["NLP"])

@router.post("/analyze")
def analyze_text(data: Dict[str, Any]):
    text = data.get("text")
    if not text:
        raise HTTPException(status_code=400, detail="Text is required")
    
    analysis = NLPService.analyze_text(text)
    return analysis

@router.post("/normalize-symptoms")
def normalize_symptoms(data: Dict[str, Any]):
    text = data.get("text")
    if not text:
        raise HTTPException(status_code=400, detail="Text is required")
    
    normalized = NLPService.normalize_symptoms(text)
    return {"symptoms": normalized}

@router.post("/extract-entities")
def extract_entities(data: Dict[str, Any]):
    text = data.get("text")
    if not text:
        raise HTTPException(status_code=400, detail="Text is required")
    
    entities = NLPService.extract_entities(text)
    return {"entities": entities}

@router.post("/detect-urgency")
def detect_urgency(data: Dict[str, Any]):
    text = data.get("text")
    if not text:
        raise HTTPException(status_code=400, detail="Text is required")
    
    urgency = NLPService.detect_urgency(text)
    return {"urgencyLevel": urgency}

@router.post("/check-interactions")
def check_drug_interactions(data: Dict[str, Any]):
    drugs = data.get("drugs", [])
    if not drugs:
        raise HTTPException(status_code=400, detail="Drugs list is required")
    
    interactions = NLPService.check_drug_interactions(drugs)
    return {"interactions": interactions}

@router.post("/check-allergies")
def check_allergy_conflicts(data: Dict[str, Any]):
    medications = data.get("medications", [])
    allergies = data.get("allergies", [])
    
    if not medications:
        raise HTTPException(status_code=400, detail="Medications list is required")
    
    conflicts = NLPService.check_allergy_conflicts(medications, allergies)
    return {"conflicts": conflicts}
