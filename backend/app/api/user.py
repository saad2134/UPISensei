"""
User API endpoints
"""
from fastapi import APIRouter, HTTPException
import uuid
from app.models.user import get_user_by_id, get_or_create_user
from app.models.transaction import get_user_transactions
from app.models.schemas import UserResponse
from typing import Optional

router = APIRouter()

def validate_uuid(user_id: str) -> None:
    """Validate that user_id is a valid UUID"""
    try:
        uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid user ID format. Expected UUID, got: {user_id}"
        )

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: str):
    """Get user by ID"""
    validate_uuid(user_id)
    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.get("/phone/{phone}", response_model=UserResponse)
async def get_user_by_phone(phone: str):
    """Get or create user by phone number"""
    user = get_or_create_user(phone)
    return user

@router.get("/{user_id}/transactions")
async def get_user_transactions_endpoint(
    user_id: str,
    limit: Optional[int] = 100,
    days: Optional[int] = None
):
    """Get user transactions"""
    validate_uuid(user_id)
    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    transactions = get_user_transactions(user_id, limit=limit, days=days)
    
    return {
        "user_id": user_id,
        "count": len(transactions),
        "transactions": [
            {
                "id": t.id,
                "date": t.date.isoformat(),
                "amount": t.amount,
                "type": t.type,
                "merchant": t.merchant,
                "category": t.category,
                "raw_text": t.raw_text
            }
            for t in transactions
        ]
    }

