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
  console.log(`🚀 MAX Build API server is running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API URL: http://localhost:${PORT}`);
  console.log(`💡 Health check: http://localhost:${PORT}/api/health`);
  
  // Check configuration and provide helpful startup messages
  console.log('\n📋 Configuration Status:');
  
  const config = getConfigurationStatus();
  
  if (config.hasOpenAIKey) {
    console.log('✅ OpenAI API Key: Configured');
  } else {
    console.log('⚠️  OpenAI API Key: Not configured');
    console.log('   → Real upload endpoint (/api/tenders/upload) will NOT work');
    console.log('   → Set OPENAI_API_KEY in .env file to enable');
  }
  
  if (config.hasDatabaseUrl) {
    console.log('✅ Database: Configured');
  } else {
    console.log('⚠️  Database: Not configured');
    console.log('   → Real upload endpoint (/api/tenders/upload) will NOT work');
    console.log('   → Set DATABASE_URL in .env file to enable');
  }
  
  if (!config.isFullyConfigured) {
    console.log('\n💡 Quick Start:');
    console.log('   1. For testing without setup, use the mock endpoint:');
    console.log(`      curl -X POST http://localhost:${PORT}/api/tenders/upload-mock`);
    console.log('   2. For production use, see SETUP_GUIDE.md for configuration steps');
  } else {
    console.log('\n✅ All systems ready! Both endpoints available:');
    console.log(`   • Mock: POST /api/tenders/upload-mock (no external dependencies)`);
    console.log(`   • Real: POST /api/tenders/upload (AI-powered with database)`);
  }
  
  console.log('');
});

export default app;
