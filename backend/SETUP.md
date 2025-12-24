# UPISensei Complete Setup Guide

This guide will help you set up the complete UPISensei system with FastAPI backend and Next.js frontend.

## Prerequisites

- Python 3.9+
- Node.js 18+
- Supabase account
- Google Gemini API key

## Backend Setup

### 1. Navigate to backend directory
```bash
cd backend
```

### 2. Create virtual environment
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Set up environment variables
Create a `.env` file in the `backend` directory:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key
GEMINI_API_KEY=your_gemini_api_key
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

### 5. Set up Supabase Database

Run these SQL commands in your Supabase SQL editor:

```sql
-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  date DATE NOT NULL,
  amount FLOAT NOT NULL,
  type TEXT NOT NULL,
  merchant TEXT,
  category TEXT NOT NULL,
  raw_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create memory_vectors table
CREATE TABLE memory_vectors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  text TEXT NOT NULL,
  embedding vector(384),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for vector similarity search
CREATE INDEX ON memory_vectors USING ivfflat (embedding vector_cosine_ops);

-- Create function for vector similarity search
CREATE OR REPLACE FUNCTION match_memory_vectors (
  query_embedding vector(384),
  match_user_id UUID,
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  text TEXT,
  metadata JSONB,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    memory_vectors.id,
    memory_vectors.user_id,
    memory_vectors.text,
    memory_vectors.metadata,
    1 - (memory_vectors.embedding <=> query_embedding) as similarity
  FROM memory_vectors
  WHERE memory_vectors.user_id = match_user_id
    AND 1 - (memory_vectors.embedding <=> query_embedding) > match_threshold
  ORDER BY memory_vectors.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

### 6. Run the backend server
```bash
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

## Frontend Setup

### 1. Navigate to frontend directory
```bash
cd frontend_web
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
Create a `.env.local` file in the `frontend_web` directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
GEMINI_API_KEY=your_gemini_api_key
```

### 4. Run the frontend
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Testing the System

### 1. Upload a PDF/CSV
- Go to the dashboard
- Click the upload button in the chatbot
- Upload a bank statement PDF or CSV file
- The system will:
  - Extract phone number
  - Parse transactions
  - Classify categories
  - Generate insights

### 2. View Analytics
- After uploading, the dashboard will show:
  - Spending summary
  - Category breakdown (pie chart)
  - AI-generated insights
  - Transaction history

### 3. Chat with AI
- Click the floating chat button
- Ask questions like:
  - "How much did I spend on food this month?"
  - "What are my top spending categories?"
  - "Compare my spending to last month"

## API Endpoints

### Upload
- `POST /api/upload/pdf` - Upload PDF file
- `POST /api/upload/csv` - Upload CSV file

### Analysis
- `GET /api/analysis/summary/{user_id}` - Get comprehensive analysis
- `GET /api/analysis/trends/{user_id}` - Get spending trends
- `GET /api/analysis/category/{user_id}` - Get category breakdown

### Chat
- `POST /api/chat/message` - Chat with AI assistant

### User
- `GET /api/user/{user_id}` - Get user by ID
- `GET /api/user/phone/{phone}` - Get or create user by phone
- `GET /api/user/{user_id}/transactions` - Get user transactions

## Architecture Overview

### Backend (FastAPI)
- **PDF Parser**: Extracts transactions and phone numbers from PDFs
- **Transaction Classifier**: Uses embeddings + Gemini for category classification
- **Memory Service**: Stores transaction memories as vectors for RAG
- **Insights Engine**: Generates AI-powered financial insights
- **Stats Service**: Calculates spending statistics and trends

### Frontend (Next.js)
- **Dashboard**: Displays spending summary, charts, and insights
- **Chatbot**: AI assistant with RAG capabilities
- **Transaction History**: Shows recent transactions
- **Analytics**: Interactive charts and visualizations

## Troubleshooting

### Backend Issues
- **Import errors**: Make sure all `__init__.py` files exist
- **Supabase connection**: Verify your Supabase credentials
- **Gemini API**: Check your API key is valid

### Frontend Issues
- **API connection**: Ensure backend is running on port 8000
- **CORS errors**: Check CORS_ORIGINS in backend `.env`
- **Build errors**: Run `npm install` again

### Database Issues
- **Vector search not working**: Ensure pgvector extension is enabled
- **Function errors**: Re-run the SQL setup commands

## Next Steps

1. Customize categories in `backend/app/utils/categories.py`
2. Adjust classification thresholds in `backend/app/config/settings.py`
3. Add more insights in `backend/app/services/insights.py`
4. Customize UI components in `frontend_web/components/`

## Support

For issues or questions, check the README.md files in each directory.

