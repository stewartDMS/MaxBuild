# MaxBuild

AI-Powered Tender Automation System

## Overview

MAX Build is an AI-powered tender automation system that uses LangChain, OpenAI, and PostgreSQL to automatically extract Bill of Quantities (BOQ) from tender documents. The system processes PDF tender documents and generates structured BOQ data using advanced AI models.

This repository contains:
- **Backend API**: Node.js/Express/TypeScript REST API for tender processing
- **Frontend**: React/TypeScript SPA for user interface (in the `client` directory)

## Features

- 📄 **Document Processing**: Upload and extract text from tender PDF documents and Excel spreadsheets
- 🤖 **AI-Powered BOQ Extraction**: Automatically generate Bill of Quantities using OpenAI GPT-4
- 📊 **Multi-Format Support**: Process both PDF (.pdf) and Excel (.xlsx, .xls) tender documents
- 📋 **Structured Output**: Zod-validated schemas ensure consistent data structure
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
- **xlsx** - Excel file parsing and data extraction

### Frontend
- **React 19** - UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Build tool and dev server
- **Material-UI (MUI) v6** - Modern component library
- **Emotion** - CSS-in-JS styling engine
- **React Router v7** - Client-side routing

## Design System

The frontend implements a modern SaaS dashboard design with the following features:

### Theme Support
- **Light/Dark Mode**: Full support for light and dark themes with automatic system preference detection
- **Theme Persistence**: User theme preference is saved to localStorage
- **Seamless Switching**: Toggle between themes using the icon button in the header

### Color Palette
| Color | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| Primary | `#6366f1` (Indigo) | `#6366f1` | Main actions, active states |
| Secondary | `#7c3aed` (Purple) | `#7c3aed` | Secondary actions |
| Success | `#10b981` (Green) | `#10b981` | Completed states, positive trends |
| Warning | `#f59e0b` (Amber) | `#f59e0b` | Pending states, caution |
| Error | `#ef4444` (Red) | `#ef4444` | Failed states, errors |
| Info | `#3b82f6` (Blue) | `#3b82f6` | Informational elements |

### Typography
- **Font Family**: Inter (with fallbacks to Roboto, system fonts)
- **Heading Scale**: h1 (2.5rem) → h6 (0.875rem) with consistent weight hierarchy
- **Body Text**: 1rem (body1) and 0.875rem (body2)

### Components
- **StatCard**: Dashboard statistics with trends and icons
- **TenderCard**: Interactive tender document cards with status badges
- **StatusBadge**: Color-coded status indicators (Completed, Processing, Pending, Failed, Draft)
- **UploadArea**: Drag-and-drop file upload zone
- **RecentActivity**: Activity feed with type-based color indicators
- **DashboardLayout**: Responsive layout with sidebar navigation

### Accessibility (WCAG Compliance)
- Proper heading hierarchy (h1 → h6)
- ARIA labels on interactive elements
- Focus-visible outlines for keyboard navigation
- Skip link for main content access
- Sufficient color contrast ratios
- Screen reader-friendly navigation
- Reduced motion support (`prefers-reduced-motion`)

### Responsive Design
- **Desktop (≥900px)**: Full sidebar with navigation
- **Mobile (<900px)**: Collapsible drawer navigation with hamburger menu
- Fluid grid layouts that adapt to screen size
- Touch-friendly interactive elements

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
│   │       ├── pdf.loader.ts
│   │       └── excel.loader.ts
│   ├── controllers/        # Request handlers
│   │   └── tender.controller.ts
│   ├── services/          # Business logic
│   │   ├── tender.service.ts
│   │   ├── excel.service.ts
│   │   └── langgraph.service.ts
│   ├── routes/            # API routes
│   │   ├── index.ts
│   │   └── tender.routes.ts
│   ├── middleware/        # Express middleware
│   │   ├── upload.middleware.ts
│   │   └── error.middleware.ts
│   └── index.ts          # Application entry point
└── client/               # Frontend React app
    ├── src/
    │   ├── components/   # Reusable UI components
    │   │   ├── StatCard.tsx
    │   │   ├── StatusBadge.tsx
    │   │   ├── TenderCard.tsx
    │   │   ├── UploadArea.tsx
    │   │   └── RecentActivity.tsx
    │   ├── contexts/     # React contexts
    │   │   ├── ThemeContext.ts
    │   │   └── ThemeProvider.tsx
    │   ├── hooks/        # Custom React hooks
    │   │   └── useThemeMode.ts
    │   ├── layouts/      # Layout components
    │   │   └── DashboardLayout.tsx
    │   ├── pages/        # Page components
    │   │   └── Dashboard.tsx
    │   ├── theme/        # MUI theme configuration
    │   │   └── theme.ts
    │   ├── App.tsx       # Main application component
    │   ├── main.tsx      # React entry point
    │   └── index.css     # Global styles
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
LANGGRAPH_API_KEY=your_langgraph_api_key_here
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
  - Upload a tender PDF or Excel file and extract BOQ
  - **Body**: `multipart/form-data`
    - `tender`: PDF or Excel file (max 10MB)
    - Supported formats: `.pdf`, `.xlsx`, `.xls`
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

### LangGraph Operations

#### Get Assistant
- **GET** `/api/langgraph/assistants/:id`
  - Fetch an assistant by ID from the LangGraph API
  - **Path Parameters**:
    - `id`: The unique identifier of the assistant
  - **Response**:
    ```json
    {
      "success": true,
      "data": {
        "assistant_id": "uuid",
        "graph_id": "string",
        "config": {},
        "created_at": "timestamp",
        "updated_at": "timestamp",
        "metadata": {},
        "version": 1,
        "name": "string"
      }
    }
    ```

## Example Usage

### Upload a Tender PDF or Excel

```bash
# Upload PDF
curl -X POST http://localhost:3000/api/tenders/upload \
  -F "tender=@path/to/tender.pdf"

# Upload Excel
curl -X POST http://localhost:3000/api/tenders/upload \
  -F "tender=@path/to/tender.xlsx"
```

### Get All Tenders

```bash
curl http://localhost:3000/api/tenders
```

### Get Specific Tender

```bash
curl http://localhost:3000/api/tenders/{tender-id}
```

### Get LangGraph Assistant

```bash
curl http://localhost:3000/api/langgraph/assistants/{assistant-id}
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

### Document Ingest Testing

The document ingest feature allows you to upload PDF or Excel tender documents and automatically extract Bill of Quantities (BOQ) data using AI.

#### Prerequisites for Document Ingest

1. **Backend setup**: Ensure the backend is running with:
   - PostgreSQL database connected (`DATABASE_URL` configured)
   - OpenAI API key configured (`OPENAI_API_KEY` in `.env`)
   - Prisma migrations applied (`npm run prisma:migrate`)

2. **Uploads directory**: The `uploads/` directory must exist in the project root (created automatically on first upload)

#### Testing via Frontend (Recommended)

1. Start both backend and frontend as described above
2. Navigate to `http://localhost:5173` in your browser
3. In the Dashboard, locate the "Quick Upload" section
4. Either:
   - **Drag and drop** a PDF or Excel file onto the upload area, or
   - **Click "Browse Files"** and select a PDF or Excel file (.pdf, .xlsx, .xls)
5. Wait for the upload and BOQ extraction to complete
6. A success notification will appear with the number of BOQ items extracted
7. The extracted data is stored in the database and can be viewed via the API

#### Testing via API (curl)

```bash
# Upload a tender PDF
curl -X POST http://localhost:3000/api/tenders/upload \
  -F "tender=@path/to/your-tender.pdf"

# Upload a tender Excel
curl -X POST http://localhost:3000/api/tenders/upload \
  -F "tender=@path/to/your-tender.xlsx"

# Expected response:
# {
#   "success": true,
#   "data": {
#     "tenderId": "uuid-here",
#     "fileName": "your-tender.pdf",
#     "status": "completed",
#     "boqExtraction": {
#       "projectName": "...",
#       "items": [...],
#       "totalEstimatedCost": 1000000,
#       "currency": "USD"
#     },
#     "itemCount": 25
#   }
# }

# List all uploaded tenders
curl http://localhost:3000/api/tenders

# Get a specific tender with BOQ items
curl http://localhost:3000/api/tenders/{tender-id}
```

#### Supported Excel Formats

The system supports the following Excel formats:
- **XLSX** (.xlsx) - Office Open XML Spreadsheet (Excel 2007+)
- **XLS** (.xls) - Excel Binary File Format (Excel 97-2003)

For best results with Excel files:
- Use clear column headers (Item, Description, Quantity, Unit, Rate, Amount)
- Keep data structured in tabular format
- Avoid merged cells in data rows
- Remove password protection from files
- Ensure sheets contain actual data

#### Error Handling

The upload feature handles the following error cases:
- **Invalid file type**: Only PDF and Excel files are accepted
- **File too large**: Maximum file size is 10MB
- **Empty document**: Documents with no extractable text/data are rejected
- **Malformed Excel**: Corrupted or password-protected Excel files are rejected
- **AI extraction errors**: Network or API errors during BOQ extraction

All errors are displayed to the user via toast notifications in the frontend.

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

