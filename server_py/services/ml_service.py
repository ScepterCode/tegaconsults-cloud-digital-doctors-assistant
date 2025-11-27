from typing import Dict, List, Any, Optional
import json

class MLHealthService:
    @staticmethod
    def calculate_health_risk_score(patient_data: Dict[str, Any]) -> int:
        score = 50
        
        bp_systolic = patient_data.get("bp_systolic") or patient_data.get("bloodPressureSystolic")
        bp_diastolic = patient_data.get("bp_diastolic") or patient_data.get("bloodPressureDiastolic")
        heart_rate = patient_data.get("heart_rate") or patient_data.get("heartRate")
        temperature = patient_data.get("temperature")
        age = patient_data.get("age", 0)
        genotype = patient_data.get("genotype", "AA")
        
        if bp_systolic:
            if bp_systolic > 140:
                score += 15
            elif bp_systolic > 130:
                score += 10
            elif bp_systolic < 90:
                score += 10
        
        if bp_diastolic:
            if bp_diastolic > 90:
                score += 10
            elif bp_diastolic < 60:
                score += 5
        
        if heart_rate:
            if heart_rate > 100:
                score += 10
            elif heart_rate < 50:
                score += 10
        
        if temperature:
            temp_val = float(temperature) if isinstance(temperature, str) else temperature
            if temp_val > 38.5:
                score += 15
            elif temp_val > 37.5:
                score += 8
            elif temp_val < 35.5:
                score += 12
        
        if age > 65:
            score += 15
        elif age > 50:
            score += 10
        elif age > 40:
            score += 5
        
        if genotype in ["SS", "SC"]:
            score += 20
        elif genotype == "AS":
            score += 5
        
        return min(100, max(0, score))
    
    @staticmethod
    def get_risk_level(score: int) -> str:
        if score >= 75:
            return "CRITICAL"
        elif score >= 50:
            return "HIGH"
        elif score >= 30:
            return "MODERATE"
        return "LOW"
    
    @staticmethod
    def get_risk_factors(patient_data: Dict[str, Any]) -> List[str]:
        factors = []
        
        bp_systolic = patient_data.get("bp_systolic") or patient_data.get("bloodPressureSystolic")
        bp_diastolic = patient_data.get("bp_diastolic") or patient_data.get("bloodPressureDiastolic")
        heart_rate = patient_data.get("heart_rate") or patient_data.get("heartRate")
        temperature = patient_data.get("temperature")
        age = patient_data.get("age", 0)
        genotype = patient_data.get("genotype", "AA")
        
        if bp_systolic and bp_systolic > 140:
            factors.append("High blood pressure (hypertension)")
        
        if bp_diastolic and bp_diastolic > 90:
            factors.append("Elevated diastolic pressure")
        
        if heart_rate:
            if heart_rate > 100:
                factors.append("Tachycardia (elevated heart rate)")
            elif heart_rate < 50:
                factors.append("Bradycardia (low heart rate)")
        
        if temperature:
            temp_val = float(temperature) if isinstance(temperature, str) else temperature
            if temp_val > 38.5:
                factors.append("High fever")
            elif temp_val > 37.5:
                factors.append("Low-grade fever")
        
        if age > 65:
            factors.append("Advanced age (>65 years)")
        
        if genotype in ["SS", "SC"]:
            factors.append(f"Sickle cell condition ({genotype})")
        
        return factors
    
    @staticmethod
    def suggest_diagnosis(patient_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        diagnoses = []
        symptoms = patient_data.get("symptoms", "")
        
        if symptoms:
            symptom_list = symptoms.lower().split(",") if isinstance(symptoms, str) else []
            
            if any("fever" in s or "temperature" in s for s in symptom_list):
                diagnoses.append({
                    "condition": "Possible Infection",
                    "confidence": 0.7,
                    "symptoms": ["fever", "elevated temperature"],
                    "severity": "moderate"
                })
            
            if any("headache" in s or "head pain" in s for s in symptom_list):
                diagnoses.append({
                    "condition": "Tension Headache",
                    "confidence": 0.6,
                    "symptoms": ["headache"],
                    "severity": "mild"
                })
            
            if any("cough" in s for s in symptom_list):
                diagnoses.append({
                    "condition": "Upper Respiratory Infection",
                    "confidence": 0.65,
                    "symptoms": ["cough"],
                    "severity": "mild"
                })
        
        return diagnoses
    
    @staticmethod
    def prescribe_drugs(diagnoses: List[Dict[str, Any]], patient_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        prescriptions = []
        allergies = patient_data.get("allergies", "").lower() if patient_data.get("allergies") else ""
        
        for diagnosis in diagnoses:
            condition = diagnosis.get("condition", "").lower()
            
            if "infection" in condition or "fever" in condition:
                if "paracetamol" not in allergies and "acetaminophen" not in allergies:
                    prescriptions.append({
                        "drugName": "Paracetamol",
                        "dosage": "500mg",
                        "frequency": "Every 6 hours",
                        "duration": "3-5 days",
                        "indication": "Fever and pain relief",
                        "contraindications": ["Liver disease", "Alcohol use disorder"],
                        "sideEffects": ["Nausea", "Allergic reactions (rare)"]
                    })
            
            if "headache" in condition:
                if "ibuprofen" not in allergies:
                    prescriptions.append({
                        "drugName": "Ibuprofen",
                        "dosage": "400mg",
                        "frequency": "Every 8 hours",
                        "duration": "As needed (max 5 days)",
                        "indication": "Headache and inflammation",
                        "contraindications": ["Peptic ulcer", "Kidney disease"],
                        "sideEffects": ["Stomach upset", "Dizziness"]
                    })
            
            if "respiratory" in condition or "cough" in condition:
                prescriptions.append({
                    "drugName": "Dextromethorphan",
                    "dosage": "15mg",
                    "frequency": "Every 6-8 hours",
                    "duration": "5-7 days",
                    "indication": "Cough suppressant",
                    "contraindications": ["MAO inhibitors use"],
                    "sideEffects": ["Drowsiness", "Dizziness"]
                })
        
        return prescriptions
    
    @staticmethod
    def generate_health_assessment(patient_data: Dict[str, Any]) -> Dict[str, Any]:
        score = MLHealthService.calculate_health_risk_score(patient_data)
        risk_level = MLHealthService.get_risk_level(score)
        risk_factors = MLHealthService.get_risk_factors(patient_data)
        diagnoses = MLHealthService.suggest_diagnosis(patient_data)
        prescriptions = MLHealthService.prescribe_drugs(diagnoses, patient_data)
        
        bp_systolic = patient_data.get("bp_systolic") or patient_data.get("bloodPressureSystolic")
        bp_diastolic = patient_data.get("bp_diastolic") or patient_data.get("bloodPressureDiastolic")
        heart_rate = patient_data.get("heart_rate") or patient_data.get("heartRate")
        temperature = patient_data.get("temperature")
        weight = patient_data.get("weight")
        age = patient_data.get("age")
        genotype = patient_data.get("genotype")
        
        bp_analysis = "Normal" if bp_systolic and bp_systolic < 130 else "Elevated" if bp_systolic else "Not measured"
        hr_analysis = "Normal" if heart_rate and 60 <= heart_rate <= 100 else "Abnormal" if heart_rate else "Not measured"
        temp_analysis = "Normal" if temperature and 36.1 <= float(temperature) <= 37.2 else "Abnormal" if temperature else "Not measured"
        weight_analysis = f"{weight}kg recorded" if weight else "Not measured"
        age_analysis = f"Age {age} years - appropriate monitoring needed" if age else "Age not provided"
        genotype_benefit = f"Genotype {genotype} noted for treatment considerations" if genotype else "Genotype not provided"
        
        recommendations = [
            {
                "category": "Lifestyle",
                "recommendation": "Maintain regular exercise and balanced diet",
                "priority": "medium",
                "action": "Schedule follow-up in 2 weeks"
            }
        ]
        
        if risk_level in ["HIGH", "CRITICAL"]:
            recommendations.append({
                "category": "Medical",
                "recommendation": "Immediate medical consultation recommended",
                "priority": "high",
                "action": "Book urgent appointment"
            })
        
        return {
            "healthRiskScore": score,
            "riskLevel": risk_level,
            "riskFactors": risk_factors,
            "suggestedDiagnosis": diagnoses,
            "recommendations": recommendations,
            "prescribedDrugs": prescriptions,
            "analysisDetails": {
                "bpAnalysis": bp_analysis,
                "heartRateAnalysis": hr_analysis,
                "temperatureAnalysis": temp_analysis,
                "weightAnalysis": weight_analysis,
                "ageRiskAnalysis": age_analysis,
                "genotypeBenefit": genotype_benefit
            }
        }
