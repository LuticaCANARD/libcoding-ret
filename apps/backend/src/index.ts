import 'dotenv/config';
import { createApp, prisma } from './app';

const app = createApp();
const PORT = process.env.PORT || 8080;

// Start server
async function startServer() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Connected to database successfully');

    // Test if database tables exist
    await prisma.user.findMany({ take: 0 });
    console.log('✅ Database schema verified');

    const server = app.listen(PORT, () => {
      console.log('🚀 Server started successfully');
      console.log(`📝 Server running on http://localhost:${PORT}`);
      console.log(`📚 Swagger UI available at http://localhost:${PORT}/swagger-ui`);
      console.log(`🔧 OpenAPI JSON at http://localhost:${PORT}/openapi.json`);
      console.log(`🔒 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Graceful shutdown handlers
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n🔄 Received ${signal}, starting graceful shutdown...`);
      
      server.close(async () => {
        console.log('🔐 HTTP server closed');
        
        try {
          await prisma.$disconnect();
          console.log('🔐 Database connection closed');
          console.log('✅ Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          console.error('❌ Error during shutdown:', error);
          process.exit(1);
        }
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
        console.error('💡 Database connection failed. Please check your database configuration.');
      } else if (error.message.includes('permission')) {
        console.error('💡 Permission denied. Please check file permissions.');
      }
    }
    
    process.exit(1);
  }
}

startServer();
