import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from './setup';
import { createTestUser, generateToken, expectValidationError, expectUnauthorizedError, expectSuccessResponse } from './helpers';
import bcrypt from 'bcryptjs';

describe('Authentication API', () => {
  let app: any;

  beforeAll(() => {
    app = createApp();
  });

  describe('POST /api/signup', () => {
    it('should register a new mentor successfully', async () => {
      const userData = {
        email: 'newmentor@test.com',
        password: 'password123',
        name: 'New Mentor',
        role: 'mentor'
      };

      const response = await request(app)
        .post('/api/signup')
        .send(userData);

      expectSuccessResponse(response, 201);

      // 데이터베이스에서 사용자 확인
      const user = await prisma.user.findUnique({
        where: { email: userData.email }
      });

      expect(user).toBeTruthy();
      expect(user?.name).toBe(userData.name);
      expect(user?.role).toBe(userData.role);
      expect(user?.email).toBe(userData.email);

      // 비밀번호가 해시되었는지 확인
      const isPasswordHashed = await bcrypt.compare(userData.password, user?.password || '');
      expect(isPasswordHashed).toBe(true);
    });

    it('should register a new mentee successfully', async () => {
      const userData = {
        email: 'newmentee@test.com',
        password: 'password123',
        name: 'New Mentee',
        role: 'mentee'
      };

      const response = await request(app)
        .post('/api/signup')
        .send(userData);

      expectSuccessResponse(response, 201);

      // 데이터베이스에서 사용자 확인
      const user = await prisma.user.findUnique({
        where: { email: userData.email }
      });

      expect(user).toBeTruthy();
      expect(user?.role).toBe('mentee');
    });

    it('should fail with invalid email format', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'password123',
        name: 'Test User',
        role: 'mentor'
      };

      const response = await request(app)
        .post('/api/signup')
        .send(userData);

      expectValidationError(response, 'email');
    });

    it('should fail with short password', async () => {
      const userData = {
        email: 'test@test.com',
        password: '123',
        name: 'Test User',
        role: 'mentor'
      };

      const response = await request(app)
        .post('/api/signup')
        .send(userData);

      expectValidationError(response, 'password');
    });

    it('should fail with invalid role', async () => {
      const userData = {
        email: 'test@test.com',
        password: 'password123',
        name: 'Test User',
        role: 'invalid-role'
      };

      const response = await request(app)
        .post('/api/signup')
        .send(userData);

      expectValidationError(response, 'role');
    });

    it('should fail with missing required fields', async () => {
      const userData = {
        email: 'test@test.com'
        // password, name, role 누락
      };

      const response = await request(app)
        .post('/api/signup')
        .send(userData);

      expectValidationError(response);
    });

    it('should fail with duplicate email', async () => {
      // 첫 번째 사용자 생성
      await createTestUser({
        email: 'duplicate@test.com',
        password: 'password123',
        name: 'First User',
        role: 'mentor'
      });

      // 동일한 이메일로 다시 가입 시도
      const userData = {
        email: 'duplicate@test.com',
        password: 'password123',
        name: 'Second User',
        role: 'mentee'
      };

      const response = await request(app)
        .post('/api/signup')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/login', () => {
    let testUser: any;

    beforeEach(async () => {
      testUser = await createTestUser({
        email: 'login@test.com',
        password: 'password123',
        name: 'Login Test User',
        role: 'mentor'
      });
    });

    it('should login successfully with valid credentials', async () => {
      const loginData = {
        email: 'login@test.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/login')
        .send(loginData);

      expectSuccessResponse(response, 200);
      expect(response.body).toHaveProperty('token');
      expect(typeof response.body.token).toBe('string');

      // JWT 토큰 검증
      const token = response.body.token;
      expect(token).toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/);
    });

    it('should fail with invalid email', async () => {
      const loginData = {
        email: 'nonexistent@test.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/login')
        .send(loginData);

      expectUnauthorizedError(response);
    });

    it('should fail with invalid password', async () => {
      const loginData = {
        email: 'login@test.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/login')
        .send(loginData);

      expectUnauthorizedError(response);
    });

    it('should fail with missing email', async () => {
      const loginData = {
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/login')
        .send(loginData);

      expectValidationError(response, 'email');
    });

    it('should fail with missing password', async () => {
      const loginData = {
        email: 'login@test.com'
      };

      const response = await request(app)
        .post('/api/login')
        .send(loginData);

      expectValidationError(response, 'password');
    });

    it('should fail with empty request body', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({});

      expectValidationError(response);
    });
  });
});
