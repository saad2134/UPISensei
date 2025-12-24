"""
User model and database operations
"""
from typing import Optional
from datetime import datetime
from app.config.supabase import get_supabase_client
from app.models.schemas import UserCreate, UserResponse

def get_or_create_user(phone: str, name: Optional[str] = None) -> UserResponse:
    """Get existing user or create new one"""
    supabase = get_supabase_client()
    
    # Normalize phone number
    phone = normalize_phone(phone)
    
    # Check if user exists
    result = supabase.table("users").select("*").eq("phone", phone).execute()
    
    if result.data:
        user_data = result.data[0]
        return UserResponse(
            id=user_data["id"],
            phone=user_data["phone"],
            name=user_data.get("name"),
            created_at=datetime.fromisoformat(user_data["created_at"].replace("Z", "+00:00"))
        )
    
    # Create new user
    new_user = supabase.table("users").insert({
        "phone": phone,
        "name": name
    }).execute()
    
    user_data = new_user.data[0]
    return UserResponse(
        id=user_data["id"],
        phone=user_data["phone"],
        name=user_data.get("name"),
        created_at=datetime.fromisoformat(user_data["created_at"].replace("Z", "+00:00"))
    )

def get_user_by_id(user_id: str) -> Optional[UserResponse]:
    """Get user by ID"""
    supabase = get_supabase_client()
    result = supabase.table("users").select("*").eq("id", user_id).execute()
    
    if result.data:
        user_data = result.data[0]
        return UserResponse(
            id=user_data["id"],
            phone=user_data["phone"],
            name=user_data.get("name"),
            created_at=datetime.fromisoformat(user_data["created_at"].replace("Z", "+00:00"))
        )
    return None

def normalize_phone(phone: str) -> str:
    """Normalize phone number to standard format"""
    # Remove all non-digit characters
    digits = ''.join(filter(str.isdigit, phone))
    
    # Handle Indian phone numbers
    if len(digits) == 10:
        return f"+91{digits}"
    elif len(digits) == 12 and digits.startswith("91"):
        return f"+{digits}"
    elif digits.startswith("+91"):
        return digits
    
    return phone

