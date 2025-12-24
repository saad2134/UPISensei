"""
Memory service for storing and retrieving transaction memories
"""
from typing import List
from app.models.memory import create_memory_vector, MemoryVectorCreate
from app.services.embeddings import get_embedding
from app.models.schemas import TransactionResponse

class MemoryService:
    """Service for managing user financial memories"""
    
    def store_transaction_memory(
        self,
        user_id: str,
        transaction: TransactionResponse
    ) -> None:
        """Store transaction as a memory vector"""
        # Create memory text
        memory_text = (
            f"Transaction: {transaction.merchant or transaction.raw_text} "
            f"Amount: ₹{transaction.amount} "
            f"Category: {transaction.category} "
            f"Type: {transaction.type} "
            f"Date: {transaction.date.strftime('%Y-%m-%d')}"
        )
        
        # Get embedding
        embedding = get_embedding(memory_text)
        
        # Store in database
        memory = MemoryVectorCreate(
            user_id=user_id,
            text=memory_text,
            metadata={
                "transaction_id": transaction.id,
                "category": transaction.category,
                "merchant": transaction.merchant,
                "amount": transaction.amount,
                "type": transaction.type,
                "date": transaction.date.isoformat()
            }
        )
        
        create_memory_vector(memory, embedding)
    
    def store_batch_memories(
        self,
        user_id: str,
        transactions: List[TransactionResponse]
    ) -> None:
        """Store multiple transactions as memories"""
        for transaction in transactions:
            try:
                self.store_transaction_memory(user_id, transaction)
            except Exception as e:
                print(f"Error storing memory for transaction {transaction.id}: {e}")
                continue

