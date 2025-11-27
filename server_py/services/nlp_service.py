from typing import Dict, List, Any
import re

class NLPService:
    MEDICAL_TERMS = {
        "symptoms": [
            "fever", "headache", "cough", "fatigue", "pain", "nausea", "vomiting",
            "diarrhea", "dizziness", "weakness", "shortness of breath", "chest pain",
            "sore throat", "runny nose", "body aches", "chills", "sweating",
            "loss of appetite", "abdominal pain", "back pain", "joint pain"
        ],
        "drugs": [
            "paracetamol", "ibuprofen", "aspirin", "amoxicillin", "metformin",
            "lisinopril", "atorvastatin", "omeprazole", "amlodipine", "metoprolol",
            "acetaminophen", "penicillin", "insulin", "prednisone", "azithromycin"
        ],
        "diseases": [
            "diabetes", "hypertension", "asthma", "arthritis", "cancer", "pneumonia",
            "bronchitis", "influenza", "covid", "malaria", "typhoid", "tuberculosis",
            "hepatitis", "anemia", "migraine", "epilepsy", "stroke", "heart disease"
        ],
        "body_parts": [
            "head", "chest", "abdomen", "back", "arm", "leg", "throat", "stomach",
            "heart", "lung", "liver", "kidney", "brain", "eye", "ear", "nose"
        ]
    }
    
    URGENCY_KEYWORDS = {
        "critical": ["emergency", "critical", "severe", "urgent", "immediately", "dying", "unconscious", "not breathing"],
        "high": ["intense", "worsening", "persistent", "unbearable", "blood", "bleeding", "collapse"],
        "medium": ["moderate", "ongoing", "recurring", "concerning", "discomfort"],
        "low": ["mild", "slight", "minor", "occasional"]
    }
    
    DRUG_INTERACTIONS = {
        "warfarin": ["aspirin", "ibuprofen", "vitamin k"],
        "metformin": ["contrast dye", "alcohol"],
        "lisinopril": ["potassium supplements", "nsaids"],
        "aspirin": ["warfarin", "ibuprofen", "blood thinners"]
    }
    
    @staticmethod
    def analyze_text(text: str) -> Dict[str, Any]:
        entities = NLPService.extract_entities(text)
        urgency = NLPService.detect_urgency(text)
        normalized_symptoms = NLPService.normalize_symptoms(text)
        
        return {
            "entities": entities,
            "urgencyLevel": urgency,
            "normalizedSymptoms": normalized_symptoms,
            "originalText": text
        }
    
    @staticmethod
    def extract_entities(text: str) -> Dict[str, List[str]]:
        text_lower = text.lower()
        entities = {
            "symptoms": [],
            "drugs": [],
            "diseases": [],
            "bodyParts": [],
            "labValues": [],
            "allergies": []
        }
        
        for symptom in NLPService.MEDICAL_TERMS["symptoms"]:
            if symptom in text_lower:
                entities["symptoms"].append(symptom)
        
        for drug in NLPService.MEDICAL_TERMS["drugs"]:
            if drug in text_lower:
                entities["drugs"].append(drug)
        
        for disease in NLPService.MEDICAL_TERMS["diseases"]:
            if disease in text_lower:
                entities["diseases"].append(disease)
        
        for body_part in NLPService.MEDICAL_TERMS["body_parts"]:
            if body_part in text_lower:
                entities["bodyParts"].append(body_part)
        
        lab_patterns = [
            r'(\d+\.?\d*)\s*(mg/dl|mmol/l|g/dl|%|mm/hr)',
            r'(hemoglobin|hgb|wbc|rbc|platelet)[\s:]*(\d+\.?\d*)'
        ]
        for pattern in lab_patterns:
            matches = re.findall(pattern, text_lower)
            for match in matches:
                entities["labValues"].append(" ".join(match))
        
        allergy_patterns = [
            r'allergic to\s+([^,\.]+)',
            r'allergy[:\s]+([^,\.]+)'
        ]
        for pattern in allergy_patterns:
            matches = re.findall(pattern, text_lower)
            entities["allergies"].extend(matches)
        
        return entities
    
    @staticmethod
    def normalize_symptoms(text: str) -> List[str]:
        text_lower = text.lower()
        normalized = []
        
        symptom_mappings = {
            "temp": "fever",
            "temperature": "fever",
            "hot": "fever",
            "head hurts": "headache",
            "head ache": "headache",
            "tired": "fatigue",
            "exhausted": "fatigue",
            "throwing up": "vomiting",
            "throw up": "vomiting",
            "belly ache": "abdominal pain",
            "stomach ache": "abdominal pain",
            "tummy pain": "abdominal pain",
            "cant breathe": "shortness of breath",
            "difficulty breathing": "shortness of breath",
            "hard to breathe": "shortness of breath"
        }
        
        for term, normalized_term in symptom_mappings.items():
            if term in text_lower and normalized_term not in normalized:
                normalized.append(normalized_term)
        
        for symptom in NLPService.MEDICAL_TERMS["symptoms"]:
            if symptom in text_lower and symptom not in normalized:
                normalized.append(symptom)
        
        return normalized
    
    @staticmethod
    def detect_urgency(text: str) -> str:
        text_lower = text.lower()
        
        for keyword in NLPService.URGENCY_KEYWORDS["critical"]:
            if keyword in text_lower:
                return "critical"
        
        for keyword in NLPService.URGENCY_KEYWORDS["high"]:
            if keyword in text_lower:
                return "high"
        
        for keyword in NLPService.URGENCY_KEYWORDS["medium"]:
            if keyword in text_lower:
                return "medium"
        
        return "low"
    
    @staticmethod
    def check_drug_interactions(drugs: List[str]) -> List[Dict[str, Any]]:
        interactions = []
        drugs_lower = [d.lower() for d in drugs]
        
        for drug in drugs_lower:
            if drug in NLPService.DRUG_INTERACTIONS:
                for interacting_drug in NLPService.DRUG_INTERACTIONS[drug]:
                    if interacting_drug in drugs_lower:
                        interactions.append({
                            "drug1": drug,
                            "drug2": interacting_drug,
                            "severity": "moderate",
                            "description": f"Potential interaction between {drug} and {interacting_drug}"
                        })
        
        return interactions
    
    @staticmethod
    def check_allergy_conflicts(medications: List[str], allergies: List[str]) -> List[Dict[str, Any]]:
        conflicts = []
        meds_lower = [m.lower() for m in medications]
        allergies_lower = [a.lower() for a in allergies]
        
        for med in meds_lower:
            for allergy in allergies_lower:
                if allergy in med or med in allergy:
                    conflicts.append({
                        "medication": med,
                        "allergy": allergy,
                        "severity": "high",
                        "warning": f"Patient is allergic to {allergy}, which may conflict with {med}"
                    })
        
        return conflicts
