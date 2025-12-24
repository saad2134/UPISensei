"""
Insights generation service
"""
from typing import List, Dict, Any
from datetime import datetime, timedelta
from collections import defaultdict, Counter
from app.models.schemas import TransactionResponse, Insight
from app.config.gemini import get_gemini_model

class InsightsService:
    """Generate financial insights from transactions"""
    
    def generate_insights(
        self,
        transactions: List[TransactionResponse],
        user_id: str
    ) -> List[Insight]:
        """Generate comprehensive insights"""
        insights = []
        
        # Spending pattern insights
        insights.extend(self._analyze_spending_patterns(transactions))
        
        # Category insights
        insights.extend(self._analyze_categories(transactions))
        
        # Time-based insights
        insights.extend(self._analyze_time_patterns(transactions))
        
        # Merchant insights
        insights.extend(self._analyze_merchants(transactions))
        
        # AI-generated insights
        insights.extend(self._generate_ai_insights(transactions))
        
        return insights
    
    def _analyze_spending_patterns(
        self,
        transactions: List[TransactionResponse]
    ) -> List[Insight]:
        """Analyze overall spending patterns"""
        insights = []
        debits = [t for t in transactions if t.type == "debit"]
        
        if not debits:
            return insights
        
        total_spent = sum(t.amount for t in debits)
        avg_transaction = total_spent / len(debits) if debits else 0
        
        # High spending alert
        if total_spent > 50000:
            insights.append(Insight(
                type="alert",
                title="High Monthly Spending",
                message=f"You've spent ₹{total_spent:,.0f} this month. Consider reviewing your expenses.",
                severity="medium"
            ))
        
        # Large transaction alert
        large_transactions = [t for t in debits if t.amount > 5000]
        if len(large_transactions) > 5:
            insights.append(Insight(
                type="alert",
                title="Multiple Large Transactions",
                message=f"You have {len(large_transactions)} transactions over ₹5,000 this month.",
                severity="low"
            ))
        
        return insights
    
    def _analyze_categories(
        self,
        transactions: List[TransactionResponse]
    ) -> List[Insight]:
        """Analyze category-wise spending"""
        insights = []
        debits = [t for t in transactions if t.type == "debit"]
        
        if not debits:
            return insights
        
        category_totals = defaultdict(float)
        for t in debits:
            category_totals[t.category] += t.amount
        
        total_spent = sum(category_totals.values())
        
        # Food spending alert
        food_spent = category_totals.get("Food & Dining", 0)
        if food_spent > 0:
            food_percentage = (food_spent / total_spent) * 100
            if food_percentage > 40:
                insights.append(Insight(
                    type="recommendation",
                    title="High Food Spending",
                    message=f"Food & Dining accounts for {food_percentage:.0f}% of your spending. Consider meal planning to save money.",
                    severity="medium"
                ))
        
        # Delivery dominance
        delivery_keywords = ["swiggy", "zomato", "uber eats", "instamart"]
        delivery_count = sum(
            1 for t in debits
            if any(kw in (t.merchant or "").lower() for kw in delivery_keywords)
        )
        
        if delivery_count > 20:
            insights.append(Insight(
                type="alert",
                title="Delivery Dominance Detected",
                message=f"You've ordered food {delivery_count} times this month. Consider cooking more to save money.",
                severity="high"
            ))
        
        return insights
    
    def _analyze_time_patterns(
        self,
        transactions: List[TransactionResponse]
    ) -> List[Insight]:
        """Analyze time-based patterns"""
        insights = []
        debits = [t for t in transactions if t.type == "debit"]
        
        if not debits:
            return insights
        
        # Late night spending
        late_night = [
            t for t in debits
            if t.date.hour >= 22 or t.date.hour < 6
        ]
        
        if len(late_night) > 10:
            insights.append(Insight(
                type="alert",
                title="Late Night Spending",
                message=f"You have {len(late_night)} transactions between 10 PM and 6 AM. Late-night purchases can be impulsive.",
                severity="low"
            ))
        
        return insights
    
    def _analyze_merchants(
        self,
        transactions: List[TransactionResponse]
    ) -> List[Insight]:
        """Analyze merchant patterns"""
        insights = []
        debits = [t for t in transactions if t.type == "debit"]
        
        if not debits:
            return insights
        
        merchant_counts = Counter(t.merchant for t in debits if t.merchant)
        
        # Repeating merchants
        if merchant_counts:
            top_merchant, count = merchant_counts.most_common(1)[0]
            if count > 15:
                insights.append(Insight(
                    type="trend",
                    title="Frequent Merchant",
                    message=f"You've shopped at {top_merchant} {count} times. Consider a subscription or bulk purchase to save.",
                    severity="low"
                ))
        
        return insights
    
    def _generate_ai_insights(
        self,
        transactions: List[TransactionResponse]
    ) -> List[Insight]:
        """Generate AI-powered insights using Gemini"""
        insights = []
        
        if len(transactions) < 5:
            return insights
        
        # Check if Gemini is enabled
        from app.config.settings import settings
        if not settings.is_gemini_enabled:
            return insights  # Skip AI insights if Gemini is disabled
        
        try:
            model = get_gemini_model()
            
            # Prepare transaction summary
            debits = [t for t in transactions if t.type == "debit"]
            total_spent = sum(t.amount for t in debits)
            category_summary = defaultdict(float)
            for t in debits:
                category_summary[t.category] += t.amount
            
            prompt = f"""Analyze these transactions and provide 2-3 actionable insights:

Total Spent: ₹{total_spent:,.0f}
Transactions: {len(debits)}
Categories: {dict(category_summary)}

Provide insights in this format:
1. [TYPE: alert/recommendation/trend] [TITLE] - [MESSAGE]
2. [TYPE] [TITLE] - [MESSAGE]

Be specific and actionable."""

            response = model.generate_content(prompt)
            ai_text = response.text
            
            # Parse AI response into insights
            lines = ai_text.split('\n')
            for line in lines:
                line = line.strip()
                if not line or not line[0].isdigit():
                    continue
                
                # Extract insight components
                if ':' in line:
                    parts = line.split(':', 1)
                    if len(parts) == 2:
                        header = parts[0].strip()
                        message = parts[1].strip()
                        
                        # Determine type and title
                        insight_type = "recommendation"
                        if "alert" in header.lower():
                            insight_type = "alert"
                        elif "trend" in header.lower():
                            insight_type = "trend"
                        
                        title = header.split(']')[1].strip() if ']' in header else "AI Insight"
                        
                        insights.append(Insight(
                            type=insight_type,
                            title=title,
                            message=message,
                            severity="medium"
                        ))
        except Exception as e:
            error_str = str(e)
            # Check if it's a quota/rate limit error
            if "429" in error_str or "quota" in error_str.lower() or "rate limit" in error_str.lower():
                print(f"Gemini quota exceeded - skipping AI insights")
            else:
                print(f"Error generating AI insights: {e}")
        
        return insights

