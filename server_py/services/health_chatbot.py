import os
import requests
from typing import List, Dict

class HealthChatbot:
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY not found in environment variables")
        self.model = "gpt-4o-mini"
        self.api_url = "https://api.openai.com/v1/chat/completions"
        
        self.system_prompt = """You are Dr. Tega, a friendly and knowledgeable AI health assistant for the Digital Doctors Assistant platform.

Your role:
- Answer general health questions in a clear, accessible way
- Provide health education and wellness tips
- Explain medical terms and conditions
- Offer preventive health advice
- Discuss symptoms and when to seek medical care

Important guidelines:
- Always be empathetic and supportive
- Use simple language that anyone can understand
- For serious symptoms, always recommend seeing a healthcare provider
- Never provide specific diagnoses or prescribe medications
- Clarify that you're an AI assistant, not a replacement for professional medical care
- Be culturally sensitive and inclusive
- If asked about emergencies, immediately advise calling emergency services

You can discuss:
✓ General health information
✓ Healthy lifestyle tips
✓ Common symptoms and conditions
✓ Preventive care
✓ Nutrition and exercise
✓ Mental health basics
✓ When to see a doctor

You should NOT:
✗ Diagnose specific conditions
✗ Prescribe medications
✗ Replace professional medical advice
✗ Handle medical emergencies (direct to emergency services)

Be warm, helpful, and always prioritize user safety."""
    
    def chat(self, message: str, conversation_history: List[Dict] = None) -> str:
        """
        Process a chat message and return a response
        
        Args:
            message: User's message
            conversation_history: List of previous messages [{"role": "user/assistant", "content": "..."}]
        
        Returns:
            AI response
        """
        try:
            messages = [{"role": "system", "content": self.system_prompt}]
            
            # Add conversation history if provided
            if conversation_history:
                messages.extend(conversation_history[-10:])  # Keep last 10 messages for context
            
            # Add current message
            messages.append({"role": "user", "content": message})
            
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            data = {
                "model": self.model,
                "messages": messages,
                "temperature": 0.7,
                "max_tokens": 800
            }
            
            response = requests.post(self.api_url, headers=headers, json=data, timeout=30)
            response.raise_for_status()
            
            return response.json()["choices"][0]["message"]["content"]
        
        except Exception as e:
            return f"I apologize, but I'm having trouble processing your request right now. Please try again. Error: {str(e)}"
    
    def get_health_tips(self, category: str = "general") -> str:
        """Get health tips for a specific category"""
        
        prompts = {
            "general": "Provide 5 practical general health and wellness tips for maintaining good health.",
            "nutrition": "Provide 5 evidence-based nutrition tips for a healthy diet.",
            "exercise": "Provide 5 practical exercise and fitness tips for staying active.",
            "mental_health": "Provide 5 tips for maintaining good mental health and emotional wellbeing.",
            "sleep": "Provide 5 tips for improving sleep quality and establishing healthy sleep habits.",
            "preventive": "Provide 5 preventive health tips for disease prevention and early detection."
        }
        
        prompt = prompts.get(category, prompts["general"])
        
        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            data = {
                "model": self.model,
                "messages": [
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.7,
                "max_tokens": 600
            }
            
            response = requests.post(self.api_url, headers=headers, json=data, timeout=30)
            response.raise_for_status()
            
            return response.json()["choices"][0]["message"]["content"]
        
        except Exception as e:
            return f"Unable to generate health tips at this time. Error: {str(e)}"
    
    def explain_condition(self, condition: str) -> str:
        """Explain a medical condition in simple terms"""
        
        prompt = f"""Explain {condition} in simple, easy-to-understand language. Include:
1. What it is
2. Common symptoms
3. Possible causes
4. When to see a doctor
5. General management tips (if applicable)

Keep it informative but accessible to non-medical people."""
        
        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            data = {
                "model": self.model,
                "messages": [
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.6,
                "max_tokens": 700
            }
            
            response = requests.post(self.api_url, headers=headers, json=data, timeout=30)
            response.raise_for_status()
            
            return response.json()["choices"][0]["message"]["content"]
        
        except Exception as e:
            return f"Unable to explain this condition at this time. Error: {str(e)}"
