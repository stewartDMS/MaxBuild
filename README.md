# MaxBuild

AI-Powered Tender Automation System

## Overview

MAX Build is an AI-powered tender automation system that uses LangChain, OpenAI, and PostgreSQL to automatically extract Bill of Quantities (BOQ) from tender documents. The system processes PDF tender documents and generates structured BOQ data using advanced AI models.

This repository contains:
- **Backend API**: Node.js/Express/TypeScript REST API for tender processing
- **Frontend**: React/TypeScript SPA for user interface (in the `client` directory)

## Features

- 📄 **Document Processing**: Upload and extract text from tender PDF documents, Excel spreadsheets, and CSV files
- 🤖 **AI-Powered BOQ Extraction**: Automatically generate Bill of Quantities using OpenAI GPT-4
- 💬 **Custom Extraction Context**: Provide specific instructions to guide AI extraction (e.g., focus on specific item types, include/exclude certain details)
- 📊 **Multi-Format Support**: Process PDF (.pdf), Excel (.xlsx, .xls), and CSV (.csv) tender documents
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
- **exceljs** - Excel file parsing and data extraction (secure, actively maintained)
- **csv-parse** - CSV file parsing

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
│   │       ├── excel.loader.ts
│   │       └── csv.loader.ts
│   ├── controllers/        # Request handlers
│   │   └── tender.controller.ts
│   ├── services/          # Business logic
│   │   ├── tender.service.ts
│   │   ├── excel.service.ts
│   │   ├── csv.service.ts
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
  - Upload a tender PDF, Excel, or CSV file and extract BOQ
  - **Body**: `multipart/form-data`
    - `tender`: PDF, Excel, or CSV file (max 10MB)
    - `context` (optional): Text instructions to guide AI extraction
    - Supported formats: `.pdf`, `.xlsx`, `.xls`, `.csv`
  - **Success Response**:
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
  - **Error Response**:
    ```json
    {
      "success": false,
      "error": {
        "message": "The Excel file appears to be corrupted or malformed",
        "reason": "CORRUPT_FILE",
        "details": {
          "fileType": "Excel",
          "suggestion": "Please ensure the file is not corrupted and try again"
        }
      }
    }
    ```
  - **Status Codes**:
    - `200`: Success
    - `400`: Validation error (file type, size, structure, etc.)
    - `413`: File too large
    - `500`: Server or AI extraction error

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

### Upload a Tender PDF, Excel, or CSV

```bash
# Upload PDF
curl -X POST http://localhost:3000/api/tenders/upload \
  -F "tender=@path/to/tender.pdf"

# Upload Excel
curl -X POST http://localhost:3000/api/tenders/upload \
  -F "tender=@path/to/tender.xlsx"

# Upload CSV
curl -X POST http://localhost:3000/api/tenders/upload \
  -F "tender=@path/to/tender.csv"

# Upload with Extraction Context
curl -X POST http://localhost:3000/api/tenders/upload \
  -F "tender=@path/to/tender.pdf" \
  -F "context=Focus on electrical items only and include all labor costs"
```

**Success Response:**
```json
{
  "success": true,
  "data": {
    "tenderId": "abc123",
    "fileName": "tender.pdf",
    "status": "completed",
    "boqExtraction": {
      "projectName": "Highway Construction",
      "items": [
        {
          "itemNumber": "1",
          "description": "Excavation of foundation",
          "quantity": 100,
          "unit": "m3",
          "unitRate": 50,
          "amount": 5000
        }
      ],
      "totalEstimatedCost": 5000,
      "currency": "USD"
    },
    "itemCount": 1
  }
}
```

### Error Response Examples

**Invalid File Type:**
```bash
curl -X POST http://localhost:3000/api/tenders/upload \
  -F "tender=@document.docx"

# Response (400):
{
  "success": false,
  "error": {
    "message": "File type 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' is not supported",
    "reason": "UNSUPPORTED_FILE_TYPE",
    "details": {
      "fileType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "supportedTypes": [
        "PDF (.pdf)",
        "Excel (.xlsx, .xls)",
        "CSV (.csv)"
      ],
      "suggestion": "Please upload one of the supported file types: PDF (.pdf), Excel (.xlsx, .xls), CSV (.csv)"
    }
  }
}
```

**Empty File:**
```bash
curl -X POST http://localhost:3000/api/tenders/upload \
  -F "tender=@empty.pdf"

# Response (400):
{
  "success": false,
  "error": {
    "message": "The PDF file is empty or contains no extractable data",
    "reason": "EMPTY_FILE",
    "details": {
      "fileType": "PDF",
      "details": "No text could be extracted from the PDF",
      "suggestion": "Please ensure the file contains data and try again"
    }
  }
}
```

**Password Protected Excel:**
```bash
curl -X POST http://localhost:3000/api/tenders/upload \
  -F "tender=@protected.xlsx"

# Response (400):
{
  "success": false,
  "error": {
    "message": "Cannot process password-protected Excel files",
    "reason": "PASSWORD_PROTECTED_FILE",
    "details": {
      "fileType": "Excel",
      "suggestion": "Please remove the password protection and try again"
    }
  }
}
```

**File Too Large:**
```bash
curl -X POST http://localhost:3000/api/tenders/upload \
  -F "tender=@large-tender.pdf"

# Response (413):
{
  "success": false,
  "error": {
    "message": "File size 15.50MB exceeds the maximum limit of 10.00MB",
    "reason": "FILE_SIZE_LIMIT_EXCEEDED",
    "details": {
      "fileSize": 16252928,
      "maxSize": 10485760,
      "fileSizeMB": "15.50",
      "maxSizeMB": "10.00",
      "suggestion": "Please upload a file smaller than 10.00MB"
    }
  }
}
```

**AI Extraction Error:**
```bash
curl -X POST http://localhost:3000/api/tenders/upload \
  -F "tender=@tender.pdf"

# Response (500) - if OpenAI API key is invalid:
{
  "success": false,
  "error": {
    "message": "OpenAI API authentication failed",
    "reason": "AI_EXTRACTION_FAILED",
    "details": {
      "reason": "Invalid or missing API key",
      "suggestion": "Please check your OPENAI_API_KEY environment variable"
    }
  }
}
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

The document ingest feature allows you to upload PDF, Excel, or CSV tender documents and automatically extract Bill of Quantities (BOQ) data using AI.

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
4. **(Optional)** Enter extraction context in the "Extraction Context" field to guide the AI (e.g., "Focus on electrical items only")
5. Either:
   - **Drag and drop** a PDF, Excel, or CSV file onto the upload area, or
   - **Click "Browse Files"** and select a file (.pdf, .xlsx, .xls, .csv)
6. Wait for the upload and BOQ extraction to complete
7. A success notification will appear with the number of BOQ items extracted
8. The extracted data is stored in the database and can be viewed via the API

#### Testing via API (curl)

```bash
# Upload a tender PDF
curl -X POST http://localhost:3000/api/tenders/upload \
  -F "tender=@path/to/your-tender.pdf"

# Upload a tender Excel
curl -X POST http://localhost:3000/api/tenders/upload \
  -F "tender=@path/to/your-tender.xlsx"

# Upload a tender CSV
curl -X POST http://localhost:3000/api/tenders/upload \
  -F "tender=@path/to/your-tender.csv"

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

#### Extraction Context Feature

The extraction context feature allows you to provide specific instructions to guide the AI's extraction process. This helps ensure the BOQ extraction aligns with your specific requirements.

**How to Use:**

In the frontend:
1. Locate the "Extraction Context (Optional)" text field in the upload area
2. Enter your specific instructions (e.g., "Focus on electrical items only", "Include all labor costs", "Extract by building section")
3. Upload your document - the AI will incorporate your instructions during extraction

Via API:
```bash
curl -X POST http://localhost:3000/api/tenders/upload \
  -F "tender=@path/to/tender.pdf" \
  -F "context=Focus on electrical and plumbing items only"
```

**Example Use Cases:**

- **Filter by category**: "Extract only electrical and HVAC items"
- **Focus on specific details**: "Include all labor costs and material specifications"
- **Organize by section**: "Group items by building floor or area"
- **Emphasize accuracy**: "Pay special attention to unit rates and quantities"
- **Custom requirements**: "Extract items related to sustainability or green building materials"

**Benefits:**

- More accurate extractions aligned with your specific needs
- Better handling of complex or ambiguous documents
- Ability to focus on specific aspects of large tender documents
- Improved categorization and organization of extracted items

**Note:** The extraction context is optional. If not provided, the AI will perform standard BOQ extraction using default instructions. The context is saved with the tender for future reference.

#### Supported Formats

The system supports the following file formats:

**PDF Documents**
- Portable Document Format (.pdf)

**Excel Spreadsheets**
- XLSX (.xlsx) - Office Open XML Spreadsheet (Excel 2007+)
- XLS (.xls) - Excel Binary File Format (Excel 97-2003)

**CSV Files**
- Comma-Separated Values (.csv) - Standard CSV format

For best results with Excel and CSV files:
- Use clear column headers (Item, Description, Quantity, Unit, Rate, Amount)
- Keep data structured in tabular format
- Avoid merged cells in data rows
- Remove password protection from files
- Ensure files contain actual data
- Use standard CSV delimiters (comma)

#### Error Handling

The system provides comprehensive error handling with detailed feedback for various issues:

**File Validation Errors:**
- **Invalid file type**: Only PDF (.pdf), Excel (.xlsx, .xls), and CSV (.csv) files are accepted
- **File too large**: Maximum file size is 10MB (configurable via `MAX_FILE_SIZE` env variable)
- **No file uploaded**: User must select a file before uploading

**File Content Errors:**
- **Empty document**: Documents with no extractable text/data are rejected
- **Corrupted file**: PDF, Excel, or CSV files that are damaged or malformed
- **Password-protected files**: Excel files with password protection cannot be processed
- **Invalid structure**: Files that don't contain BOQ-like data structures

**Processing Errors:**
- **AI extraction errors**: OpenAI API failures (authentication, rate limits, network issues)
- **Parsing errors**: Issues reading or interpreting file content
- **Missing data**: Files missing required columns or information

**Error Response Format:**

All API errors return a consistent JSON structure:

```json
{
  "success": false,
  "error": {
    "message": "Human-readable error message",
    "reason": "ERROR_CODE",
    "details": {
      "suggestion": "How to fix the issue",
      "additionalInfo": "Context-specific details"
    }
  }
}
```

**Error Codes:**

| Code | Description | User Action |
|------|-------------|-------------|
| `FILE_VALIDATION_ERROR` | File failed validation | Check file requirements |
| `UNSUPPORTED_FILE_TYPE` | File type not supported | Use PDF, Excel, or CSV |
| `CORRUPT_FILE` | File is corrupted | Try re-saving or re-downloading the file |
| `PASSWORD_PROTECTED_FILE` | File is password-protected | Remove password protection |
| `EMPTY_FILE` | File contains no data | Ensure file has content |
| `INVALID_STRUCTURE` | File structure unsuitable | Check file format and columns |
| `FILE_SIZE_LIMIT_EXCEEDED` | File too large | Reduce file size or split into parts |
| `AI_EXTRACTION_FAILED` | AI service error | Check API key or try again later |
| `PARSING_ERROR` | File parsing failed | Verify file is not corrupted |

All errors are displayed to the user via detailed toast notifications in the frontend, including:
- Error title and description
- Suggested actions to resolve the issue
- Additional context when available

## Troubleshooting

### Common Upload Issues

#### "Unsupported File Type"
**Problem:** The file type is not supported.

**Solution:**
- Ensure your file is one of the supported formats:
  - PDF: `.pdf`
  - Excel: `.xlsx` or `.xls`
  - CSV: `.csv`
- Check the file extension matches the actual file format
- If the file was renamed, ensure it's in the correct format

#### "File Too Large"
**Problem:** File exceeds the 10MB size limit.

**Solution:**
- Compress the file or reduce its size
- Split large documents into smaller parts
- Remove unnecessary pages, sheets, or images
- For Excel/CSV: Remove unnecessary columns or rows

#### "Corrupted File" or "Password Protected"
**Problem:** File cannot be read or is password-protected.

**Solution:**
- For PDF: Try opening in Adobe Acrobat and saving as a new file
- For Excel: Remove password protection (Review → Unprotect)
- Re-download the file if it may be corrupted during download
- Save as a new file in Excel/PDF software

#### "Empty File" or "No Data Found"
**Problem:** File contains no extractable content.

**Solution:**
- Ensure the PDF contains actual text (not just images)
- For scanned PDFs: Use OCR (Optical Character Recognition) first
- For Excel/CSV: Verify there are data rows (not just headers)
- Check that sheets/pages aren't blank

#### "Invalid File Structure"
**Problem:** File doesn't contain recognizable BOQ data.

**Solution:**
- Ensure your file has BOQ-like structure with columns such as:
  - Item Number
  - Description
  - Quantity
  - Unit
  - Rate
  - Amount
- Format data in a tabular structure
- Use clear column headers in the first row

#### "AI Extraction Failed"
**Problem:** The AI service encountered an error.

**Common Causes:**
- Invalid or missing OpenAI API key
- API rate limit exceeded
- Network connectivity issues
- OpenAI service outage

**Solution:**
- Verify `OPENAI_API_KEY` is set correctly in `.env`
- Check your OpenAI account usage and limits
- Wait a few minutes and try again
- Check OpenAI status page for service issues

### Excel/CSV Specific Issues

**Problem:** Excel file won't upload

**Checklist:**
- ✓ File is `.xlsx` or `.xls` format
- ✓ File is not password-protected
- ✓ File contains at least one sheet with data
- ✓ First row contains headers
- ✓ Data starts from row 2
- ✓ No merged cells in data rows

**Problem:** CSV file parsing errors

**Checklist:**
- ✓ File uses UTF-8 encoding
- ✓ Delimiter is comma (`,`)
- ✓ Quotes are properly escaped
- ✓ First row contains headers
- ✓ No extra blank lines

### PDF Specific Issues

**Problem:** PDF text extraction fails

**Solutions:**
- Ensure PDF contains selectable text (not scanned images)
- For scanned PDFs:
  1. Use Adobe Acrobat OCR feature
  2. Or use online OCR tools
  3. Save as searchable PDF
- Check PDF isn't corrupted by opening in multiple PDF readers
- Try saving PDF as a new file

### Logs and Debugging

**Backend Logs:**

The backend provides structured logging for all operations:

```bash
# View backend logs in development
npm run dev

# Look for these log indicators:
📄 Processing PDF file...       # File type detected
📊 Loading Excel file...        # Excel processing
✅ File loaded successfully     # Success
❌ Error loading file           # Failure
🤖 Running AI BOQ extraction... # AI processing
```

**Error Details in Logs:**

Errors include context for debugging:
- Timestamp
- File information (name, size, type)
- Error reason and message
- Stack trace (in development mode)
- Request details

**Frontend Error Display:**

The UI shows detailed errors with:
- Clear error title
- Descriptive message
- Actionable suggestions
- Additional context (file size, supported types, etc.)

### Getting Help

If you encounter persistent issues:

1. **Check the logs** for detailed error information
2. **Verify your environment**:
   - Node.js version 18+
   - All dependencies installed (`npm install`)
   - Environment variables configured (`.env`)
   - Database connected
   - OpenAI API key valid
3. **Try a sample file** to rule out file-specific issues
4. **Review the error details** in the UI notification
5. **Check GitHub issues** for similar problems
6. **Open a new issue** with:
   - Error message and code
   - File type and size
   - Environment details
   - Steps to reproduce

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

## Security

### Security Updates

✅ **Resolved**: The application has been migrated from `xlsx` (v0.18.5) to `exceljs` (v4.4.0) to address a high-severity prototype pollution vulnerability (GHSA-4r6h-8v6p-xvw6, CVSS 7.8).

**Changes Made**:
- Replaced `xlsx` package with `exceljs` for Excel file parsing
- Replaced xlsx-based CSV parsing with dedicated `csv-parse` library
- Both packages are actively maintained with no known security vulnerabilities

### Security Best Practices

When deploying this application:
- Keep all dependencies up to date
- Run `npm audit` regularly
- Implement rate limiting (already configured)
- Use HTTPS in production
- Secure your OpenAI and database credentials
- Implement proper authentication and authorization
- Regular security audits

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

