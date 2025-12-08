// ============================================================================
// STARTUP LOGGING - Very first line to prove Node.js is running in container
// ============================================================================
console.log('='.repeat(80));
console.log('🚀 MaxBuild API - Starting up...');
console.log('📅 Timestamp:', new Date().toISOString());
console.log('🏠 Working Directory:', process.cwd());
console.log('📦 Node Version:', process.version);
console.log('🖥️  Platform:', process.platform);
console.log('🔧 Process ID (PID):', process.pid);
console.log('='.repeat(80));

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { apiRateLimiter } from './middleware/rate-limit.middleware';
import { getConfigurationStatus } from './lib/config';

// Load environment variables
console.log('📝 Loading environment variables from .env file...');
dotenv.config();
console.log('✅ Environment variables loaded');

// Create Express app
console.log('🏗️  Creating Express application...');
const app: Application = express();
const PORT = process.env.PORT || 3000;
console.log(`✅ Express application created`);
console.log(`🔌 Port Configuration: ${PORT} (from ${process.env.PORT ? 'PORT env variable' : 'default'})`);

// Middleware
console.log('⚙️  Configuring middleware...');
app.use(cors());
console.log('  ✓ CORS middleware enabled');
app.use(express.json());
console.log('  ✓ JSON body parser enabled');
app.use(express.urlencoded({ extended: true }));
console.log('  ✓ URL-encoded body parser enabled');

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
console.log('  ✓ Rate limiting middleware configured for /api routes');

// Request logging with request ID for traceability
app.use((req: Request, res: Response, next: NextFunction) => {
  const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  (req as any).requestId = requestId;
  console.log(`${new Date().toISOString()} [${requestId}] - ${req.method} ${req.path}`);
  next();
});

// API routes
console.log('🛣️  Configuring API routes...');
app.use('/api', routes);
console.log('  ✓ API routes mounted at /api');

// Root endpoint
console.log('  ✓ Root endpoint configured at /');
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
console.log('  ✓ 404 handler configured');
app.use(notFoundHandler);

// Error handler - must be last middleware
console.log('  ✓ Error handler configured');
app.use(errorHandler);
console.log('✅ All middleware and routes configured successfully\n');

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
  console.error('');
  console.error('='.repeat(80));
  console.error('❌ UNHANDLED PROMISE REJECTION');
  console.error('='.repeat(80));
  console.error('⚠️  A promise was rejected but not caught');
  console.error('🕒 Time:', new Date().toISOString());
  console.error('');
  console.error('📋 Rejection Details:');
  if (reason instanceof Error) {
    console.error(`   Message: ${reason.message}`);
    console.error(`   Name: ${reason.name}`);
    if (reason.stack) {
      console.error('');
      console.error('📚 Stack Trace:');
      console.error(reason.stack);
    }
  } else {
    console.error('   Reason:', String(reason));
  }
  console.error('');
  console.error('💡 This may indicate a bug in the application code');
  console.error('='.repeat(80));
  console.error('');
});

// Handle uncaught exceptions - log but don't crash for non-fatal errors
process.on('uncaughtException', (error: Error & { code?: string }) => {
  console.error('');
  console.error('='.repeat(80));
  console.error('❌ UNCAUGHT EXCEPTION');
  console.error('='.repeat(80));
  console.error('⚠️  An exception was thrown but not caught');
  console.error('🕒 Time:', new Date().toISOString());
  console.error('');
  console.error('📋 Error Details:');
  console.error(`   Message: ${error.message}`);
  console.error(`   Name: ${error.name}`);
  console.error(`   Code: ${error.code || 'N/A'}`);
  if (error.stack) {
    console.error('');
    console.error('📚 Stack Trace:');
    console.error(error.stack);
  }
  console.error('');
  
  // Only exit for truly fatal system errors
  const fatalErrorCodes = ['EADDRINUSE', 'EACCES', 'ENOENT'];
  if (error.code && fatalErrorCodes.includes(error.code)) {
    console.error('💀 FATAL ERROR - Application cannot continue');
    console.error(`   Error code ${error.code} is considered fatal`);
    console.error('');
    console.error('='.repeat(80));
    console.error('💀 SHUTTING DOWN APPLICATION');
    console.error('='.repeat(80));
    process.exit(1);
  } else {
    console.error('⚠️  Non-fatal error - Application will continue');
    console.error('💡 This may indicate a bug that should be fixed');
    console.error('='.repeat(80));
    console.error('');
  }
});

// Start server
console.log('='.repeat(80));
console.log('🚀 STARTING EXPRESS SERVER');
console.log('='.repeat(80));
console.log(`📍 Attempting to bind to port: ${PORT}`);
console.log(`🌐 Host: 0.0.0.0 (all interfaces)`);
console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`⏰ Start time: ${new Date().toISOString()}`);

try {
  const server = app.listen(PORT, () => {
    console.log('='.repeat(80));
    console.log('✅ SERVER STARTED SUCCESSFULLY!');
    console.log('='.repeat(80));
    console.log(`🚀 MAX Build API server is running on port ${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 API URL: http://localhost:${PORT}`);
    console.log(`💡 Health check: http://localhost:${PORT}/api/health`);
    console.log(`📊 Root endpoint: http://localhost:${PORT}/`);
    
    // Log the actual address the server is listening on
    const address = server.address();
    if (address && typeof address === 'object') {
      console.log(`🔌 Server listening on: ${address.address}:${address.port}`);
      console.log(`📡 Protocol: ${address.family}`);
    }
    
    console.log('');
    console.log('📋 Configuration Status:');
    
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
    console.log('='.repeat(80));
    console.log('🎉 APPLICATION READY TO ACCEPT REQUESTS');
    console.log('='.repeat(80));
    console.log('');
  });

  // Handle server errors during startup
  server.on('error', (error: NodeJS.ErrnoException) => {
    console.error('='.repeat(80));
    console.error('❌ SERVER STARTUP ERROR');
    console.error('='.repeat(80));
    console.error(`⚠️  Failed to start server on port ${PORT}`);
    console.error(`🕒 Error time: ${new Date().toISOString()}`);
    console.error('');
    
    if (error.code === 'EADDRINUSE') {
      console.error('❌ ERROR: Port already in use');
      console.error(`   Port ${PORT} is already being used by another process`);
      console.error('');
      console.error('💡 SOLUTIONS:');
      console.error('   1. Stop the other process using this port');
      console.error(`   2. Use a different port: PORT=3001 npm run dev`);
      console.error('   3. Find the process: lsof -i :' + PORT + ' (Mac/Linux) or netstat -ano | findstr :' + PORT + ' (Windows)');
    } else if (error.code === 'EACCES') {
      console.error('❌ ERROR: Permission denied');
      console.error(`   Cannot bind to port ${PORT} - permission denied`);
      console.error('');
      console.error('💡 SOLUTIONS:');
      console.error('   1. Use a port number above 1024 (non-privileged)');
      console.error('   2. Run with elevated privileges (not recommended)');
      console.error(`   3. Try: PORT=3000 npm run dev`);
    } else if (error.code === 'ENOTFOUND') {
      console.error('❌ ERROR: Host not found');
      console.error('   Cannot resolve the hostname');
    } else {
      console.error('❌ ERROR: Unexpected server error');
      console.error(`   Error Code: ${error.code || 'UNKNOWN'}`);
      console.error(`   Error Message: ${error.message}`);
    }
    
    console.error('');
    console.error('📋 Error Details:');
    console.error(JSON.stringify({
      code: error.code,
      message: error.message,
      port: PORT,
      timestamp: new Date().toISOString(),
      pid: process.pid,
    }, null, 2));
    console.error('');
    console.error('='.repeat(80));
    
    // Exit with error code to signal container failure
    process.exit(1);
  });

  // Handle graceful shutdown
  const gracefulShutdown = (signal: string) => {
    console.log('');
    console.log('='.repeat(80));
    console.log(`⚠️  Received ${signal} signal - Starting graceful shutdown...`);
    console.log('='.repeat(80));
    
    server.close(() => {
      console.log('✅ Server closed - all connections terminated');
      console.log('👋 Goodbye!');
      process.exit(0);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
      console.error('⚠️  Forced shutdown - timeout exceeded');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

} catch (error) {
  console.error('='.repeat(80));
  console.error('❌ FATAL ERROR: Failed to start Express server');
  console.error('='.repeat(80));
  console.error('🕒 Error time:', new Date().toISOString());
  console.error('');
  
  if (error instanceof Error) {
    console.error('📋 Error Details:');
    console.error(`   Message: ${error.message}`);
    console.error(`   Name: ${error.name}`);
    if (error.stack) {
      console.error('');
      console.error('📚 Stack Trace:');
      console.error(error.stack);
    }
  } else {
    console.error('Unknown error:', error);
  }
  
  console.error('');
  console.error('='.repeat(80));
  console.error('💀 APPLICATION TERMINATED DUE TO STARTUP ERROR');
  console.error('='.repeat(80));
  
  // Exit with error code
  process.exit(1);
}

export default app;
