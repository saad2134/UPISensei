"""
Statistics and analytics service
"""
from typing import List, Dict, Any
from datetime import datetime, timedelta
from collections import defaultdict
from app.models.schemas import TransactionResponse, CategorySummary, SpendingSummary

class StatsService:
    """Generate statistics and analytics from transactions"""
    
    def get_summary(
        self,
        transactions: List[TransactionResponse],
        days: int = 30
    ) -> SpendingSummary:
        """Get comprehensive spending summary"""
        debits = [t for t in transactions if t.type == "debit"]
        credits = [t for t in transactions if t.type == "credit"]
        
        total_spent = sum(t.amount for t in debits)
        total_income = sum(t.amount for t in credits)
        net_balance = total_income - total_spent
        
        # Category breakdown
        category_totals = defaultdict(lambda: {"amount": 0.0, "count": 0})
        for t in debits:
            category_totals[t.category]["amount"] += t.amount
            category_totals[t.category]["count"] += 1
        
        categories = []
        for category, data in category_totals.items():
            percentage = (data["amount"] / total_spent * 100) if total_spent > 0 else 0
            categories.append(CategorySummary(
                category=category,
                amount=data["amount"],
                count=data["count"],
                percentage=round(percentage, 2)
            ))
        
        categories.sort(key=lambda x: x.amount, reverse=True)
        
        # Top merchants
        merchant_totals = defaultdict(lambda: {"amount": 0.0, "count": 0})
        for t in debits:
            if t.merchant:
                merchant_totals[t.merchant]["amount"] += t.amount
                merchant_totals[t.merchant]["count"] += 1
        
        top_merchants = [
            {
                "merchant": merchant,
                "amount": data["amount"],
                "count": data["count"]
            }
            for merchant, data in sorted(
                merchant_totals.items(),
                key=lambda x: x[1]["amount"],
                reverse=True
            )[:10]
        ]
        
        # Date range
        if transactions:
            dates = [t.date for t in transactions]
            min_date = min(dates)
            max_date = max(dates)
            date_range = {
                "start": min_date.isoformat(),
                "end": max_date.isoformat()
            }
        else:
            date_range = {
                "start": datetime.now().isoformat(),
                "end": datetime.now().isoformat()
            }
        
        return SpendingSummary(
            total_spent=total_spent,
            total_income=total_income,
            net_balance=net_balance,
            transaction_count=len(transactions),
            categories=categories,
            top_merchants=top_merchants,
            date_range=date_range
        )
    
    def get_trends(
        self,
        transactions: List[TransactionResponse],
        period: str = "monthly"
    ) -> Dict[str, Any]:
        """Get spending trends"""
        debits = [t for t in transactions if t.type == "debit"]
        
        if period == "daily":
            # Group by day
            daily_totals = defaultdict(float)
            for t in debits:
                date_key = t.date.strftime("%Y-%m-%d")
                daily_totals[date_key] += t.amount
            
            return {
                "period": "daily",
                "data": [
                    {"date": date, "amount": amount}
                    for date, amount in sorted(daily_totals.items())
                ]
            }
        
        elif period == "weekly":
            # Group by week
            weekly_totals = defaultdict(float)
            for t in debits:
                week_key = t.date.strftime("%Y-W%W")
                weekly_totals[week_key] += t.amount
            
            return {
                "period": "weekly",
                "data": [
                    {"week": week, "amount": amount}
                    for week, amount in sorted(weekly_totals.items())
                ]
            }
        
        else:  # monthly
            # Group by month
            monthly_totals = defaultdict(float)
            for t in debits:
                month_key = t.date.strftime("%Y-%m")
                monthly_totals[month_key] += t.amount
            
            return {
                "period": "monthly",
                "data": [
                    {"month": month, "amount": amount}
                    for month, amount in sorted(monthly_totals.items())
                ]
            }
    
    def get_category_breakdown(
        self,
        transactions: List[TransactionResponse]
    ) -> Dict[str, Any]:
        """Get detailed category breakdown"""
        debits = [t for t in transactions if t.type == "debit"]
        
        category_data = defaultdict(lambda: {
            "amount": 0.0,
            "count": 0,
            "transactions": []
        })
        
        for t in debits:
            category_data[t.category]["amount"] += t.amount
            category_data[t.category]["count"] += 1
            category_data[t.category]["transactions"].append({
                "id": t.id,
                "date": t.date.isoformat(),
                "merchant": t.merchant,
                "amount": t.amount
            })
        
        total = sum(data["amount"] for data in category_data.values())
        
        return {
            "categories": [
                {
                    "category": category,
                    "amount": data["amount"],
                    "count": data["count"],
                    "percentage": round((data["amount"] / total * 100) if total > 0 else 0, 2),
                    "transactions": data["transactions"][:10]  # Top 10 per category
                }
                for category, data in sorted(
                    category_data.items(),
                    key=lambda x: x[1]["amount"],
                    reverse=True
                )
            ],
            "total": total
        }

