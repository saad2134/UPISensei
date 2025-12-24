"""
Phone number extraction utilities
"""
import re
from typing import Optional

def extract_phone_from_text(text: str) -> Optional[str]:
    """Extract phone number from text using regex patterns"""
    # Indian phone number patterns
    patterns = [
        r'\+91[-\s]?[6-9]\d{9}',  # +91 followed by 10 digits
        r'91[-\s]?[6-9]\d{9}',    # 91 followed by 10 digits
        r'[6-9]\d{9}',            # 10 digit number starting with 6-9
        r'\+91[-\s]?\d{10}',      # +91 followed by any 10 digits
    ]
    
    for pattern in patterns:
        matches = re.findall(pattern, text)
        if matches:
            # Clean and normalize the first match
            phone = re.sub(r'[-\s]', '', matches[0])
            if phone.startswith('91') and len(phone) == 12:
                return f"+{phone}"
            elif len(phone) == 10:
                return f"+91{phone}"
            elif phone.startswith('+91'):
                return phone
    
    return None

def normalize_phone(phone: str) -> str:
    """Normalize phone number to standard format"""
    # Remove all non-digit characters except +
    cleaned = re.sub(r'[^\d+]', '', phone)
    
    # Handle different formats
    if cleaned.startswith('+91'):
        return cleaned
    elif cleaned.startswith('91') and len(cleaned) == 12:
        return f"+{cleaned}"
    elif len(cleaned) == 10:
        return f"+91{cleaned}"
    
    return phone

