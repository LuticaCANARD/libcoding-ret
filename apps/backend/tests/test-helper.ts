import { User, PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export interface TestUser {
  id?: number;
  email: string;
  password: string;
  name: string;
  role: 'mentor' | 'mentee';
  bio?: string;
  skills?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export class TestHelper {
  static async createTestUser(userData: Partial<TestUser> = {}): Promise<User> {
    const defaultUser: TestUser = {
      email: `test-${Date.now()}@example.com`,
      password: 'password123',
      name: 'Test User',
      role: 'mentee',
      ...userData
    };

    const hashedPassword = await bcrypt.hash(defaultUser.password, 10);

    return await prisma.user.create({
      data: {
        email: defaultUser.email,
        password: hashedPassword,
        name: defaultUser.name,
        role: defaultUser.role,
        bio: defaultUser.bio,
        skills: defaultUser.skills
      }
    });
  }

  static async createMentor(userData: Partial<TestUser> = {}): Promise<User> {
    return this.createTestUser({
      ...userData,
      role: 'mentor',
      bio: 'Experienced mentor',
      skills: JSON.stringify(['JavaScript', 'React']),
      ...userData
    });
  }

  static async createMentee(userData: Partial<TestUser> = {}): Promise<User> {
    return this.createTestUser({
      ...userData,
      role: 'mentee',
      bio: 'Aspiring developer',
      ...userData
    });
  }

  static generateAuthTokens(user: User): AuthTokens {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '1h' });
    const refreshToken = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '7d' });

    return { accessToken, refreshToken };
  }

  static getAuthHeader(token: string): Record<string, string> {
    return {
      'Authorization': `Bearer ${token}`
    };
  }

  static async cleanupUsers(): Promise<void> {
    await prisma.matchRequest.deleteMany();
    await prisma.user.deleteMany();
  }

  static async createMatchRequest(mentorId: number, menteeId: number) {
    return await prisma.matchRequest.create({
      data: {
        mentorId,
        menteeId,
        status: 'pending',
        message: 'Test match request'
      }
    });
  }
}

export { prisma as testPrisma };
