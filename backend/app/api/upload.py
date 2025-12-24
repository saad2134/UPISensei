"""
File upload API endpoint
"""
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.pdf_parser import PDFParser
from app.services.transaction_classifier import TransactionClassifier
from app.services.memory import MemoryService
from app.services.insights import InsightsService
from app.services.stats import StatsService
from app.models.user import get_or_create_user
from app.models.transaction import create_transactions
from app.models.schemas import TransactionCreate, UploadResponse
from app.utils.phone import extract_phone_from_text
import csv
import io

router = APIRouter()
pdf_parser = PDFParser()
classifier = TransactionClassifier()
memory_service = MemoryService()
insights_service = InsightsService()
stats_service = StatsService()

@router.post("/pdf", response_model=UploadResponse)
async def upload_pdf(file: UploadFile = File(...)):
    """Upload and process PDF file"""
    try:
        # Read file content
        content = await file.read()
        
        # Extract text from PDF
        text = pdf_parser.extract_text(content)
        
        if not text.strip():
            raise HTTPException(status_code=400, detail="No text found in PDF")
        
        # Extract phone number
        phone = pdf_parser.extract_phone_number(text)
        if not phone:
            raise HTTPException(status_code=400, detail="Phone number not found in PDF")
        
        # Get or create user
        user = get_or_create_user(phone)
        
        # Parse transactions
        raw_transactions = pdf_parser.parse_transactions(text)
        
        if not raw_transactions:
            raise HTTPException(status_code=400, detail="No transactions found in PDF")
        
        # Classify and create transactions
        transaction_creates = []
        for raw_txn in raw_transactions:
            classification = classifier.classify(
                raw_txn["description"],
                user.id,
                raw_txn["amount"]
            )
            
            transaction_type = pdf_parser.determine_transaction_type(
                raw_txn["description"],
                raw_txn["amount"]
            )
            
            merchant = pdf_parser.extract_merchant(raw_txn["description"])
            
            transaction_creates.append(TransactionCreate(
                user_id=user.id,
                date=raw_txn["date"],
                amount=raw_txn["amount"],
                type=transaction_type,
                merchant=merchant,
                category=classification["category"],
                raw_text=raw_txn["raw_text"]
            ))
        
        # Save transactions
        transactions = create_transactions(transaction_creates)
        
        # Store in memory
        memory_service.store_batch_memories(user.id, transactions)
        
        return UploadResponse(
            user=user,
            transaction_count=len(transactions),
            message=f"Successfully processed {len(transactions)} transactions"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")

@router.post("/csv", response_model=UploadResponse)
async def upload_csv(file: UploadFile = File(...)):
    """Upload and process CSV file"""
    try:
        # Read file content
        content = await file.read()
        text = content.decode('utf-8')
        
        # Extract phone number (might be in filename or first few lines)
        phone = extract_phone_from_text(text[:1000])
        if not phone:
            # Try to extract from filename
            phone = extract_phone_from_text(file.filename)
        
        if not phone:
            raise HTTPException(status_code=400, detail="Phone number not found")
        
        # Get or create user
        user = get_or_create_user(phone)
        
        # Parse CSV
        csv_reader = csv.DictReader(io.StringIO(text))
        rows = list(csv_reader)
        
        if not rows:
            raise HTTPException(status_code=400, detail="No data found in CSV")
        
        # Process rows
        transaction_creates = []
        for row in rows:
            # Try to extract transaction data
            description = row.get("description") or row.get("Description") or row.get("narration") or ""
            amount_str = row.get("amount") or row.get("Amount") or row.get("debit") or "0"
            date_str = row.get("date") or row.get("Date") or ""
            
            if not description or not amount_str:
                continue
            
            try:
                amount = abs(float(str(amount_str).replace(",", "").replace("₹", "").strip()))
                if amount == 0:
                    continue
                
                # Parse date
                from datetime import datetime
                try:
                    date = datetime.strptime(date_str, "%Y-%m-%d")
                except:
                    try:
                        date = datetime.strptime(date_str, "%d/%m/%Y")
                    except:
                        date = datetime.now()
                
                # Classify
                classification = classifier.classify(description, user.id, amount)
                
                # Determine type
                transaction_type = "debit"
                if any(kw in description.lower() for kw in ["credit", "salary", "refund"]):
                    transaction_type = "credit"
                
                merchant = pdf_parser.extract_merchant(description)
                
                transaction_creates.append(TransactionCreate(
                    user_id=user.id,
                    date=date,
                    amount=amount,
                    type=transaction_type,
                    merchant=merchant,
                    category=classification["category"],
                    raw_text=description
                ))
            except Exception as e:
                continue
        
        if not transaction_creates:
            raise HTTPException(status_code=400, detail="No valid transactions found in CSV")
        
        # Save transactions
        transactions = create_transactions(transaction_creates)
        
        # Store in memory
        memory_service.store_batch_memories(user.id, transactions)
        
        return UploadResponse(
            user=user,
            transaction_count=len(transactions),
            message=f"Successfully processed {len(transactions)} transactions"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing CSV: {str(e)}")

