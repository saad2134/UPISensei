"""
Analysis and analytics API endpoints
"""
from fastapi import APIRouter, HTTPException
from typing import Optional
import uuid
from app.models.transaction import get_user_transactions
from app.models.user import get_user_by_id
from app.services.stats import StatsService
from app.services.insights import InsightsService
from app.models.schemas import AnalysisResponse

router = APIRouter()
stats_service = StatsService()
insights_service = InsightsService()

def validate_uuid(user_id: str) -> None:
    """Validate that user_id is a valid UUID"""
    try:
        uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid user ID format. Expected UUID, got: {user_id}. Please log in again to get a valid user ID."
        )

@router.get("/summary/{user_id}", response_model=AnalysisResponse)
async def get_analysis(
    user_id: str,
    days: Optional[int] = 30
):
    """Get comprehensive analysis for a user"""
    try:
        # Validate UUID format
        validate_uuid(user_id)
        
        # Verify user exists
        user = get_user_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get transactions
        transactions = get_user_transactions(user_id, days=days)
        
        # If no transactions, return empty analysis instead of error
        if not transactions:
            from app.models.schemas import SpendingSummary, CategorySummary
            empty_summary = SpendingSummary(
                total_spent=0.0,
                total_income=0.0,
                net_balance=0.0,
                transaction_count=0,
                categories=[],
                top_merchants=[],
                date_range={"start": "", "end": ""}
            )
            return AnalysisResponse(
                summary=empty_summary,
                insights=[],
                trends={"period": "monthly", "data": []}
            )
        
        # Get summary
        summary = stats_service.get_summary(transactions, days=days)
        
        # Get insights
        insights = insights_service.generate_insights(transactions, user_id)
        
        # Get trends
        trends = stats_service.get_trends(transactions, period="monthly")
        
        return AnalysisResponse(
            summary=summary,
            insights=insights,
            trends=trends
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating analysis: {str(e)}")

@router.get("/trends/{user_id}")
async def get_trends(
    user_id: str,
    period: str = "monthly",
    days: Optional[int] = 90
):
    """Get spending trends"""
    try:
        # Validate UUID format
        validate_uuid(user_id)
        
        user = get_user_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        transactions = get_user_transactions(user_id, days=days)
        trends = stats_service.get_trends(transactions, period=period)
        
        return trends
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting trends: {str(e)}")

@router.get("/category/{user_id}")
async def get_category_breakdown(
    user_id: str,
    days: Optional[int] = 30
):
    """Get category breakdown"""
    try:
        # Validate UUID format
        validate_uuid(user_id)
        
        user = get_user_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        transactions = get_user_transactions(user_id, days=days)
        breakdown = stats_service.get_category_breakdown(transactions)
        
        return breakdown
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting category breakdown: {str(e)}")

