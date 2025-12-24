# UPISensei Complete Architecture Documentation

## System Overview

UPISensei is a full-stack AI-driven financial intelligence system that extracts, classifies, and analyzes UPI transactions from bank statements.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Dashboard   │  │   Chatbot    │  │  Analytics   │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                  │               │
│         └─────────────────┴──────────────────┘              │
│                            │                                 │
│                    API Service Layer                         │
└────────────────────────────┼─────────────────────────────────┘
                             │
                             │ HTTP/REST
                             │
┌────────────────────────────┼─────────────────────────────────┐
│                    Backend (FastAPI)                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              API Routes                               │   │
│  │  /upload  /analysis  /chat  /user                    │   │
│  └──────────────────────────────────────────────────────┘   │
│                            │                                 │
│  ┌─────────────────────────┼─────────────────────────────┐  │
│  │              Services Layer                            │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────┐   │  │
│  │  │ PDF Parser   │  │ Classifier    │  │ Memory   │   │  │
│  │  └──────┬───────┘  └──────┬───────┘  └─────┬─────┘   │  │
│  │         │                 │                  │         │  │
│  │  ┌──────┴───────┐  ┌──────┴───────┐  ┌─────┴─────┐   │  │
│  │  │ Insights    │  │ Stats        │  │ Embeddings│   │  │
│  │  └─────────────┘  └──────────────┘  └───────────┘   │  │
│  └───────────────────────────────────────────────────────┘  │
│                            │                                 │
└────────────────────────────┼─────────────────────────────────┘
                             │
                ┌────────────┼────────────┐
                │            │            │
         ┌──────▼──────┐ ┌──▼──┐ ┌──────▼──────┐
         │  Supabase   │ │Gemini│ │Sentence     │
         │  (Postgres) │ │  AI  │ │Transformers │
         └─────────────┘ └──────┘ └─────────────┘
```

## Component Details

### 1. PDF Parser (`backend/app/services/pdf_parser.py`)
- Uses `pdfplumber` to extract text from PDFs
- Extracts phone numbers using regex patterns
- Parses transaction data (date, amount, description)
- Identifies transaction type (debit/credit)
- Extracts merchant names

### 2. Transaction Classifier (`backend/app/services/transaction_classifier.py`)
**Three-tier classification:**
1. **Rule-based**: Keyword matching against category definitions
2. **Vector similarity**: Compares transaction embeddings with past transactions
3. **LLM fallback**: Uses Gemini AI for ambiguous cases

### 3. Memory Service (`backend/app/services/memory.py`)
- Converts transactions to text embeddings
- Stores in Supabase with vector indexing
- Enables RAG (Retrieval-Augmented Generation) for chatbot

### 4. Insights Engine (`backend/app/services/insights.py`)
Generates insights:
- **Spending patterns**: High spending alerts, large transactions
- **Category analysis**: Food spending, delivery dominance
- **Time patterns**: Late-night spending detection
- **Merchant analysis**: Repeating merchant patterns
- **AI insights**: Gemini-generated recommendations

### 5. Stats Service (`backend/app/services/stats.py`)
Calculates:
- Total spent/income
- Category breakdowns
- Top merchants
- Spending trends (daily/weekly/monthly)
- Category percentages

### 6. Chat Service (`backend/app/api/chat.py`)
- Retrieves user transactions
- Searches similar memories using vector similarity
- Builds RAG context with financial data
- Generates responses using Gemini AI

## Data Flow

### Upload Workflow
```
1. User uploads PDF/CSV
   ↓
2. PDF Parser extracts text
   ↓
3. Phone number extracted → User created/found
   ↓
4. Transactions parsed from text
   ↓
5. Each transaction classified (3-tier system)
   ↓
6. Transactions stored in database
   ↓
7. Memory vectors created for RAG
   ↓
8. Insights generated
   ↓
9. Response sent to frontend
```

### Chat Workflow
```
1. User asks question
   ↓
2. Retrieve user transactions (last 90 days)
   ↓
3. Search similar memories (vector similarity)
   ↓
4. Build RAG context:
   - Transaction summary
   - Category breakdowns
   - Top merchants
   - Similar past transactions
   ↓
5. Send to Gemini with context
   ↓
6. Return AI response
```

### Analysis Workflow
```
1. Request analysis for user
   ↓
2. Fetch transactions from database
   ↓
3. Calculate statistics:
   - Totals, averages
   - Category breakdowns
   - Trends
   ↓
4. Generate insights:
   - Pattern detection
   - Anomaly detection
   - AI recommendations
   ↓
5. Return comprehensive analysis
```

## Database Schema

### users
- `id` (UUID): Primary key
- `phone` (TEXT): Unique phone number
- `name` (TEXT): Optional name
- `created_at` (TIMESTAMP): Creation time

### transactions
- `id` (UUID): Primary key
- `user_id` (UUID): Foreign key to users
- `date` (DATE): Transaction date
- `amount` (FLOAT): Transaction amount
- `type` (TEXT): 'debit' or 'credit'
- `merchant` (TEXT): Merchant name
- `category` (TEXT): ML-classified category
- `raw_text` (TEXT): Original transaction text
- `created_at` (TIMESTAMP): Creation time

### memory_vectors
- `id` (UUID): Primary key
- `user_id` (UUID): Foreign key to users
- `text` (TEXT): Memory text
- `embedding` (vector(384)): Sentence transformer embedding
- `metadata` (JSONB): Additional data (category, amount, etc.)
- `created_at` (TIMESTAMP): Creation time

## API Contracts

### Upload Response
```json
{
  "user": {
    "id": "uuid",
    "phone": "+91...",
    "name": "Optional",
    "created_at": "2024-01-01T00:00:00Z"
  },
  "transaction_count": 42,
  "message": "Successfully processed 42 transactions"
}
```

### Analysis Response
```json
{
  "summary": {
    "total_spent": 50000.0,
    "total_income": 75000.0,
    "net_balance": 25000.0,
    "transaction_count": 150,
    "categories": [
      {
        "category": "Food & Dining",
        "amount": 15000.0,
        "count": 45,
        "percentage": 30.0
      }
    ],
    "top_merchants": [...],
    "date_range": {...}
  },
  "insights": [
    {
      "type": "alert",
      "title": "High Food Spending",
      "message": "...",
      "severity": "medium"
    }
  ],
  "trends": {...}
}
```

### Chat Response
```json
{
  "response": "Based on your transactions...",
  "sources": ["Relevant memory 1", "Relevant memory 2"]
}
```

## Frontend Components

### Dashboard (`components/dashboard.tsx`)
- Main container
- Fetches analysis on load
- Displays all analytics components

### Spending Stats Card (`components/spending-stats-card.tsx`)
- Total spent
- Average daily spending
- Net balance
- Transaction count

### Weekly Spending Chart (`components/weekly-spending-chart.tsx`)
- Interactive pie chart
- Category breakdown
- Hover/click interactions

### Insights Section (`components/insights-section.tsx`)
- Displays AI-generated insights
- Color-coded by type (alert/recommendation/trend)
- Severity indicators

### Transaction History (`components/transaction-history.tsx`)
- Recent transactions
- Formatted with emojis
- Time-ago display

### AI Chatbot (`components/ai-chatbot.tsx`)
- Chat interface
- File upload
- Markdown rendering
- RAG-powered responses

## Security Considerations

1. **Phone Number Normalization**: All phone numbers normalized to +91 format
2. **User Isolation**: All queries filtered by user_id
3. **File Validation**: PDF/CSV only, size limits
4. **CORS**: Configured for specific origins
5. **API Keys**: Stored in environment variables

## Performance Optimizations

1. **Embedding Caching**: Sentence transformer model loaded once
2. **Vector Indexing**: ivfflat index for fast similarity search
3. **Transaction Limits**: Pagination and date filtering
4. **Batch Operations**: Bulk inserts for transactions
5. **Lazy Loading**: Frontend components load data on demand

## Scalability

- **Horizontal Scaling**: Stateless API, can run multiple instances
- **Database**: Supabase handles scaling
- **Vector Search**: pgvector with proper indexing
- **Caching**: Can add Redis for frequently accessed data
- **CDN**: Frontend can be deployed to Vercel/Netlify

## Future Enhancements

1. **Real-time Updates**: WebSocket for live transaction updates
2. **Budget Management**: Set and track budgets
3. **Goal Setting**: Financial goals with progress tracking
4. **Export**: PDF/Excel reports
5. **Multi-currency**: Support for different currencies
6. **Bank Integration**: Direct API connections to banks
7. **Mobile App**: React Native version
8. **Advanced Analytics**: ML-based forecasting

## Error Handling

- **PDF Parsing**: Graceful fallback if extraction fails
- **Classification**: Defaults to "Other" category
- **API Errors**: Proper HTTP status codes and error messages
- **Frontend**: Loading states and error displays
- **Database**: Transaction rollback on errors

## Testing Strategy

1. **Unit Tests**: Test individual services
2. **Integration Tests**: Test API endpoints
3. **E2E Tests**: Test complete workflows
4. **Performance Tests**: Load testing for API
5. **Accuracy Tests**: Classification accuracy validation

