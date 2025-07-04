import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { generateToken } from '../utils/jwt';
import { signupValidation, loginValidation, handleValidationErrors } from '../middleware/validation';

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/signup
router.post('/signup', signupValidation, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const { email, password, name, role } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        error: 'User already exists',
        details: 'An account with this email already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role
      }
    });

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      bio: user.bio,
      skills: user.skills,
      image: user.image,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });

    // Return user info and token (without password)
    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        profileImageUrl: user.image ? `/api/images/${user.role}/${user.id}` : 
                        (user.role === 'mentor' ? 
                         'https://placehold.co/500x500.jpg?text=MENTOR' :
                         'https://placehold.co/500x500.jpg?text=MENTEE'),
        expertise: user.role === 'mentor' && user.skills ? JSON.parse(user.skills) : undefined,
        skillLevel: undefined, // Not implemented yet
        bio: user.bio || '',
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString()
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: 'Failed to create user'
    });
  }
});

// POST /api/login
router.post('/login', loginValidation, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials',
        details: 'Email or password is incorrect'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid credentials',
        details: 'Email or password is incorrect'
      });
    }

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      bio: user.bio,
      skills: user.skills,
      image: user.image,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });

    // Return user info and token
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        profileImageUrl: user.image ? `/api/images/${user.role}/${user.id}` : 
                        (user.role === 'mentor' ? 
                         'https://placehold.co/500x500.jpg?text=MENTOR' :
                         'https://placehold.co/500x500.jpg?text=MENTEE'),
        expertise: user.role === 'mentor' && user.skills ? JSON.parse(user.skills) : undefined,
        skillLevel: undefined, // Not implemented yet
        bio: user.bio || '',
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString()
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: 'Failed to authenticate user'
    });
  }
});

export default router;
