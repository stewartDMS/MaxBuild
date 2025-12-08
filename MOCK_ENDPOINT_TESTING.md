# Mock Upload Endpoint Testing Guide

## Overview

The mock upload endpoint (`/api/tenders/upload-mock`) is a **demonstration endpoint** designed for team alignment and testing without requiring any external dependencies (database, OpenAI API, etc.).

## Purpose

- **Team Alignment**: Demonstrates the complete end-to-end tender processing workflow
- **Testing**: Allows testing of the upload flow without requiring API keys or database
- **Documentation**: Provides clear examples of the expected request/response format
- **Development**: Enables frontend development without backend dependencies

## Endpoint Details

**URL**: `POST /api/tenders/upload-mock`

**Requirements**: None - works completely standalone

**Parameters**:
- `tender` (optional): Any file type - if not provided, uses mock data
- `context` (optional): Text instructions to guide mock BOQ extraction

## Testing the Endpoint

### Prerequisite: Start the Server

```bash
# Install dependencies (first time only)
npm install

# Start the development server
npm run dev

# Or start with ts-node directly
npx ts-node src/index.ts
```

The server will start on port 3000 (default).

### Test 1: Basic Mock Request (No File)

This test verifies the endpoint works without any file upload.

```bash
curl -X POST http://localhost:3000/api/tenders/upload-mock
```

**Expected Result**:
- ✅ HTTP 200 response
- ✅ `success: true`
- ✅ `isDemo: true`
- ✅ `data.tenderId` is present
- ✅ `data.fileName` = "demo-tender-document.pdf"
- ✅ `data.itemCount` = 9 (default items)
- ✅ 5 processing steps present

**Quick Verification**:
```bash
curl -s -X POST http://localhost:3000/api/tenders/upload-mock | \
  jq '{success, isDemo, tenderId: .data.tenderId, itemCount: .data.itemCount, phases: [.data.processingSteps[].phase]}'
```

### Test 2: Mock Request with File

This test verifies the endpoint accepts and processes file uploads.

```bash
# Create a test file
echo "This is a test tender document" > test-tender.txt

# Upload the file
curl -X POST http://localhost:3000/api/tenders/upload-mock \
  -F "tender=@test-tender.txt"
```

**Expected Result**:
- ✅ HTTP 200 response
- ✅ `data.fileName` matches the uploaded file name
- ✅ File size is logged in processing steps
- ✅ File content preview appears in logs (for text files)

**Quick Verification**:
```bash
curl -s -X POST http://localhost:3000/api/tenders/upload-mock \
  -F "tender=@test-tender.txt" | \
  jq '{fileName: .data.fileName, itemCount: .data.itemCount}'
```

### Test 3: Mock Request with Context (No Context)

This test verifies the default behavior without custom context.

```bash
curl -X POST http://localhost:3000/api/tenders/upload-mock
```

**Expected Result**:
- ✅ `data.itemCount` = 9
- ✅ 1 electrical item (generic)
- ✅ 1 plumbing item (generic)
- ✅ `notes` = "Standard extraction without custom context"

### Test 4: Mock Request with Electrical Context

This test verifies context-based item generation.

```bash
curl -X POST http://localhost:3000/api/tenders/upload-mock \
  -F "context=Focus on electrical items"
```

**Expected Result**:
- ✅ `data.itemCount` > 9 (more items due to context)
- ✅ 3+ electrical items (detailed breakdown)
- ✅ Items include: Main Distribution Board, Copper wiring, LED fixtures
- ✅ `notes` contains the context

**Quick Verification**:
```bash
curl -s -X POST http://localhost:3000/api/tenders/upload-mock \
  -F "context=Focus on electrical items" | \
  jq '{itemCount: .data.itemCount, electrical: [.data.boqExtraction.items[] | select(.category == "Electrical") | .description]}'
```

### Test 5: Mock Request with Plumbing Context

```bash
curl -X POST http://localhost:3000/api/tenders/upload-mock \
  -F "context=Focus on plumbing works"
```

**Expected Result**:
- ✅ `data.itemCount` > 9
- ✅ 3+ plumbing items (detailed breakdown)
- ✅ Items include: Water supply pipes, Drainage pipes, Sanitary fixtures

**Quick Verification**:
```bash
curl -s -X POST http://localhost:3000/api/tenders/upload-mock \
  -F "context=Focus on plumbing works" | \
  jq '{itemCount: .data.itemCount, plumbing: [.data.boqExtraction.items[] | select(.category == "Plumbing") | .description]}'
```

### Test 6: Combined Context

```bash
curl -X POST http://localhost:3000/api/tenders/upload-mock \
  -F "context=Focus on electrical and plumbing items"
```

**Expected Result**:
- ✅ `data.itemCount` = 13
- ✅ 3 electrical items
- ✅ 3 plumbing items

**Quick Verification**:
```bash
curl -s -X POST http://localhost:3000/api/tenders/upload-mock \
  -F "context=Focus on electrical and plumbing" | \
  jq -c '{itemCount: .data.itemCount, electrical: [.data.boqExtraction.items[] | select(.category == "Electrical") | .description], plumbing: [.data.boqExtraction.items[] | select(.category == "Plumbing") | .description]}'
```

## Processing Phases

The mock endpoint demonstrates 5 distinct processing phases:

### 1. FILE_UPLOAD
- Receives file (or uses mock data)
- Validates file metadata
- Logs file details

### 2. FILE_PARSING
- Simulates extracting text from document
- Shows file type detection (PDF, Excel, CSV, generic)
- Displays content preview for text files

### 3. AI_ANALYSIS
- Simulates AI-powered BOQ extraction
- Applies custom context if provided
- Generates appropriate number of items

### 4. DOCUMENT_GENERATION
- Creates structured BOQ output
- Calculates totals
- Formats response

### 5. RESULT_SENDING
- Prepares final response
- Logs processing time
- Returns complete data

## Console Logs

The mock endpoint provides **extensive console logging** for debugging and demonstration:

### Log Categories

1. **Request Tracking**: Each request gets a unique ID for traceability
2. **Route Logging**: Logs when the route is hit with request details
3. **Phase Logging**: Detailed logs for each processing phase
4. **File Information**: Logs file metadata (name, size, type)
5. **Context Application**: Shows when custom context is applied
6. **Item Generation**: Logs number of items and categories
7. **Processing Time**: Shows duration of each phase

### Example Log Output

```
[req-1234567890-abc123] ========================================
[req-1234567890-abc123] 🎭 MOCK UPLOAD ROUTE HIT - POST /api/tenders/upload-mock
[req-1234567890-abc123] ========================================

╔════════════════════════════════════════════════════════════╗
║           MOCK TENDER UPLOAD - DEMO FLOW                   ║
║   This is a demonstration endpoint for team alignment      ║
╚════════════════════════════════════════════════════════════╝

========================================
📤 PHASE 1: FILE UPLOAD RECEIVED
========================================
📋 File Details:
   - File Name: demo-tender-document.pdf
   - File Size: 500.00 KB
   - MIME Type: application/pdf
   - Has Context: false
   - Mock Tender ID: mock-1234567890-abc123

========================================
📖 PHASE 2: FILE PARSING/READING
========================================
🔍 Parsing file content...
   - Detected: PDF Document
   - Action: Extracting text from PDF pages...
   - Extracted text length: 694 characters
✅ File parsing completed successfully

========================================
🤖 PHASE 3: MOCK AI ANALYSIS
========================================
🧠 Simulating AI-powered BOQ extraction...
   - Model: Mock-GPT-Demo (simulated)
   - Task: Bill of Quantities extraction
   - Items identified: 9
   - Categories found: Foundation, Structural, Electrical, Plumbing
   - Total estimated cost: $223,850
✅ AI analysis completed successfully

========================================
📄 PHASE 4: DOCUMENT GENERATION
========================================
🔧 Generating structured BOQ output...
   - Project Name: Demo Tender Document
   - Location: Demo Location - City Center
   - Total Items: 9
   - Currency: USD
✅ Document generation completed

========================================
📤 PHASE 5: RESULT PREPARATION & SENDING
========================================
📦 Preparing final response...
   - Tender ID: mock-1234567890-abc123
   - Status: mock_completed
   - Item Count: 9
   - Total Processing Time: 503ms
✅ MOCK TENDER PROCESSING COMPLETE
========================================
```

## Response Structure

### Success Response

```json
{
  "success": true,
  "message": "Mock tender processed successfully. This is a demonstration response.",
  "isDemo": true,
  "data": {
    "tenderId": "mock-1234567890-abc123",
    "fileName": "demo-tender-document.pdf",
    "status": "mock_completed",
    "boqExtraction": {
      "projectName": "Demo Tender Document",
      "projectLocation": "Demo Location - City Center",
      "items": [
        {
          "itemNumber": "1.0",
          "description": "Site Preparation and Clearing",
          "quantity": 1,
          "unit": "lot",
          "unitRate": 15000,
          "amount": 15000,
          "category": "Preliminary"
        }
        // ... more items
      ],
      "totalEstimatedCost": 223850,
      "currency": "USD",
      "extractionDate": "2025-12-07T23:00:00.000Z",
      "notes": "Standard extraction without custom context"
    },
    "itemCount": 9,
    "processingSteps": [
      {
        "phase": "FILE_UPLOAD",
        "status": "completed",
        "timestamp": "2025-12-07T23:00:00.000Z",
        "details": "File \"demo-tender-document.pdf\" (500.00 KB) received successfully",
        "durationMs": 0
      }
      // ... more steps
    ]
  }
}
```

## Testing with Postman

### Setup

1. Create a new POST request
2. Set URL: `http://localhost:3000/api/tenders/upload-mock`

### Test Scenarios

#### Scenario 1: No File
- **Body**: None (or empty)
- **Expected**: Uses mock data

#### Scenario 2: With File
- **Body**: form-data
- **Key**: `tender` (File type)
- **Value**: Select any file
- **Expected**: Processes the uploaded file

#### Scenario 3: With Context
- **Body**: form-data
- **Key**: `context` (Text type)
- **Value**: "Focus on electrical items"
- **Expected**: Returns more electrical items

#### Scenario 4: File + Context
- **Body**: form-data
- **Keys**: 
  - `tender` (File): Select file
  - `context` (Text): "Focus on electrical and plumbing"
- **Expected**: Processes file with context-based items

## Verification Checklist

Use this checklist to verify the mock endpoint is working correctly:

- [ ] Server starts successfully on port 3000
- [ ] Endpoint responds to POST requests
- [ ] Request without file returns mock data
- [ ] Request with file accepts and processes file
- [ ] Context parameter modifies item generation
- [ ] All 5 processing phases are logged
- [ ] Response includes `isDemo: true`
- [ ] Processing steps include duration and details
- [ ] BOQ items have all required fields
- [ ] Total cost is calculated correctly
- [ ] Console logs are detailed and helpful
- [ ] No errors or warnings in logs

## Common Issues and Solutions

### Issue: Server won't start
**Solution**: 
- Check if port 3000 is available: `lsof -i :3000` or `netstat -an | grep 3000`
- If port is in use, kill the process or use a different port
- Install dependencies: `npm install`
- Check for syntax errors: `npm run build`

### Issue: Cannot connect to endpoint
**Solution**:
- Verify server is running: `curl http://localhost:3000/api/health`
- Check firewall settings
- Try using 127.0.0.1 instead of localhost

### Issue: No detailed logs appearing
**Solution**:
- Check that you're running in development mode
- Look in the terminal where you started the server
- Logs appear in real-time as requests are processed

### Issue: Context not affecting results
**Solution**:
- Ensure context field name is correct: `context` (not `Context`)
- Check that context contains keywords like "electrical" or "plumbing"
- Verify the context value is being sent (check logs)

## Integration with Real Endpoint

The mock endpoint mimics the real upload endpoint (`/api/tenders/upload`) for easy switching:

| Feature | Mock Endpoint | Real Endpoint |
|---------|--------------|---------------|
| URL | `/api/tenders/upload-mock` | `/api/tenders/upload` |
| Database | Not required | Required |
| OpenAI API | Not required | Required |
| File validation | Relaxed | Strict |
| Response | Always succeeds | May fail |
| Processing | Simulated | Real AI |

## Summary

The mock upload endpoint is fully functional and demonstrates:

✅ **Complete workflow**: All 5 phases (upload → parse → analyze → generate → send)  
✅ **File handling**: Accepts files and logs metadata  
✅ **Context support**: Modifies output based on context  
✅ **Detailed logging**: Comprehensive console output for debugging  
✅ **Proper responses**: Well-structured JSON with all required fields  
✅ **Error-free operation**: No issues found in testing  

**Status**: ✅ **WORKING CORRECTLY** - Ready for team use and demonstration purposes.
