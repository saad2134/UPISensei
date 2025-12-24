"""
Transaction model and database operations
"""
from typing import List, Optional
from datetime import datetime, timedelta
from app.config.supabase import get_supabase_client
from app.models.schemas import TransactionCreate, TransactionResponse

def create_transactions(transactions: List[TransactionCreate]) -> List[TransactionResponse]:
    """Bulk insert transactions"""
    supabase = get_supabase_client()
    
    transaction_data = [
        {
            "user_id": txn.user_id,
            "date": txn.date.isoformat(),
            "amount": txn.amount,
            "type": txn.type,
            "merchant": txn.merchant,
            "category": txn.category,
            "raw_text": txn.raw_text
        }
        for txn in transactions
    ]
    
    result = supabase.table("transactions").insert(transaction_data).execute()
    
    return [
        TransactionResponse(
            id=item["id"],
            user_id=item["user_id"],
            date=datetime.fromisoformat(item["date"].replace("Z", "+00:00")),
            amount=item["amount"],
            type=item["type"],
            merchant=item.get("merchant"),
            category=item["category"],
            raw_text=item["raw_text"],
            created_at=datetime.fromisoformat(item["created_at"].replace("Z", "+00:00"))
        )
        for item in result.data
    ]

def get_user_transactions(
    user_id: str,
    limit: Optional[int] = None,
    days: Optional[int] = None
) -> List[TransactionResponse]:
    """Get transactions for a user"""
    supabase = get_supabase_client()
    
    query = supabase.table("transactions").select("*").eq("user_id", user_id)
    
    if days:
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        query = query.gte("date", cutoff_date.isoformat())
    
    query = query.order("date", desc=True)
    
    if limit:
        query = query.limit(limit)
    
    result = query.execute()
    
    return [
        TransactionResponse(
            id=item["id"],
            user_id=item["user_id"],
            date=datetime.fromisoformat(item["date"].replace("Z", "+00:00")),
            amount=item["amount"],
            type=item["type"],
            merchant=item.get("merchant"),
            category=item["category"],
            raw_text=item["raw_text"],
            created_at=datetime.fromisoformat(item["created_at"].replace("Z", "+00:00"))
        )
        for item in result.data
    ]

def get_transactions_by_category(
    user_id: str,
    category: str,
    days: Optional[int] = None
) -> List[TransactionResponse]:
    """Get transactions filtered by category"""
    supabase = get_supabase_client()
    
    query = supabase.table("transactions").select("*").eq("user_id", user_id).eq("category", category)
    
    if days:
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        query = query.gte("date", cutoff_date.isoformat())
    
    result = query.order("date", desc=True).execute()
    
    return [
        TransactionResponse(
            id=item["id"],
            user_id=item["user_id"],
            date=datetime.fromisoformat(item["date"].replace("Z", "+00:00")),
            amount=item["amount"],
            type=item["type"],
            merchant=item.get("merchant"),
            category=item["category"],
            raw_text=item["raw_text"],
            created_at=datetime.fromisoformat(item["created_at"].replace("Z", "+00:00"))
        )
        for item in result.data
    ]

