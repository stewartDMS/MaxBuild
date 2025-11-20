# MAX Build Architecture

## System Overview

MAX Build is a Node.js/TypeScript backend service that automates the extraction of Bill of Quantities (BOQ) from tender documents using AI.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
│  (REST API Clients, Frontend, cURL, Postman, etc.)              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTP/HTTPS
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Express.js Server                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Middleware Layer                                          │   │
│  │  • CORS                                                   │   │
│  │  • Rate Limiting (100 req/15min general, 10 upload/15min)│   │
│  │  • Body Parser (JSON, URL-encoded)                       │   │
│  │  • File Upload (Multer - PDF only, 10MB max)            │   │
│  │  • Error Handler                                         │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Routes Layer                             │
│  /api/health           - Health check                            │
│  /api/tenders/upload   - Upload & process tender PDF            │
│  /api/tenders          - List all tenders                        │
│  /api/tenders/:id      - Get/Delete specific tender             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Controllers Layer                           │
│  TenderController                                                │
│   • uploadTender()    - Handle PDF upload                        │
│   • getTender()       - Retrieve tender details                  │
│   • listTenders()     - List with pagination                     │
│   • deleteTender()    - Remove tender                            │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Services Layer                             │
│  TenderService                                                   │
│   • processTender()   - Orchestrate PDF → BOQ pipeline           │
│   • getTender()       - Fetch tender with BOQ items              │
│   • listTenders()     - Query tenders                            │
│   • deleteTender()    - Remove tender data                       │
└───────────┬────────────────────────────────────┬────────────────┘
            │                                    │
            │                                    │
            ▼                                    ▼
┌─────────────────────────┐      ┌──────────────────────────────┐
│    AI Processing Layer  │      │   Database Layer (Prisma)    │
│                         │      │                              │
│  ┌──────────────────┐   │      │  ┌───────────────────────┐  │
│  │  PDF Loader      │   │      │  │  PostgreSQL Database  │  │
│  │  • pdf-parse     │   │      │  │                       │  │
│  │  • Text extract  │   │      │  │  Tables:              │  │
│  └──────────────────┘   │      │  │   • Tender            │  │
│           │              │      │  │   • BOQ               │  │
│           ▼              │      │  └───────────────────────┘  │
│  ┌──────────────────┐   │      │                              │
│  │  Zod Schemas     │   │      │  Prisma ORM (Singleton)      │
│  │  • BOQItemSchema │   │      │   • Type-safe queries        │
│  │  • BOQExtraction │   │      │   • Migrations               │
│  │  • Validation    │   │      │   • Relations                │
│  └──────────────────┘   │      └──────────────────────────────┘
│           │              │
│           ▼              │
│  ┌──────────────────┐   │      ┌──────────────────────────────┐
│  │ LangChain Chain  │───┼─────▶│  OpenAI GPT-4 Mini API       │
│  │ BOQGeneration    │   │      │                              │
│  │  • Prompt        │   │      │  • Structured output         │
│  │  • Structured    │◀──┼──────│  • JSON with schema          │
│  │    output        │   │      │  • BOQ extraction            │
│  └──────────────────┘   │      └──────────────────────────────┘
└─────────────────────────┘
```

## Data Flow: Tender Upload Process

```
1. Client uploads PDF
        │
        ▼
2. Multer saves to uploads/ & validates
        │
        ▼
3. TenderController.uploadTender()
        │
        ▼
4. TenderService.processTender()
        │
        ├──▶ PDFLoader.load() → Extract text
        │
        ├──▶ Save Tender record to DB (status: processing)
        │
        ├──▶ BOQGenerationChain.run()
        │         │
        │         ├──▶ Format prompt with tender text
        │         │
        │         ├──▶ OpenAI API (with structured output)
        │         │
        │         └──▶ Return validated BOQExtraction
        │
        ├──▶ Save BOQ items to DB
        │
        └──▶ Update Tender status to 'completed'
        │
        ▼
5. Return JSON response with:
   • Tender ID
   • BOQ extraction data
   • Item count
        │
        ▼
6. Clean up uploaded file
```

## Technology Stack

### Backend Framework
- **Node.js** (v18+) - Runtime environment
- **TypeScript** - Type safety
- **Express.js** - Web framework

### AI & ML
- **LangChain** - AI orchestration framework
- **OpenAI GPT-4 Mini** - Language model
- **Zod** - Schema validation & structured output

### Database
- **PostgreSQL** - Relational database
- **Prisma ORM** - Database toolkit with type safety

### File Processing
- **Multer** - File upload handling
- **pdf-parse** - PDF text extraction

### Security & Utilities
- **express-rate-limit** - Rate limiting
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment configuration

## Folder Structure Details

```
src/
├── ai/                          # AI-related components
│   ├── chains/                  # LangChain processing chains
│   │   └── boq-generation.chain.ts
│   ├── schemas/                 # Zod validation schemas
│   │   └── boq.schema.ts
│   └── loaders/                 # Document loaders
│       └── pdf.loader.ts
│
├── controllers/                 # Request handlers
│   └── tender.controller.ts
│
├── services/                    # Business logic
│   └── tender.service.ts
│
├── routes/                      # API route definitions
│   ├── index.ts
│   └── tender.routes.ts
│
├── middleware/                  # Express middleware
│   ├── upload.middleware.ts     # File upload config
│   ├── rate-limit.middleware.ts # Rate limiting
│   └── error.middleware.ts      # Error handling
│
├── lib/                         # Shared utilities
│   └── prisma.ts               # Prisma client singleton
│
└── index.ts                    # Application entry point
```

## Database Schema

```
┌─────────────────────────┐
│       Tender            │
├─────────────────────────┤
│ id (PK)                 │
│ fileName                │
│ fileSize                │
│ mimeType                │
│ extractedText           │
│ status                  │
│ createdAt               │
│ updatedAt               │
└───────────┬─────────────┘
            │ 1:N
            │
┌───────────▼─────────────┐
│       BOQ               │
├─────────────────────────┤
│ id (PK)                 │
│ tenderId (FK)           │
│ itemNumber              │
│ description             │
│ quantity                │
│ unit                    │
│ unitRate                │
│ amount                  │
│ category                │
│ createdAt               │
│ updatedAt               │
└─────────────────────────┘
```

## Security Features

1. **Rate Limiting**
   - Upload endpoint: 10 requests per 15 minutes
   - General API: 100 requests per 15 minutes

2. **File Validation**
   - Only PDF files accepted
   - Maximum 10MB file size
   - MIME type verification

3. **Environment Variables**
   - Sensitive data in .env
   - No credentials in code

4. **Error Handling**
   - Global error middleware
   - Proper HTTP status codes
   - Sanitized error messages

5. **Database Security**
   - Prisma ORM (SQL injection prevention)
   - Parameterized queries
   - Connection pooling

## Scalability Considerations

1. **Horizontal Scaling**
   - Stateless API design
   - Can run multiple instances behind load balancer

2. **Database**
   - Indexed fields (tenderId)
   - Pagination support
   - Connection pooling via Prisma

3. **File Storage**
   - Currently local storage
   - Can be migrated to S3/cloud storage

4. **Caching** (Future Enhancement)
   - Redis for rate limiting
   - Cache frequent queries

## API Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "message": "Error description"
  }
}
```

## Environment Configuration

Required environment variables:
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `OPENAI_API_KEY` - OpenAI API key
- `DATABASE_URL` - PostgreSQL connection string
- `MAX_FILE_SIZE` - Maximum upload size in bytes

## Monitoring & Logging

- Request logging (timestamp, method, path)
- Error logging with stack traces in development
- Console output for key operations

## Future Enhancements

1. **Authentication & Authorization**
   - JWT tokens
   - User management
   - Role-based access

2. **Webhook Support**
   - Async processing notifications
   - Status updates

3. **Batch Processing**
   - Multiple file uploads
   - Background job queue

4. **Advanced AI Features**
   - Custom training data
   - Model fine-tuning
   - Multi-language support

5. **Analytics**
   - Usage metrics
   - Processing statistics
   - Cost tracking
