"""
Google Gemini AI configuration
"""
import google.generativeai as genai
from app.config.settings import settings

genai.configure(api_key=settings.GEMINI_API_KEY)

def get_gemini_model(model_name: str = "gemini-2.0-flash-exp"):
    """Get Gemini model instance"""
    return genai.GenerativeModel(model_name)

