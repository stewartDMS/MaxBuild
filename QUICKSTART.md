# Quick Start Guide for MAX Build

This guide will help you get the MAX Build tender automation system up and running.

## Prerequisites

1. **Node.js 18+**: Download from [nodejs.org](https://nodejs.org/)
2. **PostgreSQL**: Install PostgreSQL database
3. **OpenAI API Key**: Get one from [OpenAI Platform](https://platform.openai.com/api-keys)

## Installation Steps

### 1. Clone and Install

```bash
git clone https://github.com/stewartDMS/MaxBuild.git
cd MaxBuild
npm install
```

### 2. Database Setup

Create a PostgreSQL database:

```sql
CREATE DATABASE maxbuild;
```

### 3. Environment Configuration

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
PORT=3000
NODE_ENV=development
OPENAI_API_KEY=sk-your-actual-openai-key-here
DATABASE_URL="postgresql://username:password@localhost:5432/maxbuild?schema=public"
MAX_FILE_SIZE=10485760
```

### 4. Database Migration

Generate Prisma client and run migrations:

```bash
npm run prisma:generate
npm run prisma:migrate
```

When prompted for migration name, enter: `init`

### 5. Build the Project

```bash
npm run build
```

### 6. Start the Server

For development (with hot reload):
```bash
npm run dev
```

For production:
```bash
npm start
```

You should see:
```
🚀 MAX Build API server is running on port 3000
📝 Environment: development
🔗 API URL: http://localhost:3000
💡 Health check: http://localhost:3000/api/health
```

## Testing the API

### 1. Health Check

```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "success": true,
  "message": "MAX Build API is running",
  "timestamp": "2024-11-20T22:00:00.000Z"
}
```

### 2. Upload a Tender PDF

Create a test PDF or use an existing tender document, then:

```bash
curl -X POST http://localhost:3000/api/tenders/upload \
  -F "tender=@/path/to/your/tender.pdf" \
  -H "Content-Type: multipart/form-data"
```

Expected response:
```json
{
  "success": true,
  "data": {
    "tenderId": "uuid-here",
    "fileName": "tender.pdf",
    "status": "completed",
    "boqExtraction": {
      "projectName": "Example Construction Project",
      "projectLocation": "New York",
      "items": [
        {
          "itemNumber": "1",
          "description": "Excavation work",
          "quantity": 100,
          "unit": "m³",
          "unitRate": 50,
          "amount": 5000,
          "category": "Civil"
        }
      ],
      "totalEstimatedCost": 5000,
      "currency": "USD",
      "extractionDate": "2024-11-20T22:00:00.000Z"
    },
    "itemCount": 1
  }
}
```

### 3. List All Tenders

```bash
curl http://localhost:3000/api/tenders
```

### 4. Get a Specific Tender

```bash
curl http://localhost:3000/api/tenders/{tender-id}
```

### 5. Delete a Tender

```bash
curl -X DELETE http://localhost:3000/api/tenders/{tender-id}
```

## Using Postman or Thunder Client

1. **Import Collection**: Use the API endpoints documented above
2. **Upload Tender**:
   - Method: POST
   - URL: `http://localhost:3000/api/tenders/upload`
   - Body: form-data
   - Key: `tender`
   - Type: File
   - Select your PDF file

## Troubleshooting

### Database Connection Error

If you see database connection errors:
1. Verify PostgreSQL is running
2. Check DATABASE_URL in `.env`
3. Ensure database exists: `createdb maxbuild`

### OpenAI API Error

If you see OpenAI errors:
1. Verify your API key is correct
2. Check you have credits in your OpenAI account
3. Ensure API key has proper permissions

### File Upload Error

If file uploads fail:
1. Check file is a valid PDF
2. Verify file size is under 10MB
3. Ensure `uploads/` directory exists

### Port Already in Use

If port 3000 is busy:
1. Change PORT in `.env` to a different value
2. Or stop the process using port 3000

## Next Steps

- Review the [README.md](./README.md) for detailed API documentation
- Explore the codebase in `src/` directory
- Customize the BOQ extraction prompt in `src/ai/chains/boq-generation.chain.ts`
- Add more endpoints as needed

## Development Tips

- Use `npm run dev` for development with auto-reload
- Check logs for debugging information
- Use PostgreSQL client tools to inspect database
- Test with various tender document formats

## Support

For issues or questions:
- Check the GitHub issues
- Review the code documentation
- Ensure all prerequisites are met
