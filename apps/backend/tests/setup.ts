import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import path from 'path';

// Test database setup
const testDbPath = path.join(__dirname, '../prisma/test.db');

// 테스트용 데이터베이스 URL
process.env.DATABASE_URL = `file:${testDbPath}`;
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';
process.env.NODE_ENV = 'test';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${testDbPath}`
    }
  }
});

beforeAll(async () => {
  try {
    // 테스트 데이터베이스 스키마 생성
    execSync('npx prisma db push --force-reset', { 
      cwd: path.join(__dirname, '..'),
      stdio: 'ignore'
    });
    
    // Connect to test database
    await prisma.$connect();
  } catch (error) {
    console.error('Failed to setup test database:', error);
    throw error;
  }
});

beforeEach(async () => {
  try {
    // 각 테스트 전에 데이터베이스 초기화 (외래키 제약조건 고려)
    await prisma.matchRequest.deleteMany();
    await prisma.user.deleteMany();
  } catch (error) {
    console.error('Failed to cleanup test data:', error);
  }
});

afterAll(async () => {
  try {
    await prisma.$disconnect();
  } catch (error) {
    console.error('Failed to disconnect from test database:', error);
  }
});

export { prisma };
