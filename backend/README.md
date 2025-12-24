# UPISensei Backend

FastAPI backend for UPISensei financial intelligence system.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Create `.env` file from `.env.example` and fill in your credentials:
- Supabase URL and keys
- Gemini API key

3. Run the server:
```bash
uvicorn app.main:app --reload --port 8000
```

## API Endpoints

### Upload
- `POST /api/upload/pdf` - Upload and process PDF file
- `POST /api/upload/csv` - Upload and process CSV file

### Analysis
- `GET /api/analysis/summary/{user_id}` - Get comprehensive analysis
- `GET /api/analysis/trends/{user_id}` - Get spending trends
- `GET /api/analysis/category/{user_id}` - Get category breakdown

### Chat
- `POST /api/chat/message` - Chat with AI financial assistant

### User
- `GET /api/user/{user_id}` - Get user by ID
- `GET /api/user/phone/{phone}` - Get or create user by phone
- `GET /api/user/{user_id}/transactions` - Get user transactions

## Database Setup

Create the following tables in Supabase:

1. **users** table:
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

2. **transactions** table:
```sql
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
```

3. **memory_vectors** table (with pgvector):
```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE memory_vectors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  text TEXT NOT NULL,
  embedding vector(384),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX ON memory_vectors USING ivfflat (embedding vector_cosine_ops);
```

4. **match_memory_vectors** function:
```sql
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

