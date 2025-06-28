import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from './setup';
import { 
  createTestMentor, 
  createTestMentee, 
  generateToken, 
  getAuthHeader,
  expectUnauthorizedError, 
  expectSuccessResponse 
} from './helpers';

describe('Mentors API', () => {
  let app: any;

  beforeAll(() => {
    app = createApp();
  });

  describe('GET /api/mentors', () => {
    let mentee: any;
    let token: string;
    let mentors: any[];

    beforeEach(async () => {
      // 테스트용 멘티 생성
      mentee = await createTestMentee();
      token = generateToken(mentee);

      // 테스트용 멘토들 생성
      mentors = await Promise.all([
        createTestMentor({
          email: 'mentor1@test.com',
          name: 'Alice Mentor',
          bio: 'Frontend specialist',
          skills: ['React', 'JavaScript', 'CSS']
        }),
        createTestMentor({
          email: 'mentor2@test.com',
          name: 'Bob Mentor',
          bio: 'Backend expert',
          skills: ['Node.js', 'Python', 'Docker']
        }),
        createTestMentor({
          email: 'mentor3@test.com',
          name: 'Charlie Mentor',
          bio: 'Full stack developer',
          skills: ['React', 'Node.js', 'TypeScript']
        })
      ]);
    });

    it('should get all mentors successfully', async () => {
      const response = await request(app)
        .get('/api/mentors')
        .set(getAuthHeader(token));

      expectSuccessResponse(response, 200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(3);

      // 첫 번째 멘토 구조 확인
      const mentor = response.body[0];
      expect(mentor).toHaveProperty('id');
      expect(mentor).toHaveProperty('email');
      expect(mentor).toHaveProperty('role', 'mentor');
      expect(mentor).toHaveProperty('profile');
      expect(mentor.profile).toHaveProperty('name');
      expect(mentor.profile).toHaveProperty('bio');
      expect(mentor.profile).toHaveProperty('skills');
      expect(mentor.profile).toHaveProperty('imageUrl');
      expect(Array.isArray(mentor.profile.skills)).toBe(true);
    });

    it('should filter mentors by skill', async () => {
      const response = await request(app)
        .get('/api/mentors?skill=React')
        .set(getAuthHeader(token));

      expectSuccessResponse(response, 200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2); // Alice와 Charlie가 React 스킬 보유

      response.body.forEach((mentor: any) => {
        expect(mentor.profile.skills).toContain('React');
      });
    });

    it('should filter mentors by specific skill case-insensitive', async () => {
      const response = await request(app)
        .get('/api/mentors?skill=javascript')
        .set(getAuthHeader(token));

      expectSuccessResponse(response, 200);
      expect(response.body.length).toBeGreaterThan(0);
      
      response.body.forEach((mentor: any) => {
        const skills = mentor.profile.skills.map((skill: string) => skill.toLowerCase());
        expect(skills).toContain('javascript');
      });
    });

    it('should return empty array for non-existent skill', async () => {
      const response = await request(app)
        .get('/api/mentors?skill=NonExistentSkill')
        .set(getAuthHeader(token));

      expectSuccessResponse(response, 200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(0);
    });

    it('should sort mentors by name in ascending order', async () => {
      const response = await request(app)
        .get('/api/mentors?orderBy=name')
        .set(getAuthHeader(token));

      expectSuccessResponse(response, 200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(3);

      const names = response.body.map((mentor: any) => mentor.profile.name);
      expect(names).toEqual(['Alice Mentor', 'Bob Mentor', 'Charlie Mentor']);
    });

    it('should sort mentors by skill in ascending order', async () => {
      const response = await request(app)
        .get('/api/mentors?orderBy=skill')
        .set(getAuthHeader(token));

      expectSuccessResponse(response, 200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(3);

      // 첫 번째 스킬로 정렬되었는지 확인
      const firstSkills = response.body.map((mentor: any) => 
        mentor.profile.skills[0]?.toLowerCase() || ''
      );
      
      // 정렬되어 있는지 확인
      for (let i = 0; i < firstSkills.length - 1; i++) {
        expect(firstSkills[i] <= firstSkills[i + 1]).toBe(true);
      }
    });

    it('should combine skill filter and sorting', async () => {
      const response = await request(app)
        .get('/api/mentors?skill=Node.js&orderBy=name')
        .set(getAuthHeader(token));

      expectSuccessResponse(response, 200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      // 모든 멘토가 Node.js 스킬을 가지고 있는지 확인
      response.body.forEach((mentor: any) => {
        expect(mentor.profile.skills).toContain('Node.js');
      });

      // 이름순으로 정렬되어 있는지 확인
      const names = response.body.map((mentor: any) => mentor.profile.name);
      const sortedNames = [...names].sort();
      expect(names).toEqual(sortedNames);
    });

    it('should fail without authentication token', async () => {
      const response = await request(app)
        .get('/api/mentors');

      expectUnauthorizedError(response);
    });

    it('should fail when mentor tries to access mentors list', async () => {
      const mentor = await createTestMentor();
      const mentorToken = generateToken(mentor);

      const response = await request(app)
        .get('/api/mentors')
        .set(getAuthHeader(mentorToken));

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });

    it('should ignore invalid orderBy parameter', async () => {
      const response = await request(app)
        .get('/api/mentors?orderBy=invalid')
        .set(getAuthHeader(token));

      expectSuccessResponse(response, 200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(3);
    });

    it('should handle empty skill parameter', async () => {
      const response = await request(app)
        .get('/api/mentors?skill=')
        .set(getAuthHeader(token));

      expectSuccessResponse(response, 200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(3); // 모든 멘토 반환
    });

    it('should return correct image URLs for mentors', async () => {
      const response = await request(app)
        .get('/api/mentors')
        .set(getAuthHeader(token));

      expectSuccessResponse(response, 200);
      
      response.body.forEach((mentor: any) => {
        expect(mentor.profile.imageUrl).toBe(`/api/images/mentor/${mentor.id}`);
      });
    });

    it('should not include password in response', async () => {
      const response = await request(app)
        .get('/api/mentors')
        .set(getAuthHeader(token));

      expectSuccessResponse(response, 200);
      
      response.body.forEach((mentor: any) => {
        expect(mentor).not.toHaveProperty('password');
      });
    });

    it('should handle mentors with empty or null skills', async () => {
      // 스킬이 없는 멘토 생성
      await createTestMentor({
        email: 'noskills@test.com',
        name: 'No Skills Mentor',
        bio: 'Learning mentor',
        skills: []
      });

      const response = await request(app)
        .get('/api/mentors')
        .set(getAuthHeader(token));

      expectSuccessResponse(response, 200);
      expect(response.body).toHaveLength(4);

      // 스킬이 없는 멘토 찾기
      const noSkillsMentor = response.body.find((m: any) => m.profile.name === 'No Skills Mentor');
      expect(noSkillsMentor).toBeTruthy();
      expect(Array.isArray(noSkillsMentor.profile.skills)).toBe(true);
      expect(noSkillsMentor.profile.skills).toHaveLength(0);
    });
  });
});
