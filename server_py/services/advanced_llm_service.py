from typing import Dict, List, Any, Optional
import os
import requests

OPENAI_AVAILABLE = True

class AdvancedLLMService:
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.api_url = "https://api.openai.com/v1/chat/completions"
        self.model = "gpt-4o-mini"
    
    def is_available(self) -> bool:
        return self.api_key is not None
    
    async def get_drug_alternatives(self, drug_name: str, reason: str) -> Dict[str, Any]:
        if not self.is_available():
            return self._fallback_drug_alternatives(drug_name)
        
        try:
            prompt = f"""Provide alternative medications for {drug_name}.
Reason for seeking alternatives: {reason}

Please provide:
1. 3-5 alternative medications
2. For each alternative, include:
   - Drug name
   - Advantages over the original
   - Disadvantages
   - Typical dosage
   - Key considerations"""

            headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}; data = {"model": self.model,
                messages=[
                    {"role": "system", "content": "You are a clinical pharmacology expert providing drug alternative recommendations."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=800,
                temperature=0.3
            }; response = requests.post(self.api_url, headers=headers, json=data, timeout=30); response.raise_for_status(); return {"originalDrug": drug_name,
                "reason": reason,
                "alternatives": response.json()["choices"][0]["message"]["content"],
                "status": "success"
            }
        except Exception as e:
            return self._fallback_drug_alternatives(drug_name)
    
    async def generate_treatment_plan(self, diagnosis: str, patient_data: Dict[str, Any]) -> Dict[str, Any]:
        if not self.is_available():
            return self._fallback_treatment_plan(diagnosis)
        
        try:
            prompt = f"""Generate a comprehensive treatment plan for:

Diagnosis: {diagnosis}

Patient Information:
- Age: {patient_data.get('age', 'Unknown')}
- Gender: {patient_data.get('gender', 'Unknown')}
- Allergies: {patient_data.get('allergies', 'None reported')}
- Current symptoms: {patient_data.get('symptoms', 'Not specified')}

Please provide:
1. Treatment goals
2. Medication regimen
3. Lifestyle modifications
4. Follow-up schedule
5. Warning signs to watch for
6. Expected outcomes"""

            headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}; data = {"model": self.model,
                messages=[
                    {"role": "system", "content": "You are a clinical treatment planning specialist."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=1000,
                temperature=0.3
            }; response = requests.post(self.api_url, headers=headers, json=data, timeout=30); response.raise_for_status(); return {"diagnosis": diagnosis,
                "treatmentPlan": response.json()["choices"][0]["message"]["content"],
                "status": "success"
            }
        except Exception as e:
            return self._fallback_treatment_plan(diagnosis)
    
    async def predict_outcome(self, diagnosis: str, treatment_plan: str, patient_data: Dict[str, Any]) -> Dict[str, Any]:
        if not self.is_available():
            return self._fallback_outcome_prediction()
        
        try:
            prompt = f"""Predict patient outcome based on:

Diagnosis: {diagnosis}
Treatment Plan: {treatment_plan}

Patient Factors:
- Age: {patient_data.get('age', 'Unknown')}
- Genotype: {patient_data.get('genotype', 'Unknown')}
- Comorbidities: Based on symptoms - {patient_data.get('symptoms', 'Not specified')}

Please provide:
1. Expected recovery timeline
2. Success probability estimate
3. Risk factors for complications
4. Factors that may improve outcomes
5. Monitoring recommendations"""

            headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}; data = {"model": self.model,
                messages=[
                    {"role": "system", "content": "You are a clinical outcomes prediction specialist."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=600,
                temperature=0.3
            }; response = requests.post(self.api_url, headers=headers, json=data, timeout=30); response.raise_for_status(); return {"prediction": response.json()["choices"][0]["message"]["content"],
                "successRate": 0.75,
                "status": "success"
            }
        except Exception as e:
            return self._fallback_outcome_prediction()
    
    async def get_clinical_guidelines(self, condition: str) -> Dict[str, Any]:
        guidelines_db = {
            "hypertension": {
                "condition": "Hypertension",
                "guidelines": [
                    "Target BP < 130/80 mmHg for most adults",
                    "First-line medications: ACE inhibitors, ARBs, calcium channel blockers, thiazide diuretics",
                    "Lifestyle modifications: DASH diet, sodium restriction, regular exercise",
                    "Follow-up every 3-6 months once controlled"
                ],
                "references": ["JNC 8 Guidelines", "ACC/AHA 2017 Guidelines"]
            },
            "diabetes": {
                "condition": "Diabetes Mellitus",
                "guidelines": [
                    "Target HbA1c < 7% for most adults",
                    "Metformin as first-line therapy for type 2",
                    "Regular monitoring: HbA1c every 3 months, annual eye and foot exams",
                    "Cardiovascular risk assessment and management"
                ],
                "references": ["ADA Standards of Care 2024"]
            },
            "asthma": {
                "condition": "Asthma",
                "guidelines": [
                    "Stepwise approach to treatment",
                    "Short-acting beta-agonist for rescue",
                    "Inhaled corticosteroids for persistent asthma",
                    "Written asthma action plan for all patients"
                ],
                "references": ["GINA Guidelines 2024"]
            }
        }
        
        condition_lower = condition.lower()
        if condition_lower in guidelines_db:
            return guidelines_db[condition_lower]
        
        if self.is_available():
            try:
                prompt = f"Provide evidence-based clinical guidelines for managing {condition}. Include diagnostic criteria, treatment recommendations, and follow-up care."
                
                headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}; data = {"model": self.model,
                    messages=[
                        {"role": "system", "content": "You are a clinical guidelines specialist providing evidence-based recommendations."},
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=600,
                    temperature=0.3
                }; response = requests.post(self.api_url, headers=headers, json=data, timeout=30); response.raise_for_status(); return {"condition": condition,
                    "guidelines": response.json()["choices"][0]["message"]["content"],
                    "status": "success"
                }
            except Exception:
                pass
        
        return {
            "condition": condition,
            "guidelines": "Guidelines not found for this condition. Please consult current medical literature.",
            "status": "not_found"
        }
    
    def _fallback_drug_alternatives(self, drug_name: str) -> Dict[str, Any]:
        return {
            "originalDrug": drug_name,
            "alternatives": "AI service temporarily unavailable. Please consult with a pharmacist for drug alternatives.",
            "status": "fallback"
        }
    
    def _fallback_treatment_plan(self, diagnosis: str) -> Dict[str, Any]:
        return {
            "diagnosis": diagnosis,
            "treatmentPlan": "AI service temporarily unavailable. Please consult with a healthcare provider for treatment planning.",
            "status": "fallback"
        }
    
    def _fallback_outcome_prediction(self) -> Dict[str, Any]:
        return {
            "prediction": "Outcome prediction temporarily unavailable.",
            "successRate": None,
            "status": "fallback"
        }

