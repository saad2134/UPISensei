"""
PDF parsing service using pdfplumber
"""
import pdfplumber
from typing import List, Dict, Optional
from datetime import datetime
import re
from io import BytesIO
from app.utils.phone import extract_phone_from_text

class PDFParser:
    """Parse PDF files to extract transactions and phone numbers"""
    
    def extract_text(self, pdf_bytes: bytes) -> str:
        """Extract all text from PDF"""
        text_content = []
        
        # Convert bytes to file-like object for pdfplumber
        pdf_file = BytesIO(pdf_bytes)
        
        with pdfplumber.open(pdf_file) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    text_content.append(text)
        
        return "\n".join(text_content)
    
    def extract_phone_number(self, text: str) -> Optional[str]:
        """Extract phone number from PDF text"""
        return extract_phone_from_text(text)
    
    def parse_transactions(self, text: str) -> List[Dict]:
        """Parse transactions from PDF text - improved pattern matching"""
        lines = text.split('\n')
        transactions = []
        seen_transactions = set()  # To avoid duplicates
        
        # Enhanced patterns for different transaction formats
        # Pattern 1: Date Description Amount (most common)
        pattern1 = r'(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\s+(.+?)\s+([₹$]?\s*-?\s*\d{1,3}(?:,\d{3})*(?:\.\d{2})?)'
        
        # Pattern 2: UPI transactions
        pattern2 = r'(UPI[\/\-].*?)\s+([₹$]?\s*-?\s*\d{1,3}(?:,\d{3})*(?:\.\d{2})?)'
        
        # Pattern 3: Amount at start or end
        pattern3 = r'([₹$]?\s*-?\s*\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s+(.+?)(?:\s+(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}))?'
        
        # Pattern 4: Description with amount (no date - will use current date)
        pattern4 = r'(.{10,100}?)\s+([₹$]?\s*-?\s*\d{1,3}(?:,\d{3})*(?:\.\d{2})?)'
        
        for line in lines:
            line = line.strip()
            if len(line) < 10:
                continue
            
            # Skip header/footer lines
            if any(skip in line.lower() for skip in [
                'page', 'statement', 'account', 'balance', 'total', 
                'date', 'description', 'amount', 'debit', 'credit',
                'opening', 'closing', 'summary'
            ]):
                continue
            
            transaction = None
            
            # Try Pattern 1: Date Description Amount
            match = re.search(pattern1, line, re.IGNORECASE)
            if match:
                date_str = match.group(1)
                description = match.group(2).strip()
                amount_str = match.group(3)
                
                if description and len(description) > 3:
                    try:
                        amount = self._parse_amount(amount_str)
                        if amount > 0:
                            transaction = {
                                "date": self._parse_date(date_str),
                                "description": description,
                                "amount": amount,
                                "raw_text": line
                            }
                    except:
                        pass
            
            # Try Pattern 2: UPI transactions
            if not transaction:
                match = re.search(pattern2, line, re.IGNORECASE)
                if match:
                    description = match.group(1).strip()
                    amount_str = match.group(2)
                    try:
                        amount = self._parse_amount(amount_str)
                        if amount > 0:
                            transaction = {
                                "date": datetime.now(),
                                "description": description,
                                "amount": amount,
                                "raw_text": line
                            }
                    except:
                        pass
            
            # Try Pattern 3: Amount Description Date
            if not transaction:
                match = re.search(pattern3, line, re.IGNORECASE)
                if match:
                    amount_str = match.group(1)
                    description = match.group(2).strip()
                    date_str = match.group(3) if match.lastindex >= 3 and match.group(3) else None
                    
                    if description and len(description) > 3:
                        try:
                            amount = self._parse_amount(amount_str)
                            if amount > 0:
                                date = self._parse_date(date_str) if date_str else datetime.now()
                                transaction = {
                                    "date": date,
                                    "description": description,
                                    "amount": amount,
                                    "raw_text": line
                                }
                        except:
                            pass
            
            # Try Pattern 4: Description Amount (fallback - no date)
            if not transaction:
                # Look for lines with amounts (likely transactions)
                amount_matches = re.findall(r'[₹$]?\s*-?\s*\d{1,3}(?:,\d{3})*(?:\.\d{2})?', line)
                if len(amount_matches) >= 1:
                    # Get the largest amount (most likely transaction amount)
                    amounts = [self._parse_amount(amt) for amt in amount_matches]
                    max_amount = max(amounts)
                    max_index = amounts.index(max_amount)
                    
                    if max_amount > 10:  # Minimum transaction amount
                        # Remove amount from line to get description
                        description = line.replace(amount_matches[max_index], '').strip()
                        description = re.sub(r'\s+', ' ', description)  # Clean up spaces
                        
                        if len(description) > 5:
                            transaction = {
                                "date": datetime.now(),
                                "description": description,
                                "amount": max_amount,
                                "raw_text": line
                            }
            
            # Add transaction if found and not duplicate
            if transaction:
                # Create a unique key to avoid duplicates
                txn_key = f"{transaction['description'][:50]}-{transaction['amount']}"
                if txn_key not in seen_transactions:
                    seen_transactions.add(txn_key)
                    transactions.append(transaction)
        
        return transactions
    
    def _parse_date(self, date_str: str) -> datetime:
        """Parse date string to datetime"""
        formats = [
            "%d/%m/%Y", "%d-%m-%Y", "%d.%m.%Y",
            "%d/%m/%y", "%d-%m-%y", "%d.%m.%y",
            "%Y-%m-%d", "%Y/%m/%d"
        ]
        
        for fmt in formats:
            try:
                return datetime.strptime(date_str, fmt)
            except:
                continue
        
        # Default to current date if parsing fails
        return datetime.now()
    
    def _parse_amount(self, amount_str: str) -> float:
        """Parse amount string to float"""
        # Remove currency symbols, commas, spaces
        clean_str = re.sub(r'[₹$,]', '', amount_str).strip()
        clean_str = clean_str.replace(' ', '')
        
        try:
            return abs(float(clean_str))
        except:
            return 0.0
    
    def determine_transaction_type(self, description: str, amount: float) -> str:
        """Determine if transaction is debit or credit"""
        desc_lower = description.lower()
        
        # Credit indicators
        if any(keyword in desc_lower for keyword in [
            "credit", "salary", "deposit", "refund", "interest", "income"
        ]):
            return "credit"
        
        # Debit indicators
        if any(keyword in desc_lower for keyword in [
            "debit", "payment", "withdrawal", "purchase", "pos", "upi", "transfer"
        ]):
            return "debit"
        
        # Default to debit for negative amounts or if unclear
        return "debit"
    
    def extract_merchant(self, description: str) -> Optional[str]:
        """Extract merchant name from description"""
        # Common merchant patterns
        merchants = [
            "swiggy", "zomato", "amazon", "flipkart", "myntra", "uber", "ola",
            "netflix", "bigbasket", "nykaa", "make my trip", "goibibo"
        ]
        
        desc_lower = description.lower()
        for merchant in merchants:
            if merchant in desc_lower:
                return merchant.title()
        
        return None

