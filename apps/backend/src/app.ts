import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';

// Routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import mentorRoutes from './routes/mentors';
import matchRoutes from './routes/matches';

// Database
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export function createApp() {
  const app = express();

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
        scriptSrc: ["'self'"],
        fontSrc: ["'self'", "fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  }));
  
  app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 100 : 1000, // More permissive in development
    message: {
      error: 'Too many requests',
      details: 'Please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false
  });
  app.use(limiter);

  // Specific rate limiting for auth endpoints
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit auth requests more strictly
    message: {
      error: 'Too many authentication attempts',
      details: 'Please try again later'
    }
  });

  // Body parsing
  app.use(express.json({ 
    limit: '10mb' // For base64 images
  }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Load OpenAPI specification (only if not in test environment)
  if (process.env.NODE_ENV !== 'test') {
    try {
      const swaggerDocument = YAML.load(path.join(process.cwd(), '../../openapi.yaml'));

      // Swagger UI
      app.use('/swagger-ui', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

      // OpenAPI JSON endpoint
      app.get('/openapi.json', (req, res) => {
        res.json(swaggerDocument);
      });

      // Root redirect to Swagger UI
      app.get('/', (req, res) => {
        res.redirect('/swagger-ui');
      });
    } catch (error) {
      console.warn('Warning: Could not load OpenAPI specification');
    }
  }

  // API Routes
  app.use('/api/signup', authLimiter);
  app.use('/api/login', authLimiter);
  app.use('/api', authRoutes);
  app.use('/api', userRoutes);
  app.use('/api', mentorRoutes);
  app.use('/api', matchRoutes);

  // Error handling middleware
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Error occurred:', {
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      url: req.url,
      method: req.method,
      timestamp: new Date().toISOString()
    });

    // Handle specific error types
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation failed',
        details: err.message
      });
    }

    if (err.name === 'UnauthorizedError') {
      return res.status(401).json({
        error: 'Unauthorized',
        details: 'Invalid or missing authentication token'
      });
    }

    // Default error response
    res.status(err.status || 500).json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
  });

  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({
      error: 'Not found',
      details: `Route ${req.originalUrl} not found`
    });
  });

  return app;
}
