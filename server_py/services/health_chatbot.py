import os
import requests
from typing import List, Dict

class HealthChatbot:
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.has_api_key = bool(self.api_key)
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
        # Fallback response if no API key
        if not self.has_api_key:
            return self._get_fallback_response(message)
        
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
    
    def _get_fallback_response(self, message: str) -> str:
        """Provide basic responses when OpenAI API is not available"""
        message_lower = message.lower()
        
        # Health tips responses
        if any(word in message_lower for word in ["tip", "advice", "suggest", "recommend"]):
            return """Here are some general health tips:

1. **Stay Hydrated**: Drink 8-10 glasses of water daily
2. **Balanced Diet**: Include fruits, vegetables, whole grains, and lean proteins
3. **Regular Exercise**: Aim for 30 minutes of moderate activity most days
4. **Quality Sleep**: Get 7-9 hours of sleep each night
5. **Stress Management**: Practice relaxation techniques like deep breathing or meditation
6. **Regular Check-ups**: Visit your doctor for preventive care

Remember to consult with a healthcare professional for personalized advice!"""
        
        # Symptom-related questions
        elif any(word in message_lower for word in ["symptom", "pain", "hurt", "sick", "feel"]):
            return """I understand you're concerned about symptoms. While I can provide general information, it's important to:

1. **Seek Professional Care**: For any persistent or severe symptoms, please consult a healthcare provider
2. **Emergency Signs**: If you experience chest pain, difficulty breathing, severe bleeding, or loss of consciousness, call emergency services immediately
3. **Document Symptoms**: Keep track of when symptoms started, their severity, and any triggers
4. **Don't Self-Diagnose**: Only a qualified healthcare professional can provide an accurate diagnosis

Would you like general information about maintaining good health instead?"""
        
        # Nutrition questions
        elif any(word in message_lower for word in ["eat", "food", "diet", "nutrition", "meal"]):
            return """Here are some nutrition guidelines:

**Healthy Eating Basics:**
- Fill half your plate with fruits and vegetables
- Choose whole grains over refined grains
- Include lean proteins (fish, poultry, beans, nuts)
- Limit processed foods, added sugars, and saturated fats
- Control portion sizes

**Hydration:**
- Drink water throughout the day
- Limit sugary drinks and excessive caffeine

**Meal Planning:**
- Eat regular meals
- Don't skip breakfast
- Plan healthy snacks

For personalized nutrition advice, consider consulting a registered dietitian!"""
        
        # Exercise questions
        elif any(word in message_lower for word in ["exercise", "workout", "fitness", "active", "gym"]):
            return """Exercise Guidelines:

**Getting Started:**
- Aim for 150 minutes of moderate activity per week
- Include both cardio and strength training
- Start slowly and gradually increase intensity
- Find activities you enjoy

**Types of Exercise:**
- **Cardio**: Walking, jogging, swimming, cycling
- **Strength**: Weight training, resistance bands, bodyweight exercises
- **Flexibility**: Stretching, yoga, tai chi
- **Balance**: Important for fall prevention, especially as we age

**Safety Tips:**
- Warm up before and cool down after exercise
- Stay hydrated
- Listen to your body
- Consult your doctor before starting a new exercise program

What specific aspect of fitness would you like to know more about?"""
        
        # Mental health
        elif any(word in message_lower for word in ["stress", "anxiety", "mental", "depression", "mood"]):
            return """Mental Health Support:

**Self-Care Strategies:**
- Practice mindfulness and meditation
- Maintain social connections
- Get regular exercise
- Ensure adequate sleep
- Limit alcohol and avoid drugs
- Engage in hobbies you enjoy

**When to Seek Help:**
If you're experiencing persistent sadness, anxiety, or thoughts of self-harm, please reach out to a mental health professional immediately.

**Resources:**
- Talk to your doctor
- Contact a therapist or counselor
- Call a mental health hotline if in crisis

Remember: Seeking help is a sign of strength, not weakness!"""
        
        # Default response
        else:
            return """Thank you for your question! I'm currently running in demo mode without full AI capabilities.

**I can help with:**
- General health tips
- Nutrition advice
- Exercise guidelines
- Mental health resources
- When to see a doctor

**For full AI-powered responses**, the system administrator needs to configure an OpenAI API key.

**For immediate medical concerns**, please:
- Contact your healthcare provider
- Call emergency services if it's urgent
- Visit an urgent care center for non-emergency issues

What specific health topic would you like to learn about?"""
    
    def get_health_tips(self, category: str = "general") -> str:
        """Get health tips for a specific category"""
        
        # Fallback tips if no API key
        if not self.has_api_key:
            return self._get_fallback_tips(category)
        
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
    
    def _get_fallback_tips(self, category: str) -> str:
        """Provide basic health tips when OpenAI API is not available"""
        tips = {
            "general": """**General Health Tips:**

1. **Stay Hydrated**: Drink 8-10 glasses of water daily to maintain proper body function
2. **Balanced Diet**: Include a variety of fruits, vegetables, whole grains, and lean proteins
3. **Regular Exercise**: Aim for at least 30 minutes of moderate activity most days
4. **Quality Sleep**: Get 7-9 hours of sleep each night for optimal health
5. **Preventive Care**: Schedule regular check-ups and screenings with your healthcare provider

Remember: Small, consistent changes lead to lasting health improvements!""",
            
            "nutrition": """**Nutrition Tips:**

1. **Eat the Rainbow**: Include colorful fruits and vegetables for diverse nutrients
2. **Portion Control**: Use smaller plates and be mindful of serving sizes
3. **Whole Grains**: Choose brown rice, quinoa, and whole wheat over refined grains
4. **Healthy Fats**: Include nuts, avocados, olive oil, and fatty fish
5. **Limit Processed Foods**: Reduce intake of added sugars, sodium, and saturated fats

Tip: Plan your meals ahead to make healthier choices easier!""",
            
            "exercise": """**Exercise & Fitness Tips:**

1. **Start Small**: Begin with 10-15 minutes daily and gradually increase
2. **Mix It Up**: Combine cardio, strength training, and flexibility exercises
3. **Find Your Joy**: Choose activities you enjoy to stay motivated
4. **Stay Consistent**: Schedule exercise like any important appointment
5. **Listen to Your Body**: Rest when needed and avoid overtraining

Remember: Any movement is better than none!""",
            
            "mental_health": """**Mental Health Tips:**

1. **Practice Mindfulness**: Take 5-10 minutes daily for meditation or deep breathing
2. **Stay Connected**: Maintain relationships with friends and family
3. **Set Boundaries**: Learn to say no and prioritize your wellbeing
4. **Seek Support**: Don't hesitate to talk to a professional if needed
5. **Self-Care Routine**: Engage in activities that bring you joy and relaxation

Remember: Your mental health is just as important as your physical health!""",
            
            "sleep": """**Sleep Quality Tips:**

1. **Consistent Schedule**: Go to bed and wake up at the same time daily
2. **Create a Routine**: Develop a relaxing bedtime ritual (reading, warm bath)
3. **Optimize Environment**: Keep bedroom cool, dark, and quiet
4. **Limit Screen Time**: Avoid devices 1 hour before bed
5. **Watch Caffeine**: Avoid caffeine 6 hours before bedtime

Tip: Your bedroom should be for sleep only - not work or entertainment!""",
            
            "preventive": """**Preventive Health Tips:**

1. **Regular Screenings**: Stay up-to-date with age-appropriate health screenings
2. **Vaccinations**: Keep immunizations current
3. **Know Your Numbers**: Monitor blood pressure, cholesterol, and blood sugar
4. **Healthy Lifestyle**: Don't smoke, limit alcohol, maintain healthy weight
5. **Early Detection**: Report any unusual symptoms to your doctor promptly

Remember: Prevention is always better than cure!"""
        }
        
        return tips.get(category, tips["general"])
    
    def explain_condition(self, condition: str) -> str:
        """Explain a medical condition in simple terms"""
        
        # Fallback if no API key
        if not self.has_api_key:
            return f"""I'd love to explain {condition} to you, but I'm currently running in demo mode without full AI capabilities.

**For accurate medical information about {condition}:**
- Consult with your healthcare provider
- Visit reputable medical websites (Mayo Clinic, WebMD, CDC)
- Schedule an appointment with a specialist if needed

**General Advice:**
- Don't self-diagnose based on internet research
- Keep track of your symptoms
- Seek professional medical advice for proper diagnosis and treatment

Would you like some general health tips instead?"""
        
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
