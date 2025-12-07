# Setup Guide for MaxBuild

## Quick Start Options

MaxBuild provides **two upload endpoints** for different use cases:

### Option 1: Mock Endpoint (No Setup Required) ✅ READY TO USE

**Purpose**: Demo and testing without external dependencies

**Endpoint**: `POST /api/tenders/upload-mock`

**Requirements**: None - works immediately

**Usage**:
```bash
# Start server
npm install
npx ts-node src/index.ts

# Test without file
curl -X POST http://localhost:3000/api/tenders/upload-mock

# Test with file
curl -X POST http://localhost:3000/api/tenders/upload-mock \
  -F "tender=@file.pdf"

# Test with context
curl -X POST http://localhost:3000/api/tenders/upload-mock \
  -F "context=Focus on electrical and plumbing items"
```

**Features**:
- ✅ No database required
- ✅ No OpenAI API key required
- ✅ Returns realistic mock BOQ data
- ✅ All 5 processing phases logged
- ✅ Context-aware item generation
- ❌ Does not save to database
- ❌ Does not use real AI

### Option 2: Real Endpoint (Requires Setup) ⚙️ CONFIGURATION NEEDED

**Purpose**: Production use with real AI and database

**Endpoint**: `POST /api/tenders/upload`

**Requirements**: 
- ✅ OpenAI API key
- ✅ PostgreSQL database

**Setup Steps**:

#### 1. Create Environment File

```bash
cp .env.example .env
```

Edit `.env` and configure:

```bash
# Required: Your OpenAI API key
OPENAI_API_KEY=sk-your-actual-api-key-here

# Required: PostgreSQL connection string
DATABASE_URL="postgresql://user:password@localhost:5432/maxbuild?schema=public"

# Optional
PORT=3000
NODE_ENV=development
MAX_FILE_SIZE=10485760
```

#### 2. Setup PostgreSQL Database

**Using Docker**:
```bash
docker run --name maxbuild-postgres \
  -e POSTGRES_USER=maxbuild \
  -e POSTGRES_PASSWORD=yourpassword \
  -e POSTGRES_DB=maxbuild \
  -p 5432:5432 \
  -d postgres:15
```

**Or install locally**: [PostgreSQL Downloads](https://www.postgresql.org/download/)

#### 3. Run Database Migrations

```bash
npm run prisma:generate
npm run prisma:migrate
```

#### 4. Start the Server

```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

#### 5. Test Real Endpoint

```bash
# Upload PDF
curl -X POST http://localhost:3000/api/tenders/upload \
  -F "tender=@path/to/tender.pdf"

# With context
curl -X POST http://localhost:3000/api/tenders/upload \
  -F "tender=@path/to/tender.pdf" \
  -F "context=Focus on electrical items"

# With review mode
curl -X POST http://localhost:3000/api/tenders/upload \
  -F "tender=@path/to/tender.pdf" \
  -F "requiresReview=true"
```

**Features**:
- ✅ Real AI-powered BOQ extraction
- ✅ Saves to PostgreSQL database
- ✅ Full review workflow
- ✅ Context-aware extraction
- ✅ Supports PDF, Excel, CSV
- ⚙️ Requires OpenAI API key
- ⚙️ Requires database setup

## Frontend Setup

The frontend connects to the **real endpoint** by default.

### Prerequisites for Frontend

Before using the frontend, ensure:
1. Backend server is running
2. OpenAI API key is configured (for real endpoint)
3. Database is set up and migrations are run

### Frontend Installation

```bash
cd client
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`

### Using the Frontend

**With Real Backend (Recommended)**:
1. Configure `.env` with OpenAI API key
2. Setup PostgreSQL database
3. Run migrations
4. Start backend: `npm run dev`
5. Start frontend: `cd client && npm run dev`
6. Upload documents at `http://localhost:5173`

**Testing Frontend Without Backend Setup**:

If you want to test the frontend UI without setting up the backend:
1. Start backend with mock endpoint only: `npx ts-node src/index.ts`
2. The frontend will show errors when trying to upload (expected)
3. Use the mock endpoint directly via curl for testing

## Troubleshooting

### "Server returned an empty response"

**Cause**: Frontend is trying to use the real endpoint without proper configuration.

**Solutions**:

1. **Use Mock Endpoint** (easiest):
   ```bash
   curl -X POST http://localhost:3000/api/tenders/upload-mock
   ```

2. **Configure Real Endpoint**:
   - Add OpenAI API key to `.env`
   - Setup PostgreSQL database
   - Run migrations

### "Cannot connect to database"

**Cause**: PostgreSQL is not running or connection string is wrong.

**Solutions**:
1. Verify PostgreSQL is running: `docker ps` or `pg_isready`
2. Check `DATABASE_URL` in `.env`
3. Test connection: `psql $DATABASE_URL`

### "OpenAI API authentication failed"

**Cause**: Invalid or missing API key.

**Solutions**:
1. Verify `OPENAI_API_KEY` in `.env`
2. Check key is valid at [OpenAI API Keys](https://platform.openai.com/api-keys)
3. Ensure no extra spaces or quotes in `.env`

## Comparison: Mock vs Real Endpoint

| Feature | Mock Endpoint | Real Endpoint |
|---------|--------------|---------------|
| **URL** | `/api/tenders/upload-mock` | `/api/tenders/upload` |
| **Setup Required** | ❌ None | ✅ OpenAI + Database |
| **AI Processing** | Simulated | Real GPT-4 |
| **Database Storage** | ❌ Not saved | ✅ Saved to PostgreSQL |
| **Processing Time** | ~500ms | 10-60 seconds |
| **Cost** | Free | OpenAI API costs |
| **Use Case** | Demo, Testing | Production |
| **Context Support** | ✅ Yes | ✅ Yes |
| **File Upload** | ✅ Yes | ✅ Yes |
| **Review Workflow** | ❌ No | ✅ Yes |

## Getting OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to [API Keys](https://platform.openai.com/api-keys)
4. Click "Create new secret key"
5. Copy the key (starts with `sk-`)
6. Add to `.env`: `OPENAI_API_KEY=sk-your-key-here`

**Note**: OpenAI API usage incurs costs. Check [OpenAI Pricing](https://openai.com/pricing) for current rates.

## Quick Reference

### For Demo/Testing (No Setup)
```bash
# Start server
npm install && npx ts-node src/index.ts

# Test mock endpoint
curl -X POST http://localhost:3000/api/tenders/upload-mock
```

### For Production Use (Full Setup)
```bash
# 1. Setup
cp .env.example .env
# Edit .env with your keys

# 2. Database
docker run --name maxbuild-postgres \
  -e POSTGRES_USER=maxbuild \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=maxbuild \
  -p 5432:5432 -d postgres:15

# 3. Migrations
npm run prisma:generate
npm run prisma:migrate

# 4. Start
npm run dev

# 5. Test
curl -X POST http://localhost:3000/api/tenders/upload \
  -F "tender=@file.pdf"
```

## Next Steps

- **New Users**: Start with the mock endpoint to understand the workflow
- **Developers**: Use mock endpoint for frontend development
- **Production**: Configure real endpoint with OpenAI API and database
- **Testing**: See `MOCK_ENDPOINT_TESTING.md` for comprehensive test scenarios
