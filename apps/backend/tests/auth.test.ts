import request from 'supertest';
import { createApp } from '../src/app';
import { TestHelper } from './test-helper';

const app = createApp();

describe('Auth API', () => {
  beforeEach(async () => {
    await TestHelper.cleanupUsers();
  });

  describe('POST /api/signup', () => {
    it('should register a new mentee successfully', async () => {
      const userData = {
        email: 'mentee@example.com',
        password: 'password123',
        name: 'John Mentee',
        role: 'mentee'
      };

      const response = await request(app)
        .post('/api/signup')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('tokens');
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.name).toBe(userData.name);
      expect(response.body.user.role).toBe(userData.role);
      expect(response.body.user).not.toHaveProperty('password');
      expect(response.body.tokens).toHaveProperty('accessToken');
      expect(response.body.tokens).toHaveProperty('refreshToken');
    });

    it('should register a new mentor successfully', async () => {
      const userData = {
        email: 'mentor@example.com',
        password: 'password123',
        name: 'Jane Mentor',
        role: 'mentor'
      };

      const response = await request(app)
        .post('/api/signup')
        .send(userData)
        .expect(201);

      expect(response.body.user.role).toBe('mentor');
    });

    it('should reject signup with invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'password123',
        name: 'John Doe',
        role: 'mentee'
      };

      const response = await request(app)
        .post('/api/signup')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.details).toContain('email');
    });

    it('should reject signup with short password', async () => {
      const userData = {
        email: 'test@example.com',
        password: '123',
        name: 'John Doe',
        role: 'mentee'
      };

      const response = await request(app)
        .post('/api/signup')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.details).toContain('password');
    });

    it('should reject signup with invalid role', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'John Doe',
        role: 'invalid-role'
      };

      const response = await request(app)
        .post('/api/signup')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject duplicate email', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'password123',
        name: 'John Doe',
        role: 'mentee'
      };

      // First signup
      await request(app)
        .post('/api/signup')
        .send(userData)
        .expect(201);

      // Second signup with same email
      const response = await request(app)
        .post('/api/signup')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.details).toContain('already exists');
    });

    it('should reject signup with missing required fields', async () => {
      const response = await request(app)
        .post('/api/signup')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/login', () => {
    let testUser: any;
    const userPassword = 'password123';

    beforeEach(async () => {
      testUser = await TestHelper.createTestUser({
        email: 'login-test@example.com',
        password: userPassword,
        name: 'Login Test User',
        role: 'mentee'
      });
    });

    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({
          email: testUser.email,
          password: userPassword
        })
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('tokens');
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user).not.toHaveProperty('password');
      expect(response.body.tokens).toHaveProperty('accessToken');
      expect(response.body.tokens).toHaveProperty('refreshToken');
    });

    it('should reject login with invalid email', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({
          email: 'nonexistent@example.com',
          password: userPassword
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.details).toContain('Invalid');
    });

    it('should reject login with invalid password', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.details).toContain('Invalid');
    });

    it('should reject login with missing credentials', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject login with invalid email format', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({
          email: 'invalid-email',
          password: userPassword
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.details).toContain('email');
    });
  });

  describe('POST /api/refresh', () => {
    let testUser: any;
    let tokens: any;

    beforeEach(async () => {
      testUser = await TestHelper.createTestUser({
        email: 'refresh-test@example.com',
        password: 'password123',
        name: 'Refresh Test User',
        role: 'mentee'
      });
      tokens = TestHelper.generateAuthTokens(testUser);
    });

    it('should refresh token successfully with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/refresh')
        .send({
          refreshToken: tokens.refreshToken
        })
        .expect(200);

      expect(response.body).toHaveProperty('tokens');
      expect(response.body.tokens).toHaveProperty('accessToken');
      expect(response.body.tokens).toHaveProperty('refreshToken');
      expect(response.body.tokens.accessToken).not.toBe(tokens.accessToken);
    });

    it('should reject refresh with invalid token', async () => {
      const response = await request(app)
        .post('/api/refresh')
        .send({
          refreshToken: 'invalid-token'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject refresh with missing token', async () => {
      const response = await request(app)
        .post('/api/refresh')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });
});
