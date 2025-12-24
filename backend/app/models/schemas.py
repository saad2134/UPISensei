"""
Pydantic schemas for request/response validation
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

# User schemas
class UserBase(BaseModel):
    phone: str
    name: Optional[str] = None

class UserCreate(UserBase):
    pass

class UserResponse(UserBase):
    id: str
    created_at: datetime
    
    class Config:
        from_attributes = True

# Transaction schemas
class TransactionBase(BaseModel):
    date: datetime
    amount: float
    type: str  # debit/credit
    merchant: Optional[str] = None
    category: str
    raw_text: str

class TransactionCreate(TransactionBase):
    user_id: str

class TransactionResponse(TransactionBase):
    id: str
    user_id: str
    created_at: datetime
    
    class Config:
        from_attributes = True

# Memory vector schemas
class MemoryVectorCreate(BaseModel):
    user_id: str
    text: str
    metadata: Optional[Dict[str, Any]] = None

class MemoryVectorResponse(BaseModel):
    id: str
    user_id: str
    text: str
    metadata: Optional[Dict[str, Any]] = None

# Upload schemas
class UploadResponse(BaseModel):
    user: UserResponse
    transaction_count: int
    message: str

# Analysis schemas
class CategorySummary(BaseModel):
    category: str
    amount: float
    count: int
    percentage: float

class SpendingSummary(BaseModel):
    total_spent: float
    total_income: float
    net_balance: float
    transaction_count: int
    categories: List[CategorySummary]
    top_merchants: List[Dict[str, Any]]
    date_range: Dict[str, str]

class Insight(BaseModel):
    type: str  # alert, recommendation, trend
    title: str
    message: str
    severity: Optional[str] = None  # low, medium, high

class AnalysisResponse(BaseModel):
    summary: SpendingSummary
    insights: List[Insight]
    trends: Dict[str, Any]

# Chat schemas
class ChatMessage(BaseModel):
    message: str
    user_id: str

class ChatResponse(BaseModel):
    response: str
    sources: Optional[List[str]] = None

