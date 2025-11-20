# MaxBuild

AI-Powered Tender Automation System - Backend API

## Overview

MAX Build is an AI-powered tender automation system that uses LangChain, OpenAI, and PostgreSQL to automatically extract Bill of Quantities (BOQ) from tender documents. The system processes PDF tender documents and generates structured BOQ data using advanced AI models.

## Features

- 📄 **PDF Processing**: Upload and extract text from tender PDF documents
- 🤖 **AI-Powered BOQ Extraction**: Automatically generate Bill of Quantities using OpenAI GPT-4
- 📊 **Structured Output**: Zod-validated schemas ensure consistent data structure
- 💾 **PostgreSQL Storage**: Persist tenders and BOQ items using Prisma ORM
- 🔄 **RESTful API**: Clean, well-documented REST endpoints

## Technology Stack

- **Node.js** with **TypeScript**
- **Express.js** - Web framework
- **LangChain** - AI orchestration framework
- **OpenAI GPT-4** - Language model for BOQ extraction
- **PostgreSQL** - Database
- **Prisma ORM** - Database toolkit
- **Zod** - Schema validation
- **Multer** - File upload handling
- **pdf-parse** - PDF text extraction

## Project Structure

```
src/
├── ai/
│   ├── chains/         # LangChain chains for AI processing
│   │   └── boq-generation.chain.ts
│   ├── schemas/        # Zod schemas for structured output
│   │   └── boq.schema.ts
│   └── loaders/        # Document loaders
│       └── pdf.loader.ts
├── controllers/        # Request handlers
│   └── tender.controller.ts
├── services/          # Business logic
│   └── tender.service.ts
├── routes/            # API routes
│   ├── index.ts
│   └── tender.routes.ts
├── middleware/        # Express middleware
│   ├── upload.middleware.ts
│   └── error.middleware.ts
└── index.ts          # Application entry point
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/stewartDMS/MaxBuild.git
cd MaxBuild
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your configuration:
```env
PORT=3000
NODE_ENV=development
OPENAI_API_KEY=your_openai_api_key_here
DATABASE_URL="postgresql://user:password@localhost:5432/maxbuild?schema=public"
MAX_FILE_SIZE=10485760
```

4. Set up the database:
```bash
npm run prisma:generate
npm run prisma:migrate
```

5. Build the project:
```bash
npm run build
```

6. Start the server:
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## API Endpoints

### Health Check
- **GET** `/api/health`
  - Check if the API is running

### Tender Operations

#### Upload Tender
- **POST** `/api/tenders/upload`
  - Upload a tender PDF and extract BOQ
  - **Body**: `multipart/form-data`
    - `tender`: PDF file (max 10MB)
  - **Response**:
    ```json
    {
      "success": true,
      "data": {
        "tenderId": "uuid",
        "fileName": "tender.pdf",
        "status": "completed",
        "boqExtraction": {
          "projectName": "Example Project",
          "items": [...],
          "totalEstimatedCost": 1000000,
          "currency": "USD"
        },
        "itemCount": 25
      }
    }
    ```

#### List Tenders
- **GET** `/api/tenders?skip=0&take=10`
  - Get a paginated list of all tenders
  - **Query Parameters**:
    - `skip`: Number of records to skip (default: 0)
    - `take`: Number of records to return (default: 10)

#### Get Tender
- **GET** `/api/tenders/:id`
  - Get a specific tender by ID with all BOQ items

#### Delete Tender
- **DELETE** `/api/tenders/:id`
  - Delete a tender and all associated BOQ items

## Example Usage

### Upload a Tender PDF

```bash
curl -X POST http://localhost:3000/api/tenders/upload \
  -F "tender=@path/to/tender.pdf"
```

### Get All Tenders

```bash
curl http://localhost:3000/api/tenders
```

### Get Specific Tender

```bash
curl http://localhost:3000/api/tenders/{tender-id}
```

## BOQ Schema

The system extracts the following information from tender documents:

```typescript
{
  projectName?: string,
  projectLocation?: string,
  items: [
    {
      itemNumber: string,
      description: string,
      quantity: number,
      unit: string,
      unitRate?: number,
      amount?: number,
      category?: string
    }
  ],
  totalEstimatedCost?: number,
  currency: string,
  extractionDate: string,
  notes?: string
}
```

## Development

### Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations

## License

ISC

