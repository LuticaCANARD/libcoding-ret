import request from 'supertest';
import { createApp } from '../src/app';
import { TestHelper } from './test-helper';

const app = createApp();

describe('Integration Tests', () => {
  beforeEach(async () => {
    await TestHelper.cleanupUsers();
  });

  describe('Complete mentor-mentee matching flow', () => {
    it('should complete full matching workflow', async () => {
      // 1. Register a mentor
      const mentorSignup = await request(app)
        .post('/api/signup')
        .send({
          email: 'mentor@integration.com',
          password: 'password123',
          name: 'Integration Mentor',
          role: 'mentor'
        })
        .expect(201);

      const mentorTokens = mentorSignup.body.tokens;
      const mentorId = mentorSignup.body.user.id;

      // 2. Update mentor profile with skills
      await request(app)
        .put('/api/profile')
        .set(TestHelper.getAuthHeader(mentorTokens.accessToken))
        .send({
          bio: 'Experienced JavaScript mentor',
          skills: JSON.stringify(['JavaScript', 'React', 'Node.js'])
        })
        .expect(200);

      // 3. Register a mentee
      const menteeSignup = await request(app)
        .post('/api/signup')
        .send({
          email: 'mentee@integration.com',
          password: 'password123',
          name: 'Integration Mentee',
          role: 'mentee'
        })
        .expect(201);

      const menteeTokens = menteeSignup.body.tokens;

      // 4. Mentee searches for mentors
      const mentorSearch = await request(app)
        .get('/api/mentors?skills=JavaScript')
        .set(TestHelper.getAuthHeader(menteeTokens.accessToken))
        .expect(200);

      expect(mentorSearch.body.mentors.length).toBeGreaterThan(0);
      const foundMentor = mentorSearch.body.mentors.find((m: any) => m.id === mentorId);
      expect(foundMentor).toBeDefined();

      // 5. Mentee views specific mentor
      const mentorDetail = await request(app)
        .get(`/api/mentors/${mentorId}`)
        .set(TestHelper.getAuthHeader(menteeTokens.accessToken))
        .expect(200);

      expect(mentorDetail.body.mentor.id).toBe(mentorId);
      expect(mentorDetail.body.mentor.bio).toContain('JavaScript');

      // 6. Mentee sends match request
      const matchRequest = await request(app)
        .post(`/api/mentors/${mentorId}/request`)
        .set(TestHelper.getAuthHeader(menteeTokens.accessToken))
        .send({
          message: 'Hi! I would love to learn JavaScript from you.'
        })
        .expect(201);

      const requestId = matchRequest.body.matchRequest.id;

      // 7. Mentor checks received requests
      const mentorRequests = await request(app)
        .get('/api/match-requests')
        .set(TestHelper.getAuthHeader(mentorTokens.accessToken))
        .expect(200);

      expect(mentorRequests.body.requests.length).toBe(1);
      expect(mentorRequests.body.requests[0].id).toBe(requestId);
      expect(mentorRequests.body.requests[0].status).toBe('pending');

      // 8. Mentee checks sent requests
      const menteeRequests = await request(app)
        .get('/api/match-requests')
        .set(TestHelper.getAuthHeader(menteeTokens.accessToken))
        .expect(200);

      expect(menteeRequests.body.requests.length).toBe(1);
      expect(menteeRequests.body.requests[0].id).toBe(requestId);

      // 9. Mentor accepts the request
      const acceptedRequest = await request(app)
        .put(`/api/match-requests/${requestId}/accept`)
        .set(TestHelper.getAuthHeader(mentorTokens.accessToken))
        .expect(200);

      expect(acceptedRequest.body.matchRequest.status).toBe('accepted');

      // 10. Verify both parties can see the accepted match
      const mentorFinalCheck = await request(app)
        .get('/api/match-requests')
        .set(TestHelper.getAuthHeader(mentorTokens.accessToken))
        .expect(200);

      expect(mentorFinalCheck.body.requests[0].status).toBe('accepted');

      const menteeFinalCheck = await request(app)
        .get('/api/match-requests')
        .set(TestHelper.getAuthHeader(menteeTokens.accessToken))
        .expect(200);

      expect(menteeFinalCheck.body.requests[0].status).toBe('accepted');
    });

    it('should handle rejection workflow', async () => {
      // Setup mentor and mentee
      const mentor = await TestHelper.createMentor({
        email: 'reject-mentor@integration.com',
        name: 'Reject Test Mentor'
      });
      const mentorTokens = TestHelper.generateAuthTokens(mentor);

      const mentee = await TestHelper.createMentee({
        email: 'reject-mentee@integration.com',
        name: 'Reject Test Mentee'
      });
      const menteeTokens = TestHelper.generateAuthTokens(mentee);

      // Create match request
      const matchRequest = await request(app)
        .post(`/api/mentors/${mentor.id}/request`)
        .set(TestHelper.getAuthHeader(menteeTokens.accessToken))
        .send({ message: 'Please be my mentor!' })
        .expect(201);

      const requestId = matchRequest.body.matchRequest.id;

      // Mentor rejects the request
      const rejectedRequest = await request(app)
        .put(`/api/match-requests/${requestId}/reject`)
        .set(TestHelper.getAuthHeader(mentorTokens.accessToken))
        .expect(200);

      expect(rejectedRequest.body.matchRequest.status).toBe('rejected');

      // Verify status is updated for both parties
      const mentorCheck = await request(app)
        .get('/api/match-requests')
        .set(TestHelper.getAuthHeader(mentorTokens.accessToken))
        .expect(200);

      expect(mentorCheck.body.requests[0].status).toBe('rejected');
    });

    it('should handle cancellation workflow', async () => {
      // Setup mentor and mentee
      const mentor = await TestHelper.createMentor({
        email: 'cancel-mentor@integration.com',
        name: 'Cancel Test Mentor'
      });

      const mentee = await TestHelper.createMentee({
        email: 'cancel-mentee@integration.com',
        name: 'Cancel Test Mentee'
      });
      const menteeTokens = TestHelper.generateAuthTokens(mentee);

      // Create match request
      const matchRequest = await request(app)
        .post(`/api/mentors/${mentor.id}/request`)
        .set(TestHelper.getAuthHeader(menteeTokens.accessToken))
        .send({ message: 'Please be my mentor!' })
        .expect(201);

      const requestId = matchRequest.body.matchRequest.id;

      // Mentee cancels the request
      const cancelResponse = await request(app)
        .delete(`/api/match-requests/${requestId}`)
        .set(TestHelper.getAuthHeader(menteeTokens.accessToken))
        .expect(200);

      expect(cancelResponse.body.message).toContain('cancelled');

      // Verify request is deleted
      const menteeCheck = await request(app)
        .get('/api/match-requests')
        .set(TestHelper.getAuthHeader(menteeTokens.accessToken))
        .expect(200);

      expect(menteeCheck.body.requests.length).toBe(0);
    });
  });

  describe('Profile management workflow', () => {
    it('should handle complete profile management', async () => {
      // Register user
      const signup = await request(app)
        .post('/api/signup')
        .send({
          email: 'profile@integration.com',
          password: 'password123',
          name: 'Profile Test User',
          role: 'mentor'
        })
        .expect(201);

      const tokens = signup.body.tokens;

      // Get initial profile
      const initialProfile = await request(app)
        .get('/api/profile')
        .set(TestHelper.getAuthHeader(tokens.accessToken))
        .expect(200);

      expect(initialProfile.body.user.name).toBe('Profile Test User');
      expect(initialProfile.body.user.bio).toBeNull();

      // Update profile
      const updateProfile = await request(app)
        .put('/api/profile')
        .set(TestHelper.getAuthHeader(tokens.accessToken))
        .send({
          name: 'Updated Profile Name',
          bio: 'Updated bio information',
          skills: JSON.stringify(['JavaScript', 'TypeScript'])
        })
        .expect(200);

      expect(updateProfile.body.user.name).toBe('Updated Profile Name');
      expect(updateProfile.body.user.bio).toBe('Updated bio information');

      // Upload profile image
      const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      
      const imageUpload = await request(app)
        .post('/api/profile/image')
        .set(TestHelper.getAuthHeader(tokens.accessToken))
        .send({
          image: `data:image/png;base64,${testImageBase64}`
        })
        .expect(200);

      expect(imageUpload.body.message).toContain('uploaded');

      // Get profile image
      const profileImage = await request(app)
        .get('/api/profile/image')
        .set(TestHelper.getAuthHeader(tokens.accessToken))
        .expect(200);

      expect(profileImage.headers['content-type']).toBe('image/jpeg');

      // Delete profile image
      const deleteImage = await request(app)
        .delete('/api/profile/image')
        .set(TestHelper.getAuthHeader(tokens.accessToken))
        .expect(200);

      expect(deleteImage.body.message).toContain('deleted');

      // Verify image is deleted
      await request(app)
        .get('/api/profile/image')
        .set(TestHelper.getAuthHeader(tokens.accessToken))
        .expect(404);
    });
  });

  describe('Authentication workflow', () => {
    it('should handle complete authentication flow', async () => {
      const userCredentials = {
        email: 'auth@integration.com',
        password: 'password123',
        name: 'Auth Test User',
        role: 'mentee'
      };

      // Register
      const signup = await request(app)
        .post('/api/signup')
        .send(userCredentials)
        .expect(201);

      expect(signup.body.tokens).toHaveProperty('accessToken');
      expect(signup.body.tokens).toHaveProperty('refreshToken');

      const originalTokens = signup.body.tokens;

      // Use access token to access protected route
      const profileAccess = await request(app)
        .get('/api/profile')
        .set(TestHelper.getAuthHeader(originalTokens.accessToken))
        .expect(200);

      expect(profileAccess.body.user.email).toBe(userCredentials.email);

      // Login with credentials
      const login = await request(app)
        .post('/api/login')
        .send({
          email: userCredentials.email,
          password: userCredentials.password
        })
        .expect(200);

      expect(login.body.tokens).toHaveProperty('accessToken');
      expect(login.body.tokens).toHaveProperty('refreshToken');

      // Refresh tokens
      const refresh = await request(app)
        .post('/api/refresh')
        .send({
          refreshToken: login.body.tokens.refreshToken
        })
        .expect(200);

      expect(refresh.body.tokens).toHaveProperty('accessToken');
      expect(refresh.body.tokens).toHaveProperty('refreshToken');
      expect(refresh.body.tokens.accessToken).not.toBe(login.body.tokens.accessToken);

      // Use new access token
      const newProfileAccess = await request(app)
        .get('/api/profile')
        .set(TestHelper.getAuthHeader(refresh.body.tokens.accessToken))
        .expect(200);

      expect(newProfileAccess.body.user.email).toBe(userCredentials.email);
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle multiple simultaneous requests gracefully', async () => {
      const mentor = await TestHelper.createMentor({
        email: 'concurrent-mentor@test.com',
        name: 'Concurrent Test Mentor'
      });

      const mentees = await Promise.all([
        TestHelper.createMentee({ email: 'mentee1@test.com', name: 'Mentee 1' }),
        TestHelper.createMentee({ email: 'mentee2@test.com', name: 'Mentee 2' }),
        TestHelper.createMentee({ email: 'mentee3@test.com', name: 'Mentee 3' })
      ]);

      const menteeTokens = mentees.map(mentee => TestHelper.generateAuthTokens(mentee));

      // Send requests simultaneously
      const requests = await Promise.all(
        menteeTokens.map((tokens, index) =>
          request(app)
            .post(`/api/mentors/${mentor.id}/request`)
            .set(TestHelper.getAuthHeader(tokens.accessToken))
            .send({ message: `Request from mentee ${index + 1}` })
        )
      );

      // All should succeed
      requests.forEach(response => {
        expect(response.status).toBe(201);
      });

      // Mentor should see all requests
      const mentorTokens = TestHelper.generateAuthTokens(mentor);
      const mentorRequests = await request(app)
        .get('/api/match-requests')
        .set(TestHelper.getAuthHeader(mentorTokens.accessToken))
        .expect(200);

      expect(mentorRequests.body.requests.length).toBe(3);
    });

    it('should validate role-based access consistently', async () => {
      const mentor = await TestHelper.createMentor({
        email: 'role-mentor@test.com',
        name: 'Role Test Mentor'
      });
      const mentorTokens = TestHelper.generateAuthTokens(mentor);

      const mentee = await TestHelper.createMentee({
        email: 'role-mentee@test.com',
        name: 'Role Test Mentee'
      });
      const menteeTokens = TestHelper.generateAuthTokens(mentee);

      // Create a match request
      const matchRequest = await TestHelper.createMatchRequest(mentor.id, mentee.id);

      // Mentee should not be able to accept/reject
      await request(app)
        .put(`/api/match-requests/${matchRequest.id}/accept`)
        .set(TestHelper.getAuthHeader(menteeTokens.accessToken))
        .expect(403);

      await request(app)
        .put(`/api/match-requests/${matchRequest.id}/reject`)
        .set(TestHelper.getAuthHeader(menteeTokens.accessToken))
        .expect(403);

      // Mentor should not be able to send requests
      await request(app)
        .post(`/api/mentors/${mentor.id}/request`)
        .set(TestHelper.getAuthHeader(mentorTokens.accessToken))
        .send({ message: 'Self request' })
        .expect(403);
    });
  });
});
