import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import { profileValidation, handleValidationErrors } from '../middleware/validation';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/me
router.get('/me', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.user!.sub);
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        bio: true,
        skills: true,
        image: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Format response to match client User interface
    const response = {
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
    };

    res.json(response);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: 'Failed to get user information'
    });
  }
});

// PUT /api/profile
router.put('/profile', authenticateToken, profileValidation, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.user!.sub);
    const { name, bio, skills, image } = req.body;

    // Validate image if provided
    let imageBuffer: Buffer | undefined;
    if (image) {
      try {
        imageBuffer = Buffer.from(image, 'base64');
        
        // Validate image size (max 1MB)
        if (imageBuffer.length > 1024 * 1024) {
          return res.status(400).json({
            error: 'Image too large',
            details: 'Image must be less than 1MB'
          });
        }
      } catch (error) {
        return res.status(400).json({
          error: 'Invalid image',
          details: 'Image must be a valid base64 string'
        });
      }
    }

    // Update user
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (skills !== undefined && req.user!.role === 'mentor') {
      updateData.skills = JSON.stringify(skills);
    }
    if (imageBuffer) updateData.image = imageBuffer;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        bio: true,
        skills: true,
        image: true
      }
    });

    // Format response
    const baseProfile = {
      name: updatedUser.name,
      bio: updatedUser.bio || '',
      imageUrl: updatedUser.image ? `/api/images/${updatedUser.role}/${updatedUser.id}` : 
                (updatedUser.role === 'mentor' ? 
                 process.env.MENTOR_PLACEHOLDER_IMAGE_LINK || 'https://placehold.co/500x500.jpg?text=MENTOR' :
                 process.env.MENTEE_PLACEHOLDER_IMAGE_LINK || 'https://placehold.co/500x500.jpg?text=MENTEE')
    };

    const response = {
      id: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
      profile: updatedUser.role === 'mentor' ? {
        ...baseProfile,
        skills: updatedUser.skills ? JSON.parse(updatedUser.skills) : []
      } : baseProfile
    };

    res.json(response);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: 'Failed to update profile'
    });
  }
});

// GET /api/images/:role/:id
router.get('/images/:role/:id', async (req: Request, res: Response) => {
  try {
    const { role, id } = req.params;
    const userId = parseInt(id);

    if (!['mentor', 'mentee'].includes(role)) {
      return res.status(400).json({
        error: 'Invalid role',
        details: 'Role must be mentor or mentee'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { image: true, role: true }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    if (user.role !== role) {
      return res.status(400).json({
        error: 'Role mismatch',
        details: 'User role does not match requested role'
      });
    }

    if (!user.image) {
      // Redirect to placeholder image
      const placeholderUrl = role === 'mentor' ? 
        (process.env.MENTOR_PLACEHOLDER_IMAGE_LINK || 'https://placehold.co/500x500.jpg?text=MENTOR') :
        (process.env.MENTEE_PLACEHOLDER_IMAGE_LINK || 'https://placehold.co/500x500.jpg?text=MENTEE');
      return res.redirect(placeholderUrl);
    }

    // Set appropriate content type and return image
    res.set('Content-Type', 'image/jpeg');
    res.send(user.image);
  } catch (error) {
    console.error('Get image error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: 'Failed to get image'
    });
  }
});

export default router;
