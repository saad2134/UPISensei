"""
Memory vector model and database operations
"""
from typing import List, Optional, Dict, Any
from app.config.supabase import get_supabase_client
from app.models.schemas import MemoryVectorCreate, MemoryVectorResponse
from app.services.embeddings import get_embedding

def create_memory_vector(memory: MemoryVectorCreate, embedding: List[float]) -> MemoryVectorResponse:
    """Create a new memory vector"""
    supabase = get_supabase_client()
    
    result = supabase.table("memory_vectors").insert({
        "user_id": memory.user_id,
        "text": memory.text,
        "embedding": embedding,
        "metadata": memory.metadata or {}
    }).execute()
    
    item = result.data[0]
    return MemoryVectorResponse(
        id=item["id"],
        user_id=item["user_id"],
        text=item["text"],
        metadata=item.get("metadata")
    )

def search_similar_memories(
    user_id: str,
    query_text: str,
    limit: int = 5,
    threshold: float = 0.7
) -> List[MemoryVectorResponse]:
    """Search for similar memories using vector similarity"""
    supabase = get_supabase_client()
    
    # Get embedding for query
    query_embedding = get_embedding(query_text)
    
    # Perform vector similarity search
    # Note: This requires pgvector extension in Supabase
    result = supabase.rpc(
        "match_memory_vectors",
        {
            "query_embedding": query_embedding,
            "match_user_id": user_id,
            "match_threshold": threshold,
            "match_count": limit
        }
    ).execute()
    
    return [
        MemoryVectorResponse(
            id=item["id"],
            user_id=item["user_id"],
            text=item["text"],
            metadata=item.get("metadata")
        )
        for item in result.data
    ]

def get_user_memories(user_id: str, limit: Optional[int] = None) -> List[MemoryVectorResponse]:
    """Get all memories for a user"""
    supabase = get_supabase_client()
    
    query = supabase.table("memory_vectors").select("*").eq("user_id", user_id)
    
    if limit:
        query = query.limit(limit)
    
    result = query.execute()
    
    return [
        MemoryVectorResponse(
            id=item["id"],
            user_id=item["user_id"],
            text=item["text"],
            metadata=item.get("metadata")
        )
        for item in result.data
    ]

