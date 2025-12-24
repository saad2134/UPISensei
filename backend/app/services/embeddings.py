"""
Embedding service using SentenceTransformers
"""
from typing import List
from sentence_transformers import SentenceTransformer
from app.config.settings import settings

# Load model once (singleton)
_model = None

def get_embedding_model() -> SentenceTransformer:
    """Get or load the embedding model"""
    global _model
    if _model is None:
        _model = SentenceTransformer(settings.EMBEDDING_MODEL)
    return _model

def get_embedding(text: str) -> List[float]:
    """Get embedding vector for text"""
    model = get_embedding_model()
    embedding = model.encode(text, normalize_embeddings=True)
    return embedding.tolist()

def get_embeddings(texts: List[str]) -> List[List[float]]:
    """Get embeddings for multiple texts"""
    model = get_embedding_model()
    embeddings = model.encode(texts, normalize_embeddings=True)
    return embeddings.tolist()

