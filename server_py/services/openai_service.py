from typing import Dict, Any, Optional
import os
import json
import requests

OPENAI_AVAILABLE = True

class OpenAIService:
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.api_url = "https://api.openai.com/v1/chat/completions"
        self.model = "gpt-4o-mini"
    
    def is_available(self) -> bool:
        return self.api_key is not None
    
    async def get_diagnosis_assistance(self, symptoms: str, patient_data: Dict[str, Any]) -> Dict[str, Any]:
        if not self.is_available():
            return self._fallback_diagnosis(symptoms, patient_data)
        
        try:
            prompt = f"""As a medical AI assistant, analyze the following patient data and symptoms:

Patient Information:
- Age: {patient_data.get('age', 'Unknown')}
- Gender: {patient_data.get('gender', 'Unknown')}
- Blood Group: {patient_data.get('blood_group') or patient_data.get('bloodGroup', 'Unknown')}
- Genotype: {patient_data.get('genotype', 'Unknown')}
- Known Allergies: {patient_data.get('allergies', 'None reported')}

Vital Signs:
- Blood Pressure: {patient_data.get('bp_systolic') or patient_data.get('bloodPressureSystolic', 'Not recorded')}/{patient_data.get('bp_diastolic') or patient_data.get('bloodPressureDiastolic', 'Not recorded')} mmHg
- Heart Rate: {patient_data.get('heart_rate') or patient_data.get('heartRate', 'Not recorded')} bpm
- Temperature: {patient_data.get('temperature', 'Not recorded')}°C

Current Symptoms: {symptoms}

Please provide:
1. Possible diagnoses with confidence levels
2. Recommended tests
3. Treatment suggestions
4. Urgency assessment"""

            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are a medical AI assistant helping healthcare professionals with clinical decision support. Always recommend consulting with a qualified physician."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=1000,
                temperature=0.3
            )
            
            return {
                "analysis": response.choices[0].message.content,
                "model": "gpt-4",
                "status": "success"
            }
        except Exception as e:
            return self._fallback_diagnosis(symptoms, patient_data)
    
    async def analyze_lab_results(self, results: str, patient_data: Dict[str, Any]) -> Dict[str, Any]:
        if not self.is_available():
            return self._fallback_lab_analysis(results)
        
        try:
            prompt = f"""Analyze the following laboratory results for a patient:

Patient Context:
- Age: {patient_data.get('age', 'Unknown')}
- Gender: {patient_data.get('gender', 'Unknown')}

Lab Results:
{results}

Please provide:
1. Interpretation of each result (normal/abnormal)
2. Clinical significance
3. Recommended follow-up tests if any
4. Suggested actions"""

            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are a clinical laboratory specialist AI helping interpret lab results."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=800,
                temperature=0.3
            )
            
            return {
                "analysis": response.choices[0].message.content,
                "model": "gpt-4",
                "status": "success"
            }
        except Exception as e:
            return self._fallback_lab_analysis(results)
    
    async def chat_with_dr_tega(self, message: str, context: Optional[str] = None) -> str:
        if not self.is_available():
            return self._fallback_chat(message)
        
        try:
            system_prompt = """You are Dr. Tega, an AI-powered medical assistant for the Digital Doctors Assistant system. 
You help patients and healthcare providers with medical questions, appointment scheduling, and health information.
Always be professional, empathetic, and remind users to consult with qualified healthcare professionals for medical decisions.
You can help with:
- General health information
- Symptom assessment (not diagnosis)
- Medication information
- Appointment scheduling guidance
- Health tips and preventive care"""

            messages = [{"role": "system", "content": system_prompt}]
            
            if context:
                messages.append({"role": "system", "content": f"Context: {context}"})
            
            messages.append({"role": "user", "content": message})
            
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=messages,
                max_tokens=500,
                temperature=0.7
            )
            
            return response.choices[0].message.content
        except Exception as e:
            return self._fallback_chat(message)
    
    def _fallback_diagnosis(self, symptoms: str, patient_data: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "analysis": "AI analysis temporarily unavailable. Based on the symptoms provided, please consult with a healthcare professional for proper diagnosis.",
            "model": "fallback",
            "status": "fallback"
        }
    
    def _fallback_lab_analysis(self, results: str) -> Dict[str, Any]:
        return {
            "analysis": "AI lab analysis temporarily unavailable. Please have these results reviewed by a qualified laboratory specialist.",
            "model": "fallback",
            "status": "fallback"
        }
    
    def _fallback_chat(self, message: str) -> str:
        responses = {
            "hello": "Hello! I'm Dr. Tega, your AI medical assistant. How can I help you today?",
            "hi": "Hi there! I'm Dr. Tega. What can I assist you with?",
            "help": "I can help you with general health questions, appointment information, and health tips. What would you like to know?",
            "appointment": "To schedule an appointment, please use the appointment booking feature in the system or contact the front desk.",
            "emergency": "If this is a medical emergency, please call emergency services immediately or go to the nearest emergency room.",
        }
        
        message_lower = message.lower()
        for key, response in responses.items():
            if key in message_lower:
                return response
        
        return "Thank you for your message. For specific medical questions, I recommend consulting with a healthcare professional. Is there anything else I can help you with?"
