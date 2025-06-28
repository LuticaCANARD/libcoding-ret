import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from './setup';
import { 
  createTestMentor, 
  createTestMentee, 
  generateToken, 
  getAuthHeader, 
  generateTestImageBase64,
  expectValidationError, 
  expectUnauthorizedError, 
  expectSuccessResponse 
} from './helpers';

describe('User Profile API', () => {
  let app: any;

  beforeAll(() => {
    app = createApp();
  });

  describe('GET /api/me', () => {
    it('should get current mentor profile successfully', async () => {
      const mentor = await createTestMentor();
      const token = generateToken(mentor);

      const response = await request(app)
        .get('/api/me')
        .set(getAuthHeader(token));

      expectSuccessResponse(response, 200);
      expect(response.body).toHaveProperty('id', mentor.id);
      expect(response.body).toHaveProperty('email', mentor.email);
      expect(response.body).toHaveProperty('role', 'mentor');
      expect(response.body).toHaveProperty('profile');
      expect(response.body.profile).toHaveProperty('name', mentor.name);
      expect(response.body.profile).toHaveProperty('bio', mentor.bio);
      expect(response.body.profile).toHaveProperty('skills');
    });

    it('should get current mentee profile successfully', async () => {
      const mentee = await createTestMentee();
      const token = generateToken(mentee);

      const response = await request(app)
        .get('/api/me')
        .set(getAuthHeader(token));

      expectSuccessResponse(response, 200);
      expect(response.body).toHaveProperty('id', mentee.id);
      expect(response.body).toHaveProperty('email', mentee.email);
      expect(response.body).toHaveProperty('role', 'mentee');
      expect(response.body).toHaveProperty('profile');
      expect(response.body.profile).toHaveProperty('name', mentee.name);
      expect(response.body.profile).toHaveProperty('bio', mentee.bio);
      expect(response.body.profile).not.toHaveProperty('skills');
    });

    it('should fail without authentication token', async () => {
      const response = await request(app)
        .get('/api/me');

      expectUnauthorizedError(response);
    });

    it('should fail with invalid authentication token', async () => {
      const response = await request(app)
        .get('/api/me')
        .set(getAuthHeader('invalid-token'));

      expectUnauthorizedError(response);
    });

    it('should fail with expired token', async () => {
      const mentor = await createTestMentor();
      const expiredPayload = {
        iss: 'mentor-mentee-app',
        sub: mentor.id.toString(),
        aud: 'mentor-mentee-users',
        exp: Math.floor(Date.now() / 1000) - 3600, // 1시간 전 만료
        nbf: Math.floor(Date.now() / 1000) - 7200,
        iat: Math.floor(Date.now() / 1000) - 7200,
        jti: 'expired-jwt',
        name: mentor.name,
        email: mentor.email,
        role: mentor.role
      };

      const jwt = require('jsonwebtoken');
      const expiredToken = jwt.sign(expiredPayload, process.env.JWT_SECRET || 'test-secret');

      const response = await request(app)
        .get('/api/me')
        .set(getAuthHeader(expiredToken));

      expectUnauthorizedError(response);
    });
  });

  describe('PUT /api/profile', () => {
    it('should update mentor profile successfully', async () => {
      const mentor = await createTestMentor();
      const token = generateToken(mentor);

      const updateData = {
        id: mentor.id,
        name: 'Updated Mentor Name',
        role: 'mentor',
        bio: 'Updated mentor bio',
        image: generateTestImageBase64(),
        skills: ['JavaScript', 'TypeScript', 'React']
      };

      const response = await request(app)
        .put('/api/profile')
        .set(getAuthHeader(token))
        .send(updateData);

      expectSuccessResponse(response, 200);

      // 데이터베이스에서 업데이트 확인
      const updatedUser = await prisma.user.findUnique({
        where: { id: mentor.id }
      });

      expect(updatedUser?.name).toBe(updateData.name);
      expect(updatedUser?.bio).toBe(updateData.bio);
      expect(updatedUser?.skills).toBe(JSON.stringify(updateData.skills));
      expect(updatedUser?.image).toBeTruthy();
    });

    it('should update mentee profile successfully', async () => {
      const mentee = await createTestMentee();
      const token = generateToken(mentee);

      const updateData = {
        id: mentee.id,
        name: 'Updated Mentee Name',
        role: 'mentee',
        bio: 'Updated mentee bio',
        image: generateTestImageBase64()
      };

      const response = await request(app)
        .put('/api/profile')
        .set(getAuthHeader(token))
        .send(updateData);

      expectSuccessResponse(response, 200);

      // 데이터베이스에서 업데이트 확인
      const updatedUser = await prisma.user.findUnique({
        where: { id: mentee.id }
      });

      expect(updatedUser?.name).toBe(updateData.name);
      expect(updatedUser?.bio).toBe(updateData.bio);
    });

    it('should fail without authentication token', async () => {
      const updateData = {
        id: 1,
        name: 'Test Name',
        role: 'mentor',
        bio: 'Test bio',
        image: generateTestImageBase64(),
        skills: ['React']
      };

      const response = await request(app)
        .put('/api/profile')
        .send(updateData);

      expectUnauthorizedError(response);
    });

    it('should fail when updating another user profile', async () => {
      const mentor1 = await createTestMentor({ email: 'mentor1@test.com' });
      const mentor2 = await createTestMentor({ email: 'mentor2@test.com' });
      const token = generateToken(mentor1);

      const updateData = {
        id: mentor2.id, // 다른 사용자의 ID
        name: 'Hacked Name',
        role: 'mentor',
        bio: 'Hacked bio',
        image: generateTestImageBase64(),
        skills: ['Hacking']
      };

      const response = await request(app)
        .put('/api/profile')
        .set(getAuthHeader(token))
        .send(updateData);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });

    it('should fail with invalid image format', async () => {
      const mentor = await createTestMentor();
      const token = generateToken(mentor);

      const updateData = {
        id: mentor.id,
        name: 'Test Name',
        role: 'mentor',
        bio: 'Test bio',
        image: 'invalid-base64-image',
        skills: ['React']
      };

      const response = await request(app)
        .put('/api/profile')
        .set(getAuthHeader(token))
        .send(updateData);

      expectValidationError(response, 'image');
    });

    it('should fail with missing required fields', async () => {
      const mentor = await createTestMentor();
      const token = generateToken(mentor);

      const updateData = {
        id: mentor.id
        // name, role, bio 누락
      };

      const response = await request(app)
        .put('/api/profile')
        .set(getAuthHeader(token))
        .send(updateData);

      expectValidationError(response);
    });

    it('should fail when mentee tries to update with skills', async () => {
      const mentee = await createTestMentee();
      const token = generateToken(mentee);

      const updateData = {
        id: mentee.id,
        name: 'Test Mentee',
        role: 'mentee',
        bio: 'Test bio',
        image: generateTestImageBase64(),
        skills: ['React'] // mentee는 skills를 가질 수 없음
      };

      const response = await request(app)
        .put('/api/profile')
        .set(getAuthHeader(token))
        .send(updateData);

      expectValidationError(response, 'skills');
    });

    it('should fail when mentor tries to update without skills', async () => {
      const mentor = await createTestMentor();
      const token = generateToken(mentor);

      const updateData = {
        id: mentor.id,
        name: 'Test Mentor',
        role: 'mentor',
        bio: 'Test bio',
        image: generateTestImageBase64()
        // skills 누락
      };

      const response = await request(app)
        .put('/api/profile')
        .set(getAuthHeader(token))
        .send(updateData);

      expectValidationError(response, 'skills');
    });
  });

  describe('GET /api/images/:role/:id', () => {
    it('should get mentor profile image successfully', async () => {
      const mentor = await createTestMentor();
      
      // 이미지 업데이트
      const imageBuffer = Buffer.from(generateTestImageBase64(), 'base64');
      await prisma.user.update({
        where: { id: mentor.id },
        data: { image: imageBuffer }
      });

      const token = generateToken(mentor);

      const response = await request(app)
        .get(`/api/images/mentor/${mentor.id}`)
        .set(getAuthHeader(token));

      expectSuccessResponse(response, 200);
      expect(response.headers['content-type']).toBe('image/png');
    });

    it('should get mentee profile image successfully', async () => {
      const mentee = await createTestMentee();
      
      // 이미지 업데이트
      const imageBuffer = Buffer.from(generateTestImageBase64(), 'base64');
      await prisma.user.update({
        where: { id: mentee.id },
        data: { image: imageBuffer }
      });

      const token = generateToken(mentee);

      const response = await request(app)
        .get(`/api/images/mentee/${mentee.id}`)
        .set(getAuthHeader(token));

      expectSuccessResponse(response, 200);
      expect(response.headers['content-type']).toBe('image/png');
    });

    it('should return default image when user has no image', async () => {
      const mentor = await createTestMentor();
      const token = generateToken(mentor);

      const response = await request(app)
        .get(`/api/images/mentor/${mentor.id}`)
        .set(getAuthHeader(token));

      // 기본 이미지로 리다이렉트 또는 기본 응답
      expect([200, 302, 404]).toContain(response.status);
    });

    it('should fail without authentication token', async () => {
      const response = await request(app)
        .get('/api/images/mentor/1');

      expectUnauthorizedError(response);
    });

    it('should fail with non-existent user', async () => {
      const mentor = await createTestMentor();
      const token = generateToken(mentor);

      const response = await request(app)
        .get('/api/images/mentor/99999')
        .set(getAuthHeader(token));

      expect(response.status).toBe(404);
    });

    it('should fail with invalid role', async () => {
      const mentor = await createTestMentor();
      const token = generateToken(mentor);

      const response = await request(app)
        .get(`/api/images/invalid-role/${mentor.id}`)
        .set(getAuthHeader(token));

      expectValidationError(response, 'role');
    });
  });
});
