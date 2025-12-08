import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { apiRateLimiter } from './middleware/rate-limit.middleware';
import { getConfigurationStatus } from './lib/config';

// Load environment variables
dotenv.config();

// Debug: Log environment variable loading status for diagnostics
console.log('🔍 Environment Variables Loaded:');
console.log(`   - OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? `Present (${process.env.OPENAI_API_KEY.substring(0, 7)}...${process.env.OPENAI_API_KEY.substring(process.env.OPENAI_API_KEY.length - 4)})` : 'NOT SET'}`);
console.log(`   - DATABASE_URL: ${process.env.DATABASE_URL ? 'Present' : 'NOT SET'}`);
console.log(`   - NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log('');

// Create Express app
const app: Application = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Morgan HTTP request logging - logs all incoming requests with timing
// Use 'combined' format for detailed logs including user-agent, referrer
app.use(morgan('combined', {
  stream: {
    write: (message: string) => {
      console.log(`[HTTP] ${message.trim()}`);
    },
  },
}));

// Apply rate limiting to all API routes
app.use('/api', apiRateLimiter);

// Request logging with request ID for traceability
app.use((req: Request, res: Response, next: NextFunction) => {
  const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  (req as any).requestId = requestId;
  console.log(`${new Date().toISOString()} [${requestId}] - ${req.method} ${req.path}`);
  next();
});

// API routes
app.use('/api', routes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to MAX Build API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      uploadtest: 'POST /api/uploadtest (diagnostic - no file required)',
      tenders: {
        upload: 'POST /api/tenders/upload',
        uploadMock: 'POST /api/tenders/upload-mock (demo endpoint - no DB/AI required)',
        list: 'GET /api/tenders',
        get: 'GET /api/tenders/:id',
        delete: 'DELETE /api/tenders/:id',
      },
      langgraph: {
        getAssistant: 'GET /api/langgraph/assistants/:id',
      },
    },
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handler - must be last middleware
app.use(errorHandler);

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
  console.error('❌ Unhandled Promise Rejection:', {
    timestamp: new Date().toISOString(),
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
  });
});

// Handle uncaught exceptions - log but don't crash for non-fatal errors
process.on('uncaughtException', (error: Error & { code?: string }) => {
  console.error('❌ Uncaught Exception:', {
    timestamp: new Date().toISOString(),
    error: error.message,
    code: error.code,
    stack: error.stack,
  });
  // Only exit for truly fatal system errors (check error code for reliability)
  const fatalErrorCodes = ['EADDRINUSE', 'EACCES', 'ENOENT'];
  if (error.code && fatalErrorCodes.includes(error.code)) {
    console.error('💀 Fatal error - shutting down');
    process.exit(1);
  }
});

// Start server
app.listen(PORT, () => {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🚀 MAX Build API Server Started');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API URL: http://localhost:${PORT}`);
  console.log(`💡 Health check: http://localhost:${PORT}/api/health`);
  console.log('');
  
  // Check configuration and provide helpful startup messages with detailed diagnostics
  console.log('📋 CONFIGURATION STATUS');
  console.log('───────────────────────────────────────────────────────────────');
  
  const config = getConfigurationStatus();
  
  // OpenAI API Key Status
  console.log('🔑 OpenAI API Key:');
  if (config.hasOpenAIKey) {
    console.log('   ✅ Status: CONFIGURED');
    console.log('   ℹ️  Real AI-powered endpoints are available');
  } else {
    const apiKey = process.env.OPENAI_API_KEY;
    console.log('   ❌ Status: NOT CONFIGURED or INVALID');
    if (!apiKey) {
      console.log('   ℹ️  Reason: Environment variable OPENAI_API_KEY is not set');
      console.log('   💡 Fix: Add OPENAI_API_KEY=sk-... to your .env file');
    } else {
      console.log('   ℹ️  Reason: API key appears to be a placeholder value');
      console.log(`   📝 Current value: ${apiKey.substring(0, 30)}...`);
      console.log('   💡 Fix: Replace with a valid OpenAI API key from https://platform.openai.com/api-keys');
    }
    console.log('   ⚠️  Impact: Real upload endpoint (/api/tenders/upload) will NOT work');
  }
  console.log('');
  
  // Database Status
  console.log('💾 Database:');
  if (config.hasDatabaseUrl) {
    console.log('   ✅ Status: CONFIGURED');
    console.log('   ℹ️  Database persistence is available');
  } else {
    const dbUrl = process.env.DATABASE_URL;
    console.log('   ❌ Status: NOT CONFIGURED or INVALID');
    if (!dbUrl) {
      console.log('   ℹ️  Reason: Environment variable DATABASE_URL is not set');
      console.log('   💡 Fix: Add DATABASE_URL=postgresql://... to your .env file');
    } else {
      console.log('   ℹ️  Reason: Database URL appears to be a placeholder value');
      console.log('   💡 Fix: Replace with a valid PostgreSQL connection string');
    }
    console.log('   ⚠️  Impact: Real upload endpoint (/api/tenders/upload) will NOT work');
  }
  console.log('');
  
  console.log('───────────────────────────────────────────────────────────────');
  if (!config.isFullyConfigured) {
    console.log('⚠️  CONFIGURATION INCOMPLETE');
    console.log('');
    console.log('📌 QUICK START OPTIONS:');
    console.log('   1️⃣  Testing without setup (no configuration needed):');
    console.log(`      curl -X POST http://localhost:${PORT}/api/tenders/upload-mock`);
    console.log('');
    console.log('   2️⃣  Production setup (requires configuration):');
    console.log('      • Copy .env.example to .env');
    console.log('      • Add valid OPENAI_API_KEY and DATABASE_URL');
    console.log('      • Run: npm run prisma:migrate');
    console.log('      • Restart the server');
    console.log('      • See README.md "Troubleshooting" section for help');
  } else {
    console.log('✅ ALL SYSTEMS READY');
    console.log('');
    console.log('🎯 Available Endpoints:');
    console.log(`   • Mock: POST /api/tenders/upload-mock`);
    console.log('     (Demo endpoint - no external dependencies)');
    console.log(`   • Real: POST /api/tenders/upload`);
    console.log('     (AI-powered with database persistence)');
  }
  
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
});

export default app;
