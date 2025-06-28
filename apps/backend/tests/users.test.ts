import request from 'supertest';
import { createApp } from '../src/app';
import { TestHelper } from './test-helper';

const app = createApp();

describe('User API', () => {
  let testUser: any;
  let authTokens: any;

  beforeEach(async () => {
    await TestHelper.cleanupUsers();
    testUser = await TestHelper.createTestUser({
      email: 'user-test@example.com',
      password: 'password123',
      name: 'User Test',
      role: 'mentee'
    });
    authTokens = TestHelper.generateAuthTokens(testUser);
  });

  describe('GET /api/profile', () => {
    it('should get user profile successfully', async () => {
      const response = await request(app)
        .get('/api/profile')
        .set(TestHelper.getAuthHeader(authTokens.accessToken))
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user.id).toBe(testUser.id);
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user.name).toBe(testUser.name);
      expect(response.body.user.role).toBe(testUser.role);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should reject request without authentication', async () => {
      const response = await request(app)
        .get('/api/profile')
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.details).toContain('token');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/profile', () => {
    it('should update user profile successfully', async () => {
      const updateData = {
        name: 'Updated Name',
        bio: 'Updated bio',
        skills: JSON.stringify(['JavaScript', 'Python'])
      };

      const response = await request(app)
        .put('/api/profile')
        .set(TestHelper.getAuthHeader(authTokens.accessToken))
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user.name).toBe(updateData.name);
      expect(response.body.user.bio).toBe(updateData.bio);
      expect(response.body.user.skills).toBe(updateData.skills);
    });

    it('should update only provided fields', async () => {
      const updateData = {
        name: 'New Name Only'
      };

      const response = await request(app)
        .put('/api/profile')
        .set(TestHelper.getAuthHeader(authTokens.accessToken))
        .send(updateData)
        .expect(200);

      expect(response.body.user.name).toBe(updateData.name);
      expect(response.body.user.email).toBe(testUser.email); // Should remain unchanged
    });

    it('should reject update without authentication', async () => {
      const response = await request(app)
        .put('/api/profile')
        .send({ name: 'New Name' })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject update with invalid data', async () => {
      const updateData = {
        email: 'invalid-email' // Invalid email format
      };

      const response = await request(app)
        .put('/api/profile')
        .set(TestHelper.getAuthHeader(authTokens.accessToken))
        .send(updateData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject duplicate email update', async () => {
      // Create another user
      const anotherUser = await TestHelper.createTestUser({
        email: 'another@example.com',
        password: 'password123',
        name: 'Another User',
        role: 'mentor'
      });

      const updateData = {
        email: anotherUser.email // Try to use existing email
      };

      const response = await request(app)
        .put('/api/profile')
        .set(TestHelper.getAuthHeader(authTokens.accessToken))
        .send(updateData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.details).toContain('already exists');
    });
  });

  describe('POST /api/profile/image', () => {
    it('should upload profile image successfully', async () => {
      // Create a simple test image data (base64 encoded 1x1 pixel PNG)
      const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      
      const response = await request(app)
        .post('/api/profile/image')
        .set(TestHelper.getAuthHeader(authTokens.accessToken))
        .send({
          image: `data:image/png;base64,${testImageBase64}`
        })
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('uploaded');
    });

    it('should reject image upload without authentication', async () => {
      const response = await request(app)
        .post('/api/profile/image')
        .send({
          image: 'data:image/png;base64,test'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject invalid image format', async () => {
      const response = await request(app)
        .post('/api/profile/image')
        .set(TestHelper.getAuthHeader(authTokens.accessToken))
        .send({
          image: 'invalid-image-data'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject missing image data', async () => {
      const response = await request(app)
        .post('/api/profile/image')
        .set(TestHelper.getAuthHeader(authTokens.accessToken))
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/profile/image', () => {
    beforeEach(async () => {
      // Upload an image first
      const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      
      await request(app)
        .post('/api/profile/image')
        .set(TestHelper.getAuthHeader(authTokens.accessToken))
        .send({
          image: `data:image/png;base64,${testImageBase64}`
        });
    });

    it('should get profile image successfully', async () => {
      const response = await request(app)
        .get('/api/profile/image')
        .set(TestHelper.getAuthHeader(authTokens.accessToken))
        .expect(200);

      expect(response.headers['content-type']).toBe('image/jpeg');
      expect(response.body).toBeDefined();
    });

    it('should reject image request without authentication', async () => {
      const response = await request(app)
        .get('/api/profile/image')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/profile/image', () => {
    beforeEach(async () => {
      // Upload an image first
      const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      
      await request(app)
        .post('/api/profile/image')
        .set(TestHelper.getAuthHeader(authTokens.accessToken))
        .send({
          image: `data:image/png;base64,${testImageBase64}`
        });
    });

    it('should delete profile image successfully', async () => {
      const response = await request(app)
        .delete('/api/profile/image')
        .set(TestHelper.getAuthHeader(authTokens.accessToken))
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('deleted');
    });

    it('should reject delete request without authentication', async () => {
      const response = await request(app)
        .delete('/api/profile/image')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });
});
