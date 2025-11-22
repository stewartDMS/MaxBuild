# MaxBuild

AI-Powered Tender Automation System

## Overview

MAX Build is an AI-powered tender automation system that uses LangChain, OpenAI, and PostgreSQL to automatically extract Bill of Quantities (BOQ) from tender documents. The system processes PDF tender documents and generates structured BOQ data using advanced AI models.

This repository contains:
- **Backend API**: Node.js/Express/TypeScript REST API for tender processing
- **Frontend**: React/TypeScript SPA for user interface (in the `client` directory)

## Features

- 📄 **PDF Processing**: Upload and extract text from tender PDF documents
- 🤖 **AI-Powered BOQ Extraction**: Automatically generate Bill of Quantities using OpenAI GPT-4
- 📊 **Structured Output**: Zod-validated schemas ensure consistent data structure
- 💾 **PostgreSQL Storage**: Persist tenders and BOQ items using Prisma ORM
- 🔄 **RESTful API**: Clean, well-documented REST endpoints

## Technology Stack

### Backend
- **Node.js** with **TypeScript**
- **Express.js** - Web framework
- **LangChain** - AI orchestration framework
- **OpenAI GPT-4** - Language model for BOQ extraction
- **PostgreSQL** - Database
- **Prisma ORM** - Database toolkit
- **Zod** - Schema validation
- **Multer** - File upload handling
- **pdf-parse** - PDF text extraction

### Frontend
- **React 19** - UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Build tool and dev server
- **React Router** (future) - Client-side routing

## Project Structure

```
MaxBuild/
├── src/                    # Backend source code
│   ├── ai/
│   │   ├── chains/         # LangChain chains for AI processing
│   │   │   └── boq-generation.chain.ts
│   │   ├── schemas/        # Zod schemas for structured output
│   │   │   └── boq.schema.ts
│   │   └── loaders/        # Document loaders
│   │       └── pdf.loader.ts
│   ├── controllers/        # Request handlers
│   │   └── tender.controller.ts
│   ├── services/          # Business logic
│   │   └── tender.service.ts
│   ├── routes/            # API routes
│   │   ├── index.ts
│   │   └── tender.routes.ts
│   ├── middleware/        # Express middleware
│   │   ├── upload.middleware.ts
│   │   └── error.middleware.ts
│   └── index.ts          # Application entry point
└── client/               # Frontend React app
    ├── src/
    │   ├── App.tsx       # Main application component
    │   ├── main.tsx      # React entry point
    │   └── assets/       # Static assets
    ├── public/           # Public files
    ├── index.html        # HTML template
    └── vite.config.ts    # Vite configuration
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- OpenAI API key

### Backend Installation

1. Clone the repository:
```bash
git clone https://github.com/stewartDMS/MaxBuild.git
cd MaxBuild
```

2. Install backend dependencies:
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

5. Build the backend:
```bash
npm run build
```

6. Start the backend server:
```bash
# Development mode (with hot reload)
npm run dev

# Production mode
npm start
```

The backend API will be running at `http://localhost:3000`

### Frontend Installation

1. Navigate to the client directory:
```bash
cd client
```

2. Install frontend dependencies:
```bash
npm install
```

3. Start the frontend development server:
```bash
npm run dev
```

The frontend will be running at `http://localhost:5173` (default Vite port)

4. Build the frontend for production:
```bash
npm run build
```

The production build will be in the `client/dist` directory.

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

### Backend Development

#### Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations

### Frontend Development

Navigate to the `client` directory first:
```bash
cd client
```

#### Scripts

- `npm run dev` - Start Vite development server with hot module replacement
- `npm run build` - Build production-ready frontend (TypeScript compile + Vite build)
- `npm run lint` - Run ESLint for code quality checks
- `npm run preview` - Preview production build locally

### Full Stack Development

To run both backend and frontend simultaneously in development:

1. In one terminal, start the backend:
```bash
npm run dev
```

2. In another terminal, start the frontend:
```bash
cd client
npm run dev
```

The backend API will be at `http://localhost:3000` and the frontend at `http://localhost:5173`.

## Deployment

### Backend Deployment

The backend can be deployed to any Node.js hosting platform (e.g., Heroku, Railway, Render). Make sure to:
- Set all required environment variables
- Run database migrations
- Build the TypeScript code before starting

### Frontend Deployment (Vercel)

The frontend is configured for easy deployment to Vercel:

1. Connect your GitHub repository to Vercel
2. Configure the project:
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Deploy

The `client/vercel.json` file includes the necessary configuration for SPA routing and optimal caching.

Alternatively, you can deploy using the Vercel CLI:
```bash
cd client
vercel --prod
```

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly (backend and frontend)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Code Style

- Use TypeScript for type safety
- Follow the existing code structure and patterns
- Run linters before committing (`npm run lint` in both root and client directories)
- Write meaningful commit messages

## License

ISC

