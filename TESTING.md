# API Testing Guide

This document provides examples for testing the MAX Build API endpoints.

## Manual Testing

### Using cURL

#### 1. Check API Health
```bash
curl -X GET http://localhost:3000/api/health
```

#### 2. Upload a Tender Document
```bash
# Replace /path/to/tender.pdf with actual file path
curl -X POST http://localhost:3000/api/tenders/upload \
  -F "tender=@/path/to/tender.pdf" \
  -v
```

#### 3. List All Tenders (with pagination)
```bash
curl -X GET "http://localhost:3000/api/tenders?skip=0&take=10"
```

#### 4. Get Specific Tender
```bash
# Replace {id} with actual tender ID
curl -X GET http://localhost:3000/api/tenders/{id}
```

#### 5. Delete a Tender
```bash
# Replace {id} with actual tender ID
curl -X DELETE http://localhost:3000/api/tenders/{id}
```

### Using HTTPie (if installed)

```bash
# Health check
http GET localhost:3000/api/health

# Upload tender
http -f POST localhost:3000/api/tenders/upload tender@/path/to/tender.pdf

# List tenders
http GET localhost:3000/api/tenders skip==0 take==10

# Get specific tender
http GET localhost:3000/api/tenders/{id}

# Delete tender
http DELETE localhost:3000/api/tenders/{id}
```

## Testing with Node.js Script

Create a file `test-api.js`:

```javascript
const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3000/api';

async function testHealthCheck() {
  console.log('Testing health check...');
  const response = await fetch(`${API_BASE}/health`);
  const data = await response.json();
  console.log('Health check:', data);
}

async function testUpload(filePath) {
  console.log('Testing tender upload...');
  const form = new FormData();
  form.append('tender', fs.createReadStream(filePath));
  
  const response = await fetch(`${API_BASE}/tenders/upload`, {
    method: 'POST',
    body: form,
  });
  
  const data = await response.json();
  console.log('Upload result:', JSON.stringify(data, null, 2));
  return data.data?.tenderId;
}

async function testListTenders() {
  console.log('Testing list tenders...');
  const response = await fetch(`${API_BASE}/tenders?skip=0&take=5`);
  const data = await response.json();
  console.log('Tenders:', JSON.stringify(data, null, 2));
}

async function testGetTender(tenderId) {
  console.log('Testing get tender...');
  const response = await fetch(`${API_BASE}/tenders/${tenderId}`);
  const data = await response.json();
  console.log('Tender details:', JSON.stringify(data, null, 2));
}

async function runTests() {
  try {
    await testHealthCheck();
    
    // Replace with your PDF file path
    const tenderId = await testUpload('./sample-tender.pdf');
    
    if (tenderId) {
      await testListTenders();
      await testGetTender(tenderId);
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

runTests();
```

Run with:
```bash
node test-api.js
```

## Expected Response Formats

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

### Upload Response
```json
{
  "success": true,
  "data": {
    "tenderId": "uuid",
    "fileName": "tender.pdf",
    "status": "completed",
    "boqExtraction": {
      "projectName": "Project Name",
      "projectLocation": "Location",
      "items": [
        {
          "itemNumber": "1",
          "description": "Item description",
          "quantity": 100,
          "unit": "m³",
          "unitRate": 50,
          "amount": 5000,
          "category": "Civil"
        }
      ],
      "totalEstimatedCost": 5000,
      "currency": "USD",
      "extractionDate": "2024-11-20T22:00:00.000Z",
      "notes": "Additional notes"
    },
    "itemCount": 1
  }
}
```

## Rate Limiting

The API has rate limiting enabled:
- Upload endpoint: 10 uploads per 15 minutes per IP
- General API: 100 requests per 15 minutes per IP

When rate limited, you'll receive:
```json
{
  "message": "Too many requests from this IP, please try again later."
}
```

## Error Handling

Common error scenarios:

### 400 Bad Request
- No file uploaded
- Invalid file format (not PDF)
- File too large (>10MB)

### 404 Not Found
- Tender ID doesn't exist
- Invalid endpoint

### 429 Too Many Requests
- Rate limit exceeded

### 500 Internal Server Error
- Database connection issues
- OpenAI API errors
- PDF parsing failures

## Testing Tips

1. **Start with health check** to ensure API is running
2. **Use small PDF files** for faster testing
3. **Monitor server logs** for detailed error information
4. **Test error cases** (invalid files, missing IDs, etc.)
5. **Verify database entries** using PostgreSQL client
6. **Check rate limiting** by making multiple rapid requests

## Sample Tender PDF

For testing, create a simple tender PDF with content like:

```
TENDER DOCUMENT
Project: New Office Building
Location: New York

BILL OF QUANTITIES

Item No. | Description | Quantity | Unit | Rate | Amount
---------|-------------|----------|------|------|-------
1        | Excavation  | 100      | m³   | 50   | 5000
2        | Concrete    | 200      | m³   | 150  | 30000
3        | Steel       | 50       | ton  | 1000 | 50000

Total Estimated Cost: $85,000
```

Save this as a PDF and use it for testing.
