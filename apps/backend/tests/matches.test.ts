import request from 'supertest';
import { createApp } from '../src/app';
import { TestHelper } from './test-helper';

const app = createApp();

describe('Match API', () => {
  let menteeUser: any;
  let mentorUser: any;
  let anotherMentorUser: any;
  let menteeTokens: any;
  let mentorTokens: any;
  let anotherMentorTokens: any;

  beforeEach(async () => {
    await TestHelper.cleanupUsers();
    
    // Create users
    menteeUser = await TestHelper.createMentee({
      email: 'mentee@example.com',
      name: 'Test Mentee'
    });
    menteeTokens = TestHelper.generateAuthTokens(menteeUser);

    mentorUser = await TestHelper.createMentor({
      email: 'mentor@example.com',
      name: 'Test Mentor'
    });
    mentorTokens = TestHelper.generateAuthTokens(mentorUser);

    anotherMentorUser = await TestHelper.createMentor({
      email: 'mentor2@example.com',
      name: 'Another Mentor'
    });
    anotherMentorTokens = TestHelper.generateAuthTokens(anotherMentorUser);
  });

  describe('POST /api/mentors/:id/request', () => {
    it('should create match request successfully', async () => {
      const requestData = {
        message: 'Hello, I would like to learn from you!'
      };

      const response = await request(app)
        .post(`/api/mentors/${mentorUser.id}/request`)
        .set(TestHelper.getAuthHeader(menteeTokens.accessToken))
        .send(requestData)
        .expect(201);

      expect(response.body).toHaveProperty('matchRequest');
      expect(response.body.matchRequest.mentorId).toBe(mentorUser.id);
      expect(response.body.matchRequest.menteeId).toBe(menteeUser.id);
      expect(response.body.matchRequest.message).toBe(requestData.message);
      expect(response.body.matchRequest.status).toBe('pending');
    });

    it('should reject request without authentication', async () => {
      const response = await request(app)
        .post(`/api/mentors/${mentorUser.id}/request`)
        .send({ message: 'Test message' })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject request from mentor to mentor', async () => {
      const response = await request(app)
        .post(`/api/mentors/${anotherMentorUser.id}/request`)
        .set(TestHelper.getAuthHeader(mentorTokens.accessToken))
        .send({ message: 'Test message' })
        .expect(403);

      expect(response.body).toHaveProperty('error');
      expect(response.body.details).toContain('mentees');
    });

    it('should reject duplicate match request', async () => {
      // Create first request
      await request(app)
        .post(`/api/mentors/${mentorUser.id}/request`)
        .set(TestHelper.getAuthHeader(menteeTokens.accessToken))
        .send({ message: 'First request' })
        .expect(201);

      // Try to create duplicate request
      const response = await request(app)
        .post(`/api/mentors/${mentorUser.id}/request`)
        .set(TestHelper.getAuthHeader(menteeTokens.accessToken))
        .send({ message: 'Duplicate request' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.details).toContain('already exists');
    });

    it('should reject request to non-existent mentor', async () => {
      const response = await request(app)
        .post('/api/mentors/99999/request')
        .set(TestHelper.getAuthHeader(menteeTokens.accessToken))
        .send({ message: 'Test message' })
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject request with missing message', async () => {
      const response = await request(app)
        .post(`/api/mentors/${mentorUser.id}/request`)
        .set(TestHelper.getAuthHeader(menteeTokens.accessToken))
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject request with invalid mentor ID format', async () => {
      const response = await request(app)
        .post('/api/mentors/invalid-id/request')
        .set(TestHelper.getAuthHeader(menteeTokens.accessToken))
        .send({ message: 'Test message' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/match-requests', () => {
    beforeEach(async () => {
      // Create some match requests for testing
      await TestHelper.createMatchRequest(mentorUser.id, menteeUser.id);
      await TestHelper.createMatchRequest(anotherMentorUser.id, menteeUser.id);
    });

    it('should get match requests for mentee (sent requests)', async () => {
      const response = await request(app)
        .get('/api/match-requests')
        .set(TestHelper.getAuthHeader(menteeTokens.accessToken))
        .expect(200);

      expect(response.body).toHaveProperty('requests');
      expect(Array.isArray(response.body.requests)).toBe(true);
      expect(response.body.requests.length).toBe(2);
      
      response.body.requests.forEach((request: any) => {
        expect(request.menteeId).toBe(menteeUser.id);
        expect(request).toHaveProperty('mentor');
        expect(request.mentor.role).toBe('mentor');
      });
    });

    it('should get match requests for mentor (received requests)', async () => {
      const response = await request(app)
        .get('/api/match-requests')
        .set(TestHelper.getAuthHeader(mentorTokens.accessToken))
        .expect(200);

      expect(response.body).toHaveProperty('requests');
      expect(Array.isArray(response.body.requests)).toBe(true);
      expect(response.body.requests.length).toBe(1);
      
      response.body.requests.forEach((request: any) => {
        expect(request.mentorId).toBe(mentorUser.id);
        expect(request).toHaveProperty('mentee');
        expect(request.mentee.role).toBe('mentee');
      });
    });

    it('should reject request without authentication', async () => {
      const response = await request(app)
        .get('/api/match-requests')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle empty results gracefully', async () => {
      // Clean up existing requests
      await TestHelper.cleanupUsers();
      
      // Create new user with no requests
      const newUser = await TestHelper.createMentee({
        email: 'new-mentee@example.com',
        name: 'New Mentee'
      });
      const newTokens = TestHelper.generateAuthTokens(newUser);

      const response = await request(app)
        .get('/api/match-requests')
        .set(TestHelper.getAuthHeader(newTokens.accessToken))
        .expect(200);

      expect(response.body).toHaveProperty('requests');
      expect(Array.isArray(response.body.requests)).toBe(true);
      expect(response.body.requests.length).toBe(0);
    });
  });

  describe('PUT /api/match-requests/:id/accept', () => {
    let matchRequest: any;

    beforeEach(async () => {
      matchRequest = await TestHelper.createMatchRequest(mentorUser.id, menteeUser.id);
    });

    it('should accept match request successfully', async () => {
      const response = await request(app)
        .put(`/api/match-requests/${matchRequest.id}/accept`)
        .set(TestHelper.getAuthHeader(mentorTokens.accessToken))
        .expect(200);

      expect(response.body).toHaveProperty('matchRequest');
      expect(response.body.matchRequest.id).toBe(matchRequest.id);
      expect(response.body.matchRequest.status).toBe('accepted');
    });

    it('should reject accept from non-mentor', async () => {
      const response = await request(app)
        .put(`/api/match-requests/${matchRequest.id}/accept`)
        .set(TestHelper.getAuthHeader(menteeTokens.accessToken))
        .expect(403);

      expect(response.body).toHaveProperty('error');
      expect(response.body.details).toContain('mentor');
    });

    it('should reject accept from wrong mentor', async () => {
      const response = await request(app)
        .put(`/api/match-requests/${matchRequest.id}/accept`)
        .set(TestHelper.getAuthHeader(anotherMentorTokens.accessToken))
        .expect(403);

      expect(response.body).toHaveProperty('error');
      expect(response.body.details).toContain('own requests');
    });

    it('should reject accept without authentication', async () => {
      const response = await request(app)
        .put(`/api/match-requests/${matchRequest.id}/accept`)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject accept of non-existent request', async () => {
      const response = await request(app)
        .put('/api/match-requests/99999/accept')
        .set(TestHelper.getAuthHeader(mentorTokens.accessToken))
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/match-requests/:id/reject', () => {
    let matchRequest: any;

    beforeEach(async () => {
      matchRequest = await TestHelper.createMatchRequest(mentorUser.id, menteeUser.id);
    });

    it('should reject match request successfully', async () => {
      const response = await request(app)
        .put(`/api/match-requests/${matchRequest.id}/reject`)
        .set(TestHelper.getAuthHeader(mentorTokens.accessToken))
        .expect(200);

      expect(response.body).toHaveProperty('matchRequest');
      expect(response.body.matchRequest.id).toBe(matchRequest.id);
      expect(response.body.matchRequest.status).toBe('rejected');
    });

    it('should reject reject from non-mentor', async () => {
      const response = await request(app)
        .put(`/api/match-requests/${matchRequest.id}/reject`)
        .set(TestHelper.getAuthHeader(menteeTokens.accessToken))
        .expect(403);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject reject from wrong mentor', async () => {
      const response = await request(app)
        .put(`/api/match-requests/${matchRequest.id}/reject`)
        .set(TestHelper.getAuthHeader(anotherMentorTokens.accessToken))
        .expect(403);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/match-requests/:id', () => {
    let matchRequest: any;

    beforeEach(async () => {
      matchRequest = await TestHelper.createMatchRequest(mentorUser.id, menteeUser.id);
    });

    it('should cancel match request successfully (by mentee)', async () => {
      const response = await request(app)
        .delete(`/api/match-requests/${matchRequest.id}`)
        .set(TestHelper.getAuthHeader(menteeTokens.accessToken))
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('cancelled');
    });

    it('should cancel match request successfully (by mentor)', async () => {
      const response = await request(app)
        .delete(`/api/match-requests/${matchRequest.id}`)
        .set(TestHelper.getAuthHeader(mentorTokens.accessToken))
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('cancelled');
    });

    it('should reject cancel from unrelated user', async () => {
      const unrelatedUser = await TestHelper.createMentee({
        email: 'unrelated@example.com',
        name: 'Unrelated User'
      });
      const unrelatedTokens = TestHelper.generateAuthTokens(unrelatedUser);

      const response = await request(app)
        .delete(`/api/match-requests/${matchRequest.id}`)
        .set(TestHelper.getAuthHeader(unrelatedTokens.accessToken))
        .expect(403);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject cancel without authentication', async () => {
      const response = await request(app)
        .delete(`/api/match-requests/${matchRequest.id}`)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Match request status transitions', () => {
    let matchRequest: any;

    beforeEach(async () => {
      matchRequest = await TestHelper.createMatchRequest(mentorUser.id, menteeUser.id);
    });

    it('should not allow accepting already accepted request', async () => {
      // First accept
      await request(app)
        .put(`/api/match-requests/${matchRequest.id}/accept`)
        .set(TestHelper.getAuthHeader(mentorTokens.accessToken))
        .expect(200);

      // Try to accept again
      const response = await request(app)
        .put(`/api/match-requests/${matchRequest.id}/accept`)
        .set(TestHelper.getAuthHeader(mentorTokens.accessToken))
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.details).toContain('already been accepted');
    });

    it('should not allow rejecting already rejected request', async () => {
      // First reject
      await request(app)
        .put(`/api/match-requests/${matchRequest.id}/reject`)
        .set(TestHelper.getAuthHeader(mentorTokens.accessToken))
        .expect(200);

      // Try to reject again
      const response = await request(app)
        .put(`/api/match-requests/${matchRequest.id}/reject`)
        .set(TestHelper.getAuthHeader(mentorTokens.accessToken))
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.details).toContain('already been rejected');
    });

    it('should not allow rejecting accepted request', async () => {
      // First accept
      await request(app)
        .put(`/api/match-requests/${matchRequest.id}/accept`)
        .set(TestHelper.getAuthHeader(mentorTokens.accessToken))
        .expect(200);

      // Try to reject
      const response = await request(app)
        .put(`/api/match-requests/${matchRequest.id}/reject`)
        .set(TestHelper.getAuthHeader(mentorTokens.accessToken))
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.details).toContain('already been accepted');
    });
  });
});
