"""
Transaction classification service using embeddings + Gemini
"""
from typing import Dict, Optional, List
from app.services.embeddings import get_embedding
from app.config.gemini import get_gemini_model
from app.config.settings import settings
from app.utils.categories import CATEGORY_KEYWORDS, get_all_categories
from app.models.memory import search_similar_memories
import numpy as np

class TransactionClassifier:
    """Classify transactions using vector similarity and Gemini fallback"""
    
    def __init__(self):
        self.categories = get_all_categories()
        self.category_keywords = CATEGORY_KEYWORDS
        self.category_embeddings = self._precompute_category_embeddings()
    
    def _precompute_category_embeddings(self) -> Dict[str, List[float]]:
        """Precompute embeddings for category keywords"""
        embeddings = {}
        for category, keywords in self.category_keywords.items():
            # Create a representative text for the category
            category_text = f"{category} {', '.join(keywords[:5])}"
            embeddings[category] = get_embedding(category_text)
        return embeddings
    
    def classify(
        self,
        description: str,
        user_id: str,
        amount: float = 0.0
    ) -> Dict[str, any]:
        """
        Classify transaction using:
        1. Rule-based (keywords) - PRIMARY METHOD
        2. Vector similarity with past transactions
        3. Gemini LLM fallback (only if both above fail and enabled)
        """
        # Step 1: Rule-based classification (improved - lower threshold)
        rule_based = self._classify_by_keywords(description)
        if rule_based["confidence"] >= 0.3:  # Lowered from 0.8 - accept more keyword matches
            return rule_based
        
        # Step 2: Vector similarity with past transactions
        vector_based = self._classify_by_vector_similarity(description, user_id)
        if vector_based["confidence"] >= 0.5:  # Lowered threshold
            return vector_based
        
        # Step 3: Gemini LLM fallback (only if really needed and quota available)
        # Skip Gemini if quota is exhausted - use "Other" category instead
        try:
            return self._classify_with_gemini(description, amount)
        except Exception as e:
            # If Gemini fails (quota, etc.), fall back to "Other"
            print(f"Gemini classification skipped: {e}")
            return {
                "category": "Other",
                "confidence": 0.4,
                "method": "fallback"
            }
    
    def _classify_by_keywords(self, description: str) -> Dict[str, any]:
        """Classify using keyword matching - improved algorithm"""
        desc_lower = description.lower()
        best_match = None
        best_score = 0.0
        
        for category, keywords in self.category_keywords.items():
            # Count exact matches
            exact_matches = sum(1 for keyword in keywords if keyword in desc_lower)
            
            # Also check for partial matches (for compound words)
            partial_matches = sum(
                1 for keyword in keywords 
                if any(keyword in word or word in keyword for word in desc_lower.split())
            )
            
            # Use the better of the two
            matches = max(exact_matches, partial_matches)
            
            # Calculate score - if any keyword matches, give it a score
            if matches > 0:
                # Base score from matches
                score = matches / max(len(keywords), 1)
                # Boost if multiple keywords match
                if matches >= 2:
                    score = min(score * 1.5, 1.0)
                # Boost if it's an exact match
                if exact_matches > 0:
                    score = min(score * 1.2, 1.0)
                
                if score > best_score:
                    best_score = score
                    best_match = category
        
        if best_match and best_score > 0:
            return {
                "category": best_match,
                "confidence": min(best_score, 1.0),
                "method": "keyword"
            }
        
        return {
            "category": "Other",
            "confidence": 0.2,
            "method": "keyword"
        }
    
    def _classify_by_vector_similarity(
        self,
        description: str,
        user_id: str
    ) -> Dict[str, any]:
        """Classify using vector similarity with past transactions"""
        # Get embedding for description
        desc_embedding = np.array(get_embedding(description))
        
        # Compare with category embeddings
        best_category = None
        best_similarity = 0.0
        
        for category, cat_embedding in self.category_embeddings.items():
            similarity = np.dot(desc_embedding, np.array(cat_embedding))
            if similarity > best_similarity:
                best_similarity = similarity
                best_category = category
        
        # Also check user's past transactions
        try:
            similar_memories = search_similar_memories(
                user_id,
                description,
                limit=3,
                threshold=0.6
            )
            
            if similar_memories:
                # Extract categories from similar memories
                memory_categories = [
                    mem.metadata.get("category", "Other")
                    for mem in similar_memories
                    if mem.metadata
                ]
                
                if memory_categories:
                    # Use most common category from similar memories
                    from collections import Counter
                    most_common = Counter(memory_categories).most_common(1)[0]
                    if most_common[1] >= 2:  # At least 2 similar transactions
                        best_category = most_common[0]
                        best_similarity = max(best_similarity, 0.75)
        except Exception as e:
            print(f"Error in memory search: {e}")
        
        confidence = float(best_similarity)
        
        return {
            "category": best_category or "Other",
            "confidence": confidence,
            "method": "vector"
        }
    
    def _classify_with_gemini(
        self,
        description: str,
        amount: float
    ) -> Dict[str, any]:
        """Classify using Gemini LLM - with rate limiting and error handling"""
        import time
        
        # Check if Gemini is enabled (can be disabled via env var)
        if not settings.is_gemini_enabled:
            return {
                "category": "Other",
                "confidence": 0.4,
                "method": "fallback_gemini_disabled"
            }
        
        try:
            model = get_gemini_model()
            
            prompt = f"""Classify this transaction into one of these categories:
{', '.join(self.categories)}

Transaction description: {description}
Amount: ₹{amount}

Respond with ONLY the category name, nothing else."""

            response = model.generate_content(prompt)
            category = response.text.strip()
            
            # Clean up response (remove quotes, extra text)
            category = category.strip('"\'')
            category = category.split('\n')[0].strip()
            
            # Validate category
            if category not in self.categories:
                category = "Other"
            
            return {
                "category": category,
                "confidence": 0.85,
                "method": "gemini"
            }
        except Exception as e:
            error_str = str(e)
            # Check if it's a quota/rate limit error
            if "429" in error_str or "quota" in error_str.lower() or "rate limit" in error_str.lower():
                print(f"Gemini quota exceeded - using fallback classification")
                # Return fallback without retrying
                return {
                    "category": "Other",
                    "confidence": 0.4,
                    "method": "fallback_quota_exceeded"
                }
            else:
                print(f"Gemini classification error: {e}")
                return {
                    "category": "Other",
                    "confidence": 0.4,
                    "method": "fallback_error"
                }

