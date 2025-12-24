"""
Chat API endpoint for AI financial assistant
"""
from fastapi import APIRouter, HTTPException
import uuid
from app.models.schemas import ChatMessage, ChatResponse
from app.models.transaction import get_user_transactions
from app.models.user import get_user_by_id
from app.models.memory import search_similar_memories
from app.services.stats import StatsService
from app.config.gemini import get_gemini_model
from typing import List

router = APIRouter()
stats_service = StatsService()

def validate_uuid(user_id: str) -> None:
    """Validate that user_id is a valid UUID"""
    try:
        uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid user ID format. Expected UUID, got: {user_id}. Please log in again to get a valid user ID."
        )

@router.post("/message", response_model=ChatResponse)
async def chat(message: ChatMessage):
    """Chat with AI financial assistant"""
    try:
        # Validate UUID format
        validate_uuid(message.user_id)
        
        # Verify user exists
        user = get_user_by_id(message.user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get user transactions (last 90 days)
        transactions = get_user_transactions(message.user_id, days=90)
        
        # Get summary
        summary = stats_service.get_summary(transactions, days=90)
        
        # Search similar memories
        similar_memories = search_similar_memories(
            message.user_id,
            message.message,
            limit=5,
            threshold=0.6
        )
        
        # Build context
        context = _build_rag_context(
            transactions,
            summary,
            similar_memories
        )
        
        # Generate response with Gemini
        try:
            from app.config.settings import settings
            if not settings.is_gemini_enabled:
                response_text = "I'm currently unable to process requests due to API quota limits. Please try again later or contact support."
            else:
                model = get_gemini_model()
                
                prompt = f"""You are UPISensei, an AI financial assistant. Answer the user's question based on their transaction data.

USER'S FINANCIAL CONTEXT:
{context}

USER QUESTION: {message.message}

Provide a helpful, specific answer based on the data. If the question cannot be answered from the data, say so politely."""

                response = model.generate_content(prompt)
                response_text = response.text
        except Exception as e:
            error_str = str(e)
            if "429" in error_str or "quota" in error_str.lower() or "rate limit" in error_str.lower():
                response_text = "I'm currently experiencing high demand and cannot process your request right now. Please try again in a few minutes. In the meantime, you can view your transaction summary and charts above."
            else:
                response_text = f"I encountered an error processing your request: {str(e)}. Please try again."
        
        # Extract sources from similar memories
        sources = [
            mem.text[:100] + "..." if len(mem.text) > 100 else mem.text
            for mem in similar_memories[:3]
        ]
        
        return ChatResponse(
            response=response_text,
            sources=sources if sources else None
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing chat: {str(e)}")

def _build_rag_context(
    transactions: List,
    summary,
    similar_memories: List
) -> str:
    """Build RAG context for chat"""
    context_parts = []
    
    # Summary
    context_parts.append(f"Total Spent: ₹{summary.total_spent:,.0f}")
    context_parts.append(f"Total Income: ₹{summary.total_income:,.0f}")
    context_parts.append(f"Net Balance: ₹{summary.net_balance:,.0f}")
    context_parts.append(f"Transaction Count: {summary.transaction_count}")
    
    # Top categories
    if summary.categories:
        context_parts.append("\nTop Spending Categories:")
        for cat in summary.categories[:5]:
            context_parts.append(f"- {cat.category}: ₹{cat.amount:,.0f} ({cat.percentage:.1f}%)")
    
    # Top merchants
    if summary.top_merchants:
        context_parts.append("\nTop Merchants:")
        for merchant in summary.top_merchants[:5]:
            context_parts.append(f"- {merchant['merchant']}: ₹{merchant['amount']:,.0f} ({merchant['count']} transactions)")
    
    # Recent transactions
    if transactions:
        context_parts.append("\nRecent Transactions (last 10):")
        for txn in transactions[:10]:
            context_parts.append(
                f"- {txn.date.strftime('%Y-%m-%d')}: {txn.merchant or txn.raw_text[:50]} - ₹{txn.amount:,.0f} ({txn.category})"
            )
    
    # Similar memories
    if similar_memories:
        context_parts.append("\nRelevant Past Transactions:")
        for mem in similar_memories[:3]:
            context_parts.append(f"- {mem.text}")
    
    return "\n".join(context_parts)

