import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from './setup';

// JWT 토큰 생성 헬퍼
export function generateToken(user: any) {
  const payload = {
    iss: 'mentor-mentee-app',
    sub: user.id.toString(),
    aud: 'mentor-mentee-users',
    exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1시간
    nbf: Math.floor(Date.now() / 1000),
    iat: Math.floor(Date.now() / 1000),
    jti: `jwt-${Date.now()}`,
    name: user.name,
    email: user.email,
    role: user.role
  };

  return jwt.sign(payload, process.env.JWT_SECRET || 'test-secret');
}

// 테스트용 사용자 생성 헬퍼
export async function createTestUser(userData: {
  email: string;
  password: string;
  name: string;
  role: string;
  bio?: string;
  skills?: string[];
}) {
  const hashedPassword = await bcrypt.hash(userData.password, 10);
  
  const user = await prisma.user.create({
    data: {
      email: userData.email,
      password: hashedPassword,
      name: userData.name,
      role: userData.role,
      bio: userData.bio || '',
      skills: userData.skills ? JSON.stringify(userData.skills) : null
    }
  });

  return user;
}

// 테스트용 멘토 생성 헬퍼
export async function createTestMentor(overrides: Partial<{
  email: string;
  password: string;
  name: string;
  bio: string;
  skills: string[];
}> = {}) {
  return createTestUser({
    email: overrides.email || 'mentor@test.com',
    password: overrides.password || 'password123',
    name: overrides.name || 'Test Mentor',
    role: 'mentor',
    bio: overrides.bio || 'Experienced mentor',
    skills: overrides.skills || ['React', 'Node.js']
  });
}

// 테스트용 멘티 생성 헬퍼
export async function createTestMentee(overrides: Partial<{
  email: string;
  password: string;
  name: string;
  bio: string;
}> = {}) {
  return createTestUser({
    email: overrides.email || 'mentee@test.com',
    password: overrides.password || 'password123',
    name: overrides.name || 'Test Mentee',
    role: 'mentee',
    bio: overrides.bio || 'Eager to learn'
  });
}

// 테스트용 매칭 요청 생성 헬퍼
export async function createTestMatchRequest(
  mentorId: number,
  menteeId: number,
  message: string = 'Test matching request',
  status: string = 'pending'
) {
  return prisma.matchRequest.create({
    data: {
      mentorId,
      menteeId,
      message,
      status
    }
  });
}

// Base64 이미지 문자열 생성 헬퍼 (테스트용)
export function generateTestImageBase64(): string {
  // 작은 1x1 PNG 이미지 (base64)
  return 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
}

// 인증 헤더 생성 헬퍼
export function getAuthHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

// API 응답 검증 헬퍼
export function expectValidationError(response: any, field?: string) {
  expect(response.status).toBe(400);
  expect(response.body).toHaveProperty('error');
  if (field) {
    expect(response.body.error.toLowerCase()).toContain(field.toLowerCase());
  }
}

export function expectUnauthorizedError(response: any) {
  expect(response.status).toBe(401);
  expect(response.body).toHaveProperty('error');
}

export function expectNotFoundError(response: any) {
  expect(response.status).toBe(404);
  expect(response.body).toHaveProperty('error');
}

export function expectSuccessResponse(response: any, expectedStatus: number = 200) {
  expect(response.status).toBe(expectedStatus);
  expect(response.body).toBeDefined();
}
