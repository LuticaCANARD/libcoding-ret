import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from './setup';
import { 
  createTestMentor, 
  createTestMentee, 
  createTestMatchRequest,
  generateToken, 
  getAuthHeader,
  expectValidationError,
  expectUnauthorizedError, 
  expectNotFoundError,
  expectSuccessResponse 
} from './helpers';

describe('Match Requests API', () => {
  let app: any;

  beforeAll(() => {
    app = createApp();
  });

  describe('POST /api/match-requests', () => {
    let mentor: any;
    let mentee: any;
    let menteeToken: string;

    beforeEach(async () => {
      mentor = await createTestMentor();
      mentee = await createTestMentee();
      menteeToken = generateToken(mentee);
    });

    it('should create match request successfully', async () => {
      const requestData = {
        mentorId: mentor.id,
        menteeId: mentee.id,
        message: '멘토링을 받고 싶습니다!'
      };

      const response = await request(app)
        .post('/api/match-requests')
        .set(getAuthHeader(menteeToken))
        .send(requestData);

      expectSuccessResponse(response, 200);

      // 데이터베이스에서 매칭 요청 확인
      const matchRequest = await prisma.matchRequest.findFirst({
        where: {
          mentorId: mentor.id,
          menteeId: mentee.id
        }
      });

      expect(matchRequest).toBeTruthy();
      expect(matchRequest?.message).toBe(requestData.message);
      expect(matchRequest?.status).toBe('pending');
    });

    it('should fail when mentor tries to create match request', async () => {
      const mentorToken = generateToken(mentor);
      const requestData = {
        mentorId: mentor.id,
        menteeId: mentee.id,
        message: 'Test message'
      };

      const response = await request(app)
        .post('/api/match-requests')
        .set(getAuthHeader(mentorToken))
        .send(requestData);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });

    it('should fail without authentication token', async () => {
      const requestData = {
        mentorId: mentor.id,
        menteeId: mentee.id,
        message: 'Test message'
      };

      const response = await request(app)
        .post('/api/match-requests')
        .send(requestData);

      expectUnauthorizedError(response);
    });

    it('should fail with non-existent mentor', async () => {
      const requestData = {
        mentorId: 99999,
        menteeId: mentee.id,
        message: 'Test message'
      };

      const response = await request(app)
        .post('/api/match-requests')
        .set(getAuthHeader(menteeToken))
        .send(requestData);

      expectValidationError(response, 'mentor');
    });

    it('should fail with missing required fields', async () => {
      const requestData = {
        mentorId: mentor.id
        // menteeId, message 누락
      };

      const response = await request(app)
        .post('/api/match-requests')
        .set(getAuthHeader(menteeToken))
        .send(requestData);

      expectValidationError(response);
    });

    it('should fail when creating duplicate match request', async () => {
      // 첫 번째 요청 생성
      await createTestMatchRequest(mentor.id, mentee.id, 'First request');

      const requestData = {
        mentorId: mentor.id,
        menteeId: mentee.id,
        message: 'Duplicate request'
      };

      const response = await request(app)
        .post('/api/match-requests')
        .set(getAuthHeader(menteeToken))
        .send(requestData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should fail when mentee has pending request to another mentor', async () => {
      const anotherMentor = await createTestMentor({ email: 'mentor2@test.com' });
      
      // 다른 멘토에게 이미 요청 보냄
      await createTestMatchRequest(anotherMentor.id, mentee.id, 'Existing request');

      const requestData = {
        mentorId: mentor.id,
        menteeId: mentee.id,
        message: 'Second request'
      };

      const response = await request(app)
        .post('/api/match-requests')
        .set(getAuthHeader(menteeToken))
        .send(requestData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should fail when trying to request from another mentee', async () => {
      const anotherMentee = await createTestMentee({ email: 'mentee2@test.com' });
      
      const requestData = {
        mentorId: mentor.id,
        menteeId: anotherMentee.id, // 다른 멘티의 ID
        message: 'Unauthorized request'
      };

      const response = await request(app)
        .post('/api/match-requests')
        .set(getAuthHeader(menteeToken))
        .send(requestData);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/match-requests/incoming', () => {
    let mentor: any;
    let menteeToken: string;
    let matchRequests: any[];

    beforeEach(async () => {
      mentor = await createTestMentor();
      const mentorToken = generateToken(mentor);
      
      // 여러 멘티들이 보낸 요청 생성
      const mentee1 = await createTestMentee({ email: 'mentee1@test.com', name: 'Mentee One' });
      const mentee2 = await createTestMentee({ email: 'mentee2@test.com', name: 'Mentee Two' });
      
      matchRequests = await Promise.all([
        createTestMatchRequest(mentor.id, mentee1.id, 'Request from mentee 1', 'pending'),
        createTestMatchRequest(mentor.id, mentee2.id, 'Request from mentee 2', 'pending')
      ]);
    });

    it('should get incoming match requests for mentor successfully', async () => {
      const mentorToken = generateToken(mentor);
      
      const response = await request(app)
        .get('/api/match-requests/incoming')
        .set(getAuthHeader(mentorToken));

      expectSuccessResponse(response, 200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);

      // 요청 구조 확인
      const matchRequest = response.body[0];
      expect(matchRequest).toHaveProperty('id');
      expect(matchRequest).toHaveProperty('mentorId', mentor.id);
      expect(matchRequest).toHaveProperty('menteeId');
      expect(matchRequest).toHaveProperty('message');
      expect(matchRequest).toHaveProperty('status', 'pending');
    });

    it('should fail when mentee tries to get incoming requests', async () => {
      const mentee = await createTestMentee();
      const menteeToken = generateToken(mentee);

      const response = await request(app)
        .get('/api/match-requests/incoming')
        .set(getAuthHeader(menteeToken));

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });

    it('should fail without authentication token', async () => {
      const response = await request(app)
        .get('/api/match-requests/incoming');

      expectUnauthorizedError(response);
    });

    it('should return empty array when mentor has no incoming requests', async () => {
      const newMentor = await createTestMentor({ email: 'newmentor@test.com' });
      const newMentorToken = generateToken(newMentor);

      const response = await request(app)
        .get('/api/match-requests/incoming')
        .set(getAuthHeader(newMentorToken));

      expectSuccessResponse(response, 200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(0);
    });
  });

  describe('GET /api/match-requests/outgoing', () => {
    let mentee: any;
    let menteeToken: string;

    beforeEach(async () => {
      mentee = await createTestMentee();
      menteeToken = generateToken(mentee);
      
      // 여러 멘토에게 보낸 요청 생성
      const mentor1 = await createTestMentor({ email: 'mentor1@test.com', name: 'Mentor One' });
      const mentor2 = await createTestMentor({ email: 'mentor2@test.com', name: 'Mentor Two' });
      
      await Promise.all([
        createTestMatchRequest(mentor1.id, mentee.id, 'Request to mentor 1', 'pending'),
        createTestMatchRequest(mentor2.id, mentee.id, 'Request to mentor 2', 'accepted')
      ]);
    });

    it('should get outgoing match requests for mentee successfully', async () => {
      const response = await request(app)
        .get('/api/match-requests/outgoing')
        .set(getAuthHeader(menteeToken));

      expectSuccessResponse(response, 200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);

      // 요청 구조 확인
      const outgoingRequest = response.body[0];
      expect(outgoingRequest).toHaveProperty('id');
      expect(outgoingRequest).toHaveProperty('mentorId');
      expect(outgoingRequest).toHaveProperty('menteeId', mentee.id);
      expect(outgoingRequest).toHaveProperty('status');
    });

    it('should fail when mentor tries to get outgoing requests', async () => {
      const mentor = await createTestMentor();
      const mentorToken = generateToken(mentor);

      const response = await request(app)
        .get('/api/match-requests/outgoing')
        .set(getAuthHeader(mentorToken));

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });

    it('should fail without authentication token', async () => {
      const response = await request(app)
        .get('/api/match-requests/outgoing');

      expectUnauthorizedError(response);
    });
  });

  describe('PUT /api/match-requests/:id/accept', () => {
    let mentor: any;
    let mentee: any;
    let matchRequest: any;
    let mentorToken: string;

    beforeEach(async () => {
      mentor = await createTestMentor();
      mentee = await createTestMentee();
      mentorToken = generateToken(mentor);
      matchRequest = await createTestMatchRequest(mentor.id, mentee.id, 'Test request');
    });

    it('should accept match request successfully', async () => {
      const response = await request(app)
        .put(`/api/match-requests/${matchRequest.id}/accept`)
        .set(getAuthHeader(mentorToken));

      expectSuccessResponse(response, 200);

      // 데이터베이스에서 상태 확인
      const updatedRequest = await prisma.matchRequest.findUnique({
        where: { id: matchRequest.id }
      });

      expect(updatedRequest?.status).toBe('accepted');
    });

    it('should fail when mentee tries to accept request', async () => {
      const menteeToken = generateToken(mentee);

      const response = await request(app)
        .put(`/api/match-requests/${matchRequest.id}/accept`)
        .set(getAuthHeader(menteeToken));

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });

    it('should fail without authentication token', async () => {
      const response = await request(app)
        .put(`/api/match-requests/${matchRequest.id}/accept`);

      expectUnauthorizedError(response);
    });

    it('should fail with non-existent match request', async () => {
      const response = await request(app)
        .put('/api/match-requests/99999/accept')
        .set(getAuthHeader(mentorToken));

      expectNotFoundError(response);
    });

    it('should fail when trying to accept another mentor request', async () => {
      const anotherMentor = await createTestMentor({ email: 'mentor2@test.com' });
      const anotherMentorToken = generateToken(anotherMentor);

      const response = await request(app)
        .put(`/api/match-requests/${matchRequest.id}/accept`)
        .set(getAuthHeader(anotherMentorToken));

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject other pending requests when accepting one', async () => {
      const anotherMentee = await createTestMentee({ email: 'mentee2@test.com' });
      const anotherRequest = await createTestMatchRequest(mentor.id, anotherMentee.id, 'Another request');

      const response = await request(app)
        .put(`/api/match-requests/${matchRequest.id}/accept`)
        .set(getAuthHeader(mentorToken));

      expectSuccessResponse(response, 200);

      // 다른 요청이 거절되었는지 확인
      const rejectedRequest = await prisma.matchRequest.findUnique({
        where: { id: anotherRequest.id }
      });

      expect(rejectedRequest?.status).toBe('rejected');
    });
  });

  describe('PUT /api/match-requests/:id/reject', () => {
    let mentor: any;
    let mentee: any;
    let matchRequest: any;
    let mentorToken: string;

    beforeEach(async () => {
      mentor = await createTestMentor();
      mentee = await createTestMentee();
      mentorToken = generateToken(mentor);
      matchRequest = await createTestMatchRequest(mentor.id, mentee.id, 'Test request');
    });

    it('should reject match request successfully', async () => {
      const response = await request(app)
        .put(`/api/match-requests/${matchRequest.id}/reject`)
        .set(getAuthHeader(mentorToken));

      expectSuccessResponse(response, 200);

      // 데이터베이스에서 상태 확인
      const updatedRequest = await prisma.matchRequest.findUnique({
        where: { id: matchRequest.id }
      });

      expect(updatedRequest?.status).toBe('rejected');
    });

    it('should fail when mentee tries to reject request', async () => {
      const menteeToken = generateToken(mentee);

      const response = await request(app)
        .put(`/api/match-requests/${matchRequest.id}/reject`)
        .set(getAuthHeader(menteeToken));

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });

    it('should fail without authentication token', async () => {
      const response = await request(app)
        .put(`/api/match-requests/${matchRequest.id}/reject`);

      expectUnauthorizedError(response);
    });

    it('should fail with non-existent match request', async () => {
      const response = await request(app)
        .put('/api/match-requests/99999/reject')
        .set(getAuthHeader(mentorToken));

      expectNotFoundError(response);
    });
  });

  describe('DELETE /api/match-requests/:id', () => {
    let mentor: any;
    let mentee: any;
    let matchRequest: any;
    let menteeToken: string;

    beforeEach(async () => {
      mentor = await createTestMentor();
      mentee = await createTestMentee();
      menteeToken = generateToken(mentee);
      matchRequest = await createTestMatchRequest(mentor.id, mentee.id, 'Test request');
    });

    it('should cancel match request successfully', async () => {
      const response = await request(app)
        .delete(`/api/match-requests/${matchRequest.id}`)
        .set(getAuthHeader(menteeToken));

      expectSuccessResponse(response, 200);

      // 데이터베이스에서 삭제 확인
      const deletedRequest = await prisma.matchRequest.findUnique({
        where: { id: matchRequest.id }
      });

      expect(deletedRequest).toBeNull();
    });

    it('should fail when mentor tries to cancel request', async () => {
      const mentorToken = generateToken(mentor);

      const response = await request(app)
        .delete(`/api/match-requests/${matchRequest.id}`)
        .set(getAuthHeader(mentorToken));

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });

    it('should fail without authentication token', async () => {
      const response = await request(app)
        .delete(`/api/match-requests/${matchRequest.id}`);

      expectUnauthorizedError(response);
    });

    it('should fail with non-existent match request', async () => {
      const response = await request(app)
        .delete('/api/match-requests/99999')
        .set(getAuthHeader(menteeToken));

      expectNotFoundError(response);
    });

    it('should fail when trying to cancel another mentee request', async () => {
      const anotherMentee = await createTestMentee({ email: 'mentee2@test.com' });
      const anotherMenteeToken = generateToken(anotherMentee);

      const response = await request(app)
        .delete(`/api/match-requests/${matchRequest.id}`)
        .set(getAuthHeader(anotherMenteeToken));

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });
  });
});
