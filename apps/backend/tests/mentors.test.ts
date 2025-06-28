import request from 'supertest';
import { createApp } from '../src/app';
import { TestHelper } from './test-helper';

const app = createApp();

describe('Mentor API', () => {
  let menteeUser: any;
  let mentorUser: any;
  let menteeTokens: any;
  let mentorTokens: any;

  beforeEach(async () => {
    await TestHelper.cleanupUsers();
    
    // Create a mentee user
    menteeUser = await TestHelper.createMentee({
      email: 'mentee@example.com',
      password: 'password123',
      name: 'Test Mentee'
    });
    menteeTokens = TestHelper.generateAuthTokens(menteeUser);

    // Create a mentor user
    mentorUser = await TestHelper.createMentor({
      email: 'mentor@example.com',
      password: 'password123',
      name: 'Test Mentor'
    });
    mentorTokens = TestHelper.generateAuthTokens(mentorUser);
  });

  describe('GET /api/mentors', () => {
    beforeEach(async () => {
      // Create additional mentors for testing
      await TestHelper.createMentor({
        email: 'mentor2@example.com',
        name: 'Mentor Two',
        skills: JSON.stringify(['Python', 'Django'])
      });
      await TestHelper.createMentor({
        email: 'mentor3@example.com',
        name: 'Mentor Three',
        skills: JSON.stringify(['Java', 'Spring'])
      });
    });

    it('should get list of mentors successfully', async () => {
      const response = await request(app)
        .get('/api/mentors')
        .set(TestHelper.getAuthHeader(menteeTokens.accessToken))
        .expect(200);

      expect(response.body).toHaveProperty('mentors');
      expect(Array.isArray(response.body.mentors)).toBe(true);
      expect(response.body.mentors.length).toBeGreaterThan(0);
      
      // Check that all returned users are mentors
      response.body.mentors.forEach((mentor: any) => {
        expect(mentor.role).toBe('mentor');
        expect(mentor).not.toHaveProperty('password');
      });
    });

    it('should filter mentors by skills', async () => {
      const response = await request(app)
        .get('/api/mentors?skills=JavaScript')
        .set(TestHelper.getAuthHeader(menteeTokens.accessToken))
        .expect(200);

      expect(response.body).toHaveProperty('mentors');
      expect(Array.isArray(response.body.mentors)).toBe(true);
      
      // Should find mentors with JavaScript skills
      const mentorsWithJS = response.body.mentors.filter((mentor: any) => {
        const skills = mentor.skills ? JSON.parse(mentor.skills) : [];
        return skills.includes('JavaScript');
      });
      expect(mentorsWithJS.length).toBeGreaterThan(0);
    });

    it('should paginate mentors list', async () => {
      const response = await request(app)
        .get('/api/mentors?page=1&limit=2')
        .set(TestHelper.getAuthHeader(menteeTokens.accessToken))
        .expect(200);

      expect(response.body).toHaveProperty('mentors');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.mentors.length).toBeLessThanOrEqual(2);
      expect(response.body.pagination).toHaveProperty('page');
      expect(response.body.pagination).toHaveProperty('limit');
      expect(response.body.pagination).toHaveProperty('total');
    });

    it('should reject request without authentication', async () => {
      const response = await request(app)
        .get('/api/mentors')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle empty results gracefully', async () => {
      const response = await request(app)
        .get('/api/mentors?skills=NonExistentSkill')
        .set(TestHelper.getAuthHeader(menteeTokens.accessToken))
        .expect(200);

      expect(response.body).toHaveProperty('mentors');
      expect(Array.isArray(response.body.mentors)).toBe(true);
      expect(response.body.mentors.length).toBe(0);
    });
  });

  describe('GET /api/mentors/:id', () => {
    it('should get specific mentor successfully', async () => {
      const response = await request(app)
        .get(`/api/mentors/${mentorUser.id}`)
        .set(TestHelper.getAuthHeader(menteeTokens.accessToken))
        .expect(200);

      expect(response.body).toHaveProperty('mentor');
      expect(response.body.mentor.id).toBe(mentorUser.id);
      expect(response.body.mentor.name).toBe(mentorUser.name);
      expect(response.body.mentor.role).toBe('mentor');
      expect(response.body.mentor).not.toHaveProperty('password');
    });

    it('should reject request without authentication', async () => {
      const response = await request(app)
        .get(`/api/mentors/${mentorUser.id}`)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 404 for non-existent mentor', async () => {
      const response = await request(app)
        .get('/api/mentors/99999')
        .set(TestHelper.getAuthHeader(menteeTokens.accessToken))
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.details).toContain('not found');
    });

    it('should return 404 when trying to get a mentee as mentor', async () => {
      const response = await request(app)
        .get(`/api/mentors/${menteeUser.id}`)
        .set(TestHelper.getAuthHeader(menteeTokens.accessToken))
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.details).toContain('not found');
    });

    it('should reject invalid mentor ID format', async () => {
      const response = await request(app)
        .get('/api/mentors/invalid-id')
        .set(TestHelper.getAuthHeader(menteeTokens.accessToken))
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Role-based access', () => {
    it('should allow mentees to access mentor endpoints', async () => {
      const response = await request(app)
        .get('/api/mentors')
        .set(TestHelper.getAuthHeader(menteeTokens.accessToken))
        .expect(200);

      expect(response.body).toHaveProperty('mentors');
    });

    it('should allow mentors to access mentor endpoints', async () => {
      const response = await request(app)
        .get('/api/mentors')
        .set(TestHelper.getAuthHeader(mentorTokens.accessToken))
        .expect(200);

      expect(response.body).toHaveProperty('mentors');
    });

    it('should allow mentors to view their own profile via mentor endpoint', async () => {
      const response = await request(app)
        .get(`/api/mentors/${mentorUser.id}`)
        .set(TestHelper.getAuthHeader(mentorTokens.accessToken))
        .expect(200);

      expect(response.body.mentor.id).toBe(mentorUser.id);
    });
  });

  describe('Search and filtering', () => {
    beforeEach(async () => {
      // Create mentors with specific skills for testing
      await TestHelper.createMentor({
        email: 'react-mentor@example.com',
        name: 'React Expert',
        bio: 'Frontend development specialist',
        skills: JSON.stringify(['React', 'JavaScript', 'TypeScript'])
      });
      
      await TestHelper.createMentor({
        email: 'backend-mentor@example.com',
        name: 'Backend Master',
        bio: 'Backend development expert',
        skills: JSON.stringify(['Node.js', 'Python', 'PostgreSQL'])
      });
    });

    it('should search mentors by name', async () => {
      const response = await request(app)
        .get('/api/mentors?search=React')
        .set(TestHelper.getAuthHeader(menteeTokens.accessToken))
        .expect(200);

      expect(response.body.mentors.length).toBeGreaterThan(0);
      const found = response.body.mentors.some((mentor: any) => 
        mentor.name.includes('React')
      );
      expect(found).toBe(true);
    });

    it('should search mentors by bio', async () => {
      const response = await request(app)
        .get('/api/mentors?search=Frontend')
        .set(TestHelper.getAuthHeader(menteeTokens.accessToken))
        .expect(200);

      expect(response.body.mentors.length).toBeGreaterThan(0);
      const found = response.body.mentors.some((mentor: any) => 
        mentor.bio && mentor.bio.includes('Frontend')
      );
      expect(found).toBe(true);
    });

    it('should filter by multiple skills', async () => {
      const response = await request(app)
        .get('/api/mentors?skills=React,TypeScript')
        .set(TestHelper.getAuthHeader(menteeTokens.accessToken))
        .expect(200);

      expect(response.body.mentors.length).toBeGreaterThan(0);
      const mentorWithBothSkills = response.body.mentors.find((mentor: any) => {
        if (!mentor.skills) return false;
        const skills = JSON.parse(mentor.skills);
        return skills.includes('React') && skills.includes('TypeScript');
      });
      expect(mentorWithBothSkills).toBeDefined();
    });
  });
});
