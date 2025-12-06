import os
import requests
from typing import Dict, List, Optional
import json

class AIClinicalAssistant:
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY not found in environment variables")
        self.model = "gpt-4o-mini"
        self.api_url = "https://api.openai.com/v1/chat/completions"
    
    def summarize_patient_history(self, patient_data: Dict, notes: List[Dict], lab_results: List[Dict]) -> str:
        """Generate a comprehensive summary of patient's medical history"""
        
        prompt = f"""You are an expert medical AI assistant helping doctors analyze patient data.

Patient Information:
- Name: {patient_data.get('firstName')} {patient_data.get('lastName')}
- Age: {patient_data.get('age')} years
- Gender: {patient_data.get('gender')}
- Blood Group: {patient_data.get('bloodGroup')}
- Genotype: {patient_data.get('genotype')}
- Allergies: {patient_data.get('allergies', 'None reported')}

Recent Vitals:
- Blood Pressure: {patient_data.get('bpSystolic')}/{patient_data.get('bpDiastolic')} mmHg
- Temperature: {patient_data.get('temperature')}
- Heart Rate: {patient_data.get('heartRate')} bpm
- Weight: {patient_data.get('weight')}

Doctor's Notes ({len(notes)} notes):
{self._format_notes(notes)}

Lab Results ({len(lab_results)} results):
{self._format_lab_results(lab_results)}

Please provide:
1. A concise summary of the patient's medical history
2. Key patterns or trends in their health
3. Notable findings from lab results
4. Any concerning symptoms or conditions that need attention

Keep the summary professional, clear, and actionable for the treating physician."""

        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            data = {
                "model": self.model,
                "messages": [
                    {"role": "system", "content": "You are an expert medical AI assistant providing clinical insights to doctors."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.3,
                "max_tokens": 1000
            }
            response = requests.post(self.api_url, headers=headers, json=data, timeout=30)
            response.raise_for_status()
            return response.json()["choices"][0]["message"]["content"]
        except Exception as e:
            return f"Error generating summary: {str(e)}"
    
    def analyze_lab_results(self, lab_results: List[Dict], patient_data: Dict) -> str:
        """Analyze lab results and provide clinical insights"""
        
        prompt = f"""You are an expert medical AI assistant analyzing laboratory results.

Patient: {patient_data.get('firstName')} {patient_data.get('lastName')}, {patient_data.get('age')} years old, {patient_data.get('gender')}

Laboratory Results:
{self._format_lab_results(lab_results)}

Please provide:
1. Analysis of each test result (normal/abnormal)
2. Clinical significance of abnormal findings
3. Potential diagnoses or conditions suggested by the results
4. Recommended follow-up tests or actions
5. Any urgent concerns that require immediate attention

Be specific, evidence-based, and actionable."""

        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            data = {
                "model": self.model,
                "messages": [
                    {"role": "system", "content": "You are an expert medical AI assistant specializing in laboratory result interpretation."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.3,
                "max_tokens": 1200
            }
            response = requests.post(self.api_url, headers=headers, json=data, timeout=30)
            response.raise_for_status()
            return response.json()["choices"][0]["message"]["content"]
        except Exception as e:
            return f"Error analyzing lab results: {str(e)}"
    
    def generate_treatment_recommendations(self, patient_data: Dict, diagnosis: str, notes: List[Dict]) -> str:
        """Generate treatment recommendations based on patient data and diagnosis"""
        
        prompt = f"""You are an expert medical AI assistant providing treatment recommendations.

Patient Information:
- Age: {patient_data.get('age')} years
- Gender: {patient_data.get('gender')}
- Allergies: {patient_data.get('allergies', 'None')}
- Current Symptoms: {patient_data.get('symptoms', 'Not specified')}

Diagnosis/Condition: {diagnosis}

Recent Clinical Notes:
{self._format_notes(notes[:5])}

Please provide:
1. Evidence-based treatment recommendations
2. Medication suggestions (considering allergies)
3. Lifestyle modifications
4. Follow-up schedule
5. Warning signs to watch for
6. Patient education points

Note: These are suggestions to assist the physician. Final treatment decisions should be made by the treating doctor."""

        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            data = {
                "model": self.model,
                "messages": [
                    {"role": "system", "content": "You are an expert medical AI assistant providing treatment recommendations to support clinical decision-making."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.4,
                "max_tokens": 1200
            }
            response = requests.post(self.api_url, headers=headers, json=data, timeout=30)
            response.raise_for_status()
            return response.json()["choices"][0]["message"]["content"]
        except Exception as e:
            return f"Error generating recommendations: {str(e)}"
    
    def identify_risk_factors(self, patient_data: Dict, notes: List[Dict], lab_results: List[Dict]) -> str:
        """Identify potential health risk factors"""
        
        prompt = f"""You are an expert medical AI assistant identifying health risk factors.

Patient Profile:
- Age: {patient_data.get('age')} years
- Gender: {patient_data.get('gender')}
- Blood Group: {patient_data.get('bloodGroup')}
- Genotype: {patient_data.get('genotype')}
- Allergies: {patient_data.get('allergies', 'None')}

Vitals:
- BP: {patient_data.get('bpSystolic')}/{patient_data.get('bpDiastolic')} mmHg
- Heart Rate: {patient_data.get('heartRate')} bpm
- Weight: {patient_data.get('weight')}

Clinical History:
{self._format_notes(notes)}

Lab Results:
{self._format_lab_results(lab_results)}

Please identify:
1. Current health risk factors
2. Potential future health concerns
3. Preventive measures recommended
4. Lifestyle risk factors
5. Genetic or hereditary considerations
6. Priority level for each risk (High/Medium/Low)

Be thorough and evidence-based."""

        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            data = {
                "model": self.model,
                "messages": [
                    {"role": "system", "content": "You are an expert medical AI assistant specializing in risk assessment and preventive medicine."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.3,
                "max_tokens": 1200
            }
            response = requests.post(self.api_url, headers=headers, json=data, timeout=30)
            response.raise_for_status()
            return response.json()["choices"][0]["message"]["content"]
        except Exception as e:
            return f"Error identifying risk factors: {str(e)}"
    
    def answer_clinical_question(self, question: str, patient_context: Optional[Dict] = None) -> str:
        """Answer specific clinical questions about a patient"""
        
        context = ""
        if patient_context:
            context = f"""
Patient Context:
- Age: {patient_context.get('age')} years
- Gender: {patient_context.get('gender')}
- Current Symptoms: {patient_context.get('symptoms', 'Not specified')}
- Allergies: {patient_context.get('allergies', 'None')}
"""
        
        prompt = f"""{context}

Clinical Question: {question}

Please provide a clear, evidence-based answer that helps the physician make informed decisions."""

        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            data = {
                "model": self.model,
                "messages": [
                    {"role": "system", "content": "You are an expert medical AI assistant answering clinical questions for physicians."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.3,
                "max_tokens": 800
            }
            response = requests.post(self.api_url, headers=headers, json=data, timeout=30)
            response.raise_for_status()
            return response.json()["choices"][0]["message"]["content"]
        except Exception as e:
            return f"Error answering question: {str(e)}"
    
    def _format_notes(self, notes: List[Dict]) -> str:
        """Format doctor notes for AI processing"""
        if not notes:
            return "No clinical notes available."
        
        formatted = []
        for note in notes[:10]:  # Limit to recent 10 notes
            formatted.append(f"- [{note.get('noteType', 'Note')}] {note.get('title', '')}: {note.get('content', '')[:200]}")
        return "\n".join(formatted)
    
    def _format_lab_results(self, lab_results: List[Dict]) -> str:
        """Format lab results for AI processing"""
        if not lab_results:
            return "No lab results available."
        
        formatted = []
        for result in lab_results[:10]:  # Limit to recent 10 results
            formatted.append(f"- {result.get('testName', 'Test')}: {result.get('result', 'N/A')} (Status: {result.get('status', 'Unknown')})")
        return "\n".join(formatted)
    
    def summarize_patient_files(self, files: List[Dict], patient_data: Dict) -> str:
        """Generate AI summary of patient's medical files and documents"""
        
        prompt = f"""You are an expert medical AI assistant reviewing a patient's medical records folder.

Patient Information:
- Name: {patient_data.get('firstName')} {patient_data.get('lastName')}
- Age: {patient_data.get('age')} years
- Gender: {patient_data.get('gender')}
- Blood Group: {patient_data.get('bloodGroup')}
- Genotype: {patient_data.get('genotype')}

Medical Files in Folder ({len(files)} files):
{self._format_files(files)}

Please provide a concise summary (3-5 sentences) covering:
1. Overview of the types of medical documents available
2. Key findings or patterns across the documents
3. Any notable test results or diagnoses mentioned
4. Completeness of the medical record (what's present/missing)

Keep it brief, professional, and actionable for the treating physician."""

        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            data = {
                "model": self.model,
                "messages": [
                    {"role": "system", "content": "You are an expert medical AI assistant helping doctors review patient medical records."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.3,
                "max_tokens": 500
            }
            response = requests.post(self.api_url, headers=headers, json=data, timeout=30)
            response.raise_for_status()
            return response.json()["choices"][0]["message"]["content"]
        except Exception as e:
            return f"Error generating files summary: {str(e)}"
    
    def _format_files(self, files: List[Dict]) -> str:
        """Format patient files for AI processing"""
        if not files:
            return "No files available."
        
        formatted = []
        for file in files:
            file_info = f"- {file.get('file_type', 'Document')}: {file.get('file_name', 'Unnamed')}"
            if file.get('description'):
                file_info += f" - {file.get('description')}"
            if file.get('uploaded_at'):
                file_info += f" (Uploaded: {file.get('uploaded_at')[:10]})"
            formatted.append(file_info)
        return "\n".join(formatted)

