from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from server_py.db.session import get_db
from server_py.services.health_chatbot import HealthChatbot

router = APIRouter(prefix="/api/health-chatbot", tags=["health-chatbot"])

class ChatMessage(BaseModel):
    message: str
    conversation_history: Optional[List[dict]] = None

class HealthTipsRequest(BaseModel):
    category: Optional[str] = "general"

class ConditionExplanation(BaseModel):
    condition: str

@router.post("/chat")
def chat_with_bot(chat_data: ChatMessage):
    """
    Chat with the health AI assistant
    Available to all users (patients, doctors, nurses, etc.)
    """
    if not chat_data.message or not chat_data.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    
    try:
        chatbot = HealthChatbot()
        response = chatbot.chat(
            message=chat_data.message,
            conversation_history=chat_data.conversation_history
        )
        
        return {
            "response": response,
            "bot_name": "Dr. Tega"
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Chatbot error: {str(e)}")

@router.post("/health-tips")
def get_health_tips(request: HealthTipsRequest):
    """
    Get health tips for a specific category
    Categories: general, nutrition, exercise, mental_health, sleep, preventive
    """
    valid_categories = ["general", "nutrition", "exercise", "mental_health", "sleep", "preventive"]
    
    if request.category not in valid_categories:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid category. Choose from: {', '.join(valid_categories)}"
        )
    
    try:
        chatbot = HealthChatbot()
        tips = chatbot.get_health_tips(category=request.category)
        
        return {
            "category": request.category,
            "tips": tips
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating tips: {str(e)}")

@router.post("/explain-condition")
def explain_condition(request: ConditionExplanation):
    """
    Get a simple explanation of a medical condition
    """
    if not request.condition or not request.condition.strip():
        raise HTTPException(status_code=400, detail="Condition name cannot be empty")
    
    try:
        chatbot = HealthChatbot()
        explanation = chatbot.explain_condition(condition=request.condition)
        
        return {
            "condition": request.condition,
            "explanation": explanation
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error explaining condition: {str(e)}")

@router.get("/quick-questions")
def get_quick_questions():
    """
    Get a list of common health questions users can ask
    """
    return {
        "quick_questions": [
            "What are the symptoms of diabetes?",
            "How can I improve my sleep quality?",
            "What should I eat for a healthy heart?",
            "When should I see a doctor for a headache?",
            "How much water should I drink daily?",
            "What are the benefits of regular exercise?",
            "How can I manage stress better?",
            "What are the warning signs of high blood pressure?",
            "How can I boost my immune system?",
            "What is a healthy BMI range?"
        ]
    }

@router.get("/health")
def health_check():
    """Check if the chatbot service is available"""
    try:
        chatbot = HealthChatbot()
        return {
            "status": "healthy",
            "service": "Health Chatbot",
            "bot_name": "Dr. Tega",
            "available": True
        }
    except Exception as e:
        import traceback
        return {
            "status": "unhealthy",
            "service": "Health Chatbot",
            "available": False,
            "error": str(e),
            "traceback": traceback.format_exc()
        }
