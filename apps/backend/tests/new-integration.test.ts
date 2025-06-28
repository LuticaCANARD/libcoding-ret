import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from './setup';
import { 
  createTestMentor, 
  createTestMentee,
  generateToken, 
  getAuthHeader,
  generateTestImageBase64,
  expectSuccessResponse 
} from './helpers';

describe('Integration Tests - Complete User Flow', () => {
  let app: any;

  beforeAll(() => {
    app = createApp();
  });

  describe('Complete Mentor-Mentee Matching Flow', () => {
    it('should complete full user journey successfully', async () => {
      // 1. 회원가입 - 멘토
      const mentorSignupData = {
        email: 'integration-mentor@test.com',
        password: 'password123',
        name: 'Integration Mentor',
        role: 'mentor'
      };

      const mentorSignupResponse = await request(app)
        .post('/api/signup')
        .send(mentorSignupData);

      expectSuccessResponse(mentorSignupResponse, 201);

      // 2. 회원가입 - 멘티
      const menteeSignupData = {
        email: 'integration-mentee@test.com',
        password: 'password123',
        name: 'Integration Mentee',
        role: 'mentee'
      };

      const menteeSignupResponse = await request(app)
        .post('/api/signup')
        .send(menteeSignupData);

      expectSuccessResponse(menteeSignupResponse, 201);

      // 3. 로그인 - 멘토
      const mentorLoginResponse = await request(app)
        .post('/api/login')
        .send({
          email: mentorSignupData.email,
          password: mentorSignupData.password
        });

      expectSuccessResponse(mentorLoginResponse, 200);
      expect(mentorLoginResponse.body).toHaveProperty('token');
      const mentorToken = mentorLoginResponse.body.token;

      // 4. 로그인 - 멘티
      const menteeLoginResponse = await request(app)
        .post('/api/login')
        .send({
          email: menteeSignupData.email,
          password: menteeSignupData.password
        });

      expectSuccessResponse(menteeLoginResponse, 200);
      expect(menteeLoginResponse.body).toHaveProperty('token');
      const menteeToken = menteeLoginResponse.body.token;

      // 5. 멘토 프로필 조회
      const mentorProfileResponse = await request(app)
        .get('/api/me')
        .set(getAuthHeader(mentorToken));

      expectSuccessResponse(mentorProfileResponse, 200);
      const mentorId = mentorProfileResponse.body.id;

      // 6. 멘티 프로필 조회
      const menteeProfileResponse = await request(app)
        .get('/api/me')
        .set(getAuthHeader(menteeToken));

      expectSuccessResponse(menteeProfileResponse, 200);
      const menteeId = menteeProfileResponse.body.id;

      // 7. 멘토 프로필 업데이트
      const mentorUpdateData = {
        id: mentorId,
        name: 'Updated Integration Mentor',
        role: 'mentor',
        bio: 'Expert in full-stack development',
        image: generateTestImageBase64(),
        skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL']
      };

      const mentorUpdateResponse = await request(app)
        .put('/api/profile')
        .set(getAuthHeader(mentorToken))
        .send(mentorUpdateData);

      expectSuccessResponse(mentorUpdateResponse, 200);

      // 8. 멘티 프로필 업데이트
      const menteeUpdateData = {
        id: menteeId,
        name: 'Updated Integration Mentee',
        role: 'mentee',
        bio: 'Passionate about learning web development',
        image: generateTestImageBase64()
      };

      const menteeUpdateResponse = await request(app)
        .put('/api/profile')
        .set(getAuthHeader(menteeToken))
        .send(menteeUpdateData);

      expectSuccessResponse(menteeUpdateResponse, 200);

      // 9. 멘토 목록 조회 (멘티로)
      const mentorsListResponse = await request(app)
        .get('/api/mentors')
        .set(getAuthHeader(menteeToken));

      expectSuccessResponse(mentorsListResponse, 200);
      expect(Array.isArray(mentorsListResponse.body)).toBe(true);
      expect(mentorsListResponse.body.length).toBeGreaterThan(0);

      // 업데이트된 멘토 찾기
      const updatedMentor = mentorsListResponse.body.find(
        (m: any) => m.id === mentorId
      );
      expect(updatedMentor).toBeTruthy();
      expect(updatedMentor.profile.name).toBe('Updated Integration Mentor');
      expect(updatedMentor.profile.skills).toContain('React');

      // 10. 스킬로 멘토 필터링
      const filteredMentorsResponse = await request(app)
        .get('/api/mentors?skill=React')
        .set(getAuthHeader(menteeToken));

      expectSuccessResponse(filteredMentorsResponse, 200);
      expect(filteredMentorsResponse.body.length).toBeGreaterThan(0);
      
      const reactMentor = filteredMentorsResponse.body.find(
        (m: any) => m.id === mentorId
      );
      expect(reactMentor).toBeTruthy();

      // 11. 매칭 요청 생성 (멘티가 멘토에게)
      const matchRequestData = {
        mentorId: mentorId,
        menteeId: menteeId,
        message: '안녕하세요! React와 Node.js를 배우고 싶어서 멘토링을 요청드립니다.'
      };

      const createMatchResponse = await request(app)
        .post('/api/match-requests')
        .set(getAuthHeader(menteeToken))
        .send(matchRequestData);

      expectSuccessResponse(createMatchResponse, 200);

      // 12. 멘티의 outgoing 요청 조회
      const outgoingRequestsResponse = await request(app)
        .get('/api/match-requests/outgoing')
        .set(getAuthHeader(menteeToken));

      expectSuccessResponse(outgoingRequestsResponse, 200);
      expect(Array.isArray(outgoingRequestsResponse.body)).toBe(true);
      expect(outgoingRequestsResponse.body).toHaveLength(1);
      expect(outgoingRequestsResponse.body[0].status).toBe('pending');

      // 13. 멘토의 incoming 요청 조회
      const incomingRequestsResponse = await request(app)
        .get('/api/match-requests/incoming')
        .set(getAuthHeader(mentorToken));

      expectSuccessResponse(incomingRequestsResponse, 200);
      expect(Array.isArray(incomingRequestsResponse.body)).toBe(true);
      expect(incomingRequestsResponse.body).toHaveLength(1);
      
      const incomingRequest = incomingRequestsResponse.body[0];
      expect(incomingRequest.mentorId).toBe(mentorId);
      expect(incomingRequest.menteeId).toBe(menteeId);
      expect(incomingRequest.message).toBe(matchRequestData.message);
      expect(incomingRequest.status).toBe('pending');

      // 14. 멘토가 요청 수락
      const acceptResponse = await request(app)
        .put(`/api/match-requests/${incomingRequest.id}/accept`)
        .set(getAuthHeader(mentorToken));

      expectSuccessResponse(acceptResponse, 200);

      // 15. 수락 후 상태 확인 - outgoing requests
      const updatedOutgoingResponse = await request(app)
        .get('/api/match-requests/outgoing')
        .set(getAuthHeader(menteeToken));

      expectSuccessResponse(updatedOutgoingResponse, 200);
      expect(updatedOutgoingResponse.body[0].status).toBe('accepted');

      // 16. 수락 후 상태 확인 - incoming requests
      const updatedIncomingResponse = await request(app)
        .get('/api/match-requests/incoming')
        .set(getAuthHeader(mentorToken));

      expectSuccessResponse(updatedIncomingResponse, 200);
      expect(updatedIncomingResponse.body[0].status).toBe('accepted');

      // 17. 프로필 이미지 조회 테스트
      const mentorImageResponse = await request(app)
        .get(`/api/images/mentor/${mentorId}`)
        .set(getAuthHeader(mentorToken));

      // 이미지가 있거나 기본 이미지로 처리
      expect([200, 302, 404]).toContain(mentorImageResponse.status);

      const menteeImageResponse = await request(app)
        .get(`/api/images/mentee/${menteeId}`)
        .set(getAuthHeader(menteeToken));

      expect([200, 302, 404]).toContain(menteeImageResponse.status);

      console.log('✅ 전체 통합 테스트 완료: 회원가입 → 로그인 → 프로필 업데이트 → 멘토 검색 → 매칭 요청 → 수락');
    }, 30000); // 30초 타임아웃

    it('should handle multiple mentees requesting same mentor', async () => {
      // 멘토 1명, 멘티 2명 생성
      const mentor = await createTestMentor({
        email: 'popular-mentor@test.com',
        name: 'Popular Mentor',
        skills: ['JavaScript', 'React']
      });

      const mentee1 = await createTestMentee({
        email: 'mentee1@test.com',
        name: 'First Mentee'
      });

      const mentee2 = await createTestMentee({
        email: 'mentee2@test.com',
        name: 'Second Mentee'
      });

      const mentorToken = generateToken(mentor);
      const mentee1Token = generateToken(mentee1);
      const mentee2Token = generateToken(mentee2);

      // 첫 번째 멘티가 요청
      const request1Response = await request(app)
        .post('/api/match-requests')
        .set(getAuthHeader(mentee1Token))
        .send({
          mentorId: mentor.id,
          menteeId: mentee1.id,
          message: 'First request'
        });

      expectSuccessResponse(request1Response, 200);

      // 두 번째 멘티가 같은 멘토에게 요청
      const request2Response = await request(app)
        .post('/api/match-requests')
        .set(getAuthHeader(mentee2Token))
        .send({
          mentorId: mentor.id,
          menteeId: mentee2.id,
          message: 'Second request'
        });

      expectSuccessResponse(request2Response, 200);

      // 멘토가 들어온 요청 확인 (2개여야 함)
      const incomingResponse = await request(app)
        .get('/api/match-requests/incoming')
        .set(getAuthHeader(mentorToken));

      expectSuccessResponse(incomingResponse, 200);
      expect(incomingResponse.body).toHaveLength(2);

      // 첫 번째 요청 수락
      const firstRequestId = incomingResponse.body[0].id;
      const acceptResponse = await request(app)
        .put(`/api/match-requests/${firstRequestId}/accept`)
        .set(getAuthHeader(mentorToken));

      expectSuccessResponse(acceptResponse, 200);

      // 수락 후 다시 확인 - 하나는 accepted, 하나는 rejected
      const updatedIncomingResponse = await request(app)
        .get('/api/match-requests/incoming')
        .set(getAuthHeader(mentorToken));

      expectSuccessResponse(updatedIncomingResponse, 200);
      
      const statuses = updatedIncomingResponse.body.map((req: any) => req.status);
      expect(statuses).toContain('accepted');
      expect(statuses).toContain('rejected');

      console.log('✅ 다중 요청 처리 테스트 완료: 한 멘토에게 여러 요청 → 하나 수락 시 나머지 자동 거절');
    }, 20000);

    it('should prevent mentee from sending multiple pending requests', async () => {
      const mentor1 = await createTestMentor({
        email: 'mentor1@test.com',
        name: 'First Mentor'
      });

      const mentor2 = await createTestMentor({
        email: 'mentor2@test.com',
        name: 'Second Mentor'
      });

      const mentee = await createTestMentee({
        email: 'greedy-mentee@test.com',
        name: 'Greedy Mentee'
      });

      const menteeToken = generateToken(mentee);

      // 첫 번째 멘토에게 요청
      const request1Response = await request(app)
        .post('/api/match-requests')
        .set(getAuthHeader(menteeToken))
        .send({
          mentorId: mentor1.id,
          menteeId: mentee.id,
          message: 'First request'
        });

      expectSuccessResponse(request1Response, 200);

      // 두 번째 멘토에게 요청 (실패해야 함)
      const request2Response = await request(app)
        .post('/api/match-requests')
        .set(getAuthHeader(menteeToken))
        .send({
          mentorId: mentor2.id,
          menteeId: mentee.id,
          message: 'Second request'
        });

      expect(request2Response.status).toBe(400);
      expect(request2Response.body).toHaveProperty('error');

      console.log('✅ 중복 요청 방지 테스트 완료: 멘티는 하나의 pending 요청만 가능');
    }, 15000);
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle database constraints properly', async () => {
      const mentor = await createTestMentor();
      const mentee = await createTestMentee();
      const menteeToken = generateToken(mentee);

      // 첫 번째 요청 생성
      const request1Response = await request(app)
        .post('/api/match-requests')
        .set(getAuthHeader(menteeToken))
        .send({
          mentorId: mentor.id,
          menteeId: mentee.id,
          message: 'First request'
        });

      expectSuccessResponse(request1Response, 200);

      // 동일한 요청 다시 시도 (실패해야 함)
      const request2Response = await request(app)
        .post('/api/match-requests')
        .set(getAuthHeader(menteeToken))
        .send({
          mentorId: mentor.id,
          menteeId: mentee.id,
          message: 'Duplicate request'
        });

      expect(request2Response.status).toBe(400);
      expect(request2Response.body).toHaveProperty('error');

      console.log('✅ 데이터베이스 제약조건 테스트 완료: 중복 요청 방지');
    });

    it('should handle concurrent requests properly', async () => {
      const mentor = await createTestMentor();
      const mentee1 = await createTestMentee({ email: 'mentee1@test.com' });
      const mentee2 = await createTestMentee({ email: 'mentee2@test.com' });
      const mentee3 = await createTestMentee({ email: 'mentee3@test.com' });

      const mentee1Token = generateToken(mentee1);
      const mentee2Token = generateToken(mentee2);
      const mentee3Token = generateToken(mentee3);

      // 동시에 여러 요청 생성
      const requests = await Promise.allSettled([
        request(app)
          .post('/api/match-requests')
          .set(getAuthHeader(mentee1Token))
          .send({
            mentorId: mentor.id,
            menteeId: mentee1.id,
            message: 'Request 1'
          }),
        request(app)
          .post('/api/match-requests')
          .set(getAuthHeader(mentee2Token))
          .send({
            mentorId: mentor.id,
            menteeId: mentee2.id,
            message: 'Request 2'
          }),
        request(app)
          .post('/api/match-requests')
          .set(getAuthHeader(mentee3Token))
          .send({
            mentorId: mentor.id,
            menteeId: mentee3.id,
            message: 'Request 3'
          })
      ]);

      // 모든 요청이 성공했는지 확인
      const successfulRequests = requests.filter(
        result => result.status === 'fulfilled' && 
        (result.value as any).status === 200
      );

      expect(successfulRequests.length).toBe(3);

      console.log('✅ 동시성 테스트 완료: 여러 멘티가 동시에 같은 멘토에게 요청 가능');
    });
  });
});
