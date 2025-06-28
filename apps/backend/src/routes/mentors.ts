import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/mentors
router.get('/mentors', authenticateToken, requireRole('mentee'), async (req: Request, res: Response) => {
  try {
    const { skill, orderBy } = req.query;

    // Build where clause for filtering
    const where: any = {
      role: 'mentor'
    };

    if (skill && typeof skill === 'string') {
      where.skills = {
        contains: `"${skill}"`
      };
    }

    // Build orderBy clause
    let orderByClause: any = {};
    if (orderBy === 'name') {
      orderByClause = { name: 'asc' };
    } else if (orderBy === 'skill') {
      orderByClause = { skills: 'asc' };
    } else {
      orderByClause = { name: 'asc' }; // default
    }

    const mentors = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        bio: true,
        skills: true,
        image: true
      },
      orderBy: orderByClause
    });

    const response = mentors.map(mentor => ({
      id: mentor.id,
      email: mentor.email,
      role: mentor.role,
      profile: {
        name: mentor.name,
        bio: mentor.bio || '',
        imageUrl: mentor.image ? `/api/images/${mentor.role}/${mentor.id}` : 
                  (process.env.MENTOR_PLACEHOLDER_IMAGE_LINK || 'https://placehold.co/500x500.jpg?text=MENTOR'),
        skills: mentor.skills ? JSON.parse(mentor.skills) : []
      }
    }));

    res.json(response);
  } catch (error) {
    console.error('Get mentors error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: 'Failed to get mentors list'
    });
  }
});

export default router;
