"""
Transaction category definitions and utilities
"""
from typing import Dict, List

# Standard categories
CATEGORIES = [
    "Food & Dining",
    "Shopping",
    "Transportation",
    "Groceries",
    "Entertainment",
    "Utilities",
    "Healthcare",
    "Education",
    "Travel",
    "Bills & Recharges",
    "Income",
    "Investment",
    "Other"
]

# Category keywords for rule-based classification
CATEGORY_KEYWORDS: Dict[str, List[str]] = {
    "Food & Dining": [
        "swiggy", "zomato", "uber eats", "food", "restaurant", "cafe", "pizza",
        "burger", "delivery", "instamart", "dining", "eat", "meal"
    ],
    "Shopping": [
        "amazon", "flipkart", "myntra", "nykaa", "shopping", "purchase", "buy",
        "store", "mall", "fashion", "clothing"
    ],
    "Transportation": [
        "uber", "ola", "rapido", "taxi", "cab", "metro", "bus", "train",
        "fuel", "petrol", "diesel", "parking", "toll"
    ],
    "Groceries": [
        "bigbasket", "grofers", "dunzo", "grocery", "supermarket", "dmart",
        "reliance", "fresh", "vegetable", "fruit"
    ],
    "Entertainment": [
        "netflix", "prime", "spotify", "youtube", "movie", "cinema", "theater",
        "game", "gaming", "subscription"
    ],
    "Utilities": [
        "electricity", "water", "gas", "internet", "broadband", "wifi",
        "utility", "power", "bill"
    ],
    "Healthcare": [
        "hospital", "clinic", "pharmacy", "medical", "doctor", "medicine",
        "apollo", "fortis", "health"
    ],
    "Education": [
        "school", "college", "university", "tuition", "course", "education",
        "book", "stationery"
    ],
    "Travel": [
        "hotel", "flight", "airline", "booking", "travel", "trip", "vacation",
        "make my trip", "goibibo", "oyo"
    ],
    "Bills & Recharges": [
        "recharge", "prepaid", "postpaid", "mobile", "phone", "dth", "cable",
        "bill payment", "bharat bill"
    ],
    "Income": [
        "salary", "credit", "refund", "interest", "dividend", "income",
        "deposit", "transfer received"
    ],
    "Investment": [
        "mutual fund", "sip", "stock", "equity", "investment", "savings",
        "fd", "fixed deposit"
    ]
}

def get_category_keywords() -> Dict[str, List[str]]:
    """Get category keywords mapping"""
    return CATEGORY_KEYWORDS

def get_all_categories() -> List[str]:
    """Get all available categories"""
    return CATEGORIES

