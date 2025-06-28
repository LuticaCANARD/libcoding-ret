import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireRole } from '../middleware/auth';
import { matchRequestValidation, handleValidationErrors } from '../middleware/validation';

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/match-requests
router.post('/match-requests', authenticateToken, requireRole('mentee'), matchRequestValidation, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const { mentorId, message } = req.body;
    const menteeId = parseInt(req.user!.sub);

    // Validate mentor exists and is a mentor
    const mentor = await prisma.user.findUnique({
      where: { id: mentorId },
      select: { role: true }
    });

    if (!mentor || mentor.role !== 'mentor') {
      return res.status(400).json({
        error: 'Invalid mentor',
        details: 'Mentor not found or user is not a mentor'
      });
    }

    // Check if mentee already has a pending request to any mentor
    const existingRequest = await prisma.matchRequest.findFirst({
      where: {
        menteeId: menteeId,
        status: 'pending'
      }
    });

    if (existingRequest) {
      return res.status(400).json({
        error: 'Request already exists',
        details: 'You already have a pending request. Please wait for a response or cancel it first.'
      });
    }

    // Create match request
    const matchRequest = await prisma.matchRequest.create({
      data: {
        mentorId,
        menteeId,
        message,
        status: 'pending'
      }
    });

    res.json({
      id: matchRequest.id,
      mentorId: matchRequest.mentorId,
      menteeId: matchRequest.menteeId,
      message: matchRequest.message,
      status: matchRequest.status
    });
  } catch (error) {
    console.error('Create match request error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: 'Failed to create match request'
    });
  }
});

// GET /api/match-requests/incoming
router.get('/match-requests/incoming', authenticateToken, requireRole('mentor'), async (req: Request, res: Response) => {
  try {
    const mentorId = parseInt(req.user!.sub);

    const requests = await prisma.matchRequest.findMany({
      where: { mentorId },
      include: {
        mentee: {
          select: {
            id: true,
            name: true,
            email: true,
            bio: true,
            image: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const response = requests.map((request: any) => ({
      id: request.id,
      mentorId: request.mentorId,
      menteeId: request.menteeId,
      message: request.message,
      status: request.status,
      mentee: {
        name: request.mentee.name,
        email: request.mentee.email,
        bio: request.mentee.bio || '',
        imageUrl: request.mentee.image ? `/api/images/mentee/${request.mentee.id}` : 
                  (process.env.MENTEE_PLACEHOLDER_IMAGE_LINK || 'https://placehold.co/500x500.jpg?text=MENTEE')
      }
    }));

    res.json(response);
  } catch (error) {
    console.error('Get incoming requests error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: 'Failed to get incoming requests'
    });
  }
});

// GET /api/match-requests/outgoing
router.get('/match-requests/outgoing', authenticateToken, requireRole('mentee'), async (req: Request, res: Response) => {
  try {
    const menteeId = parseInt(req.user!.sub);

    const requests = await prisma.matchRequest.findMany({
      where: { menteeId },
      include: {
        mentor: {
          select: {
            id: true,
            name: true,
            email: true,
            bio: true,
            skills: true,
            image: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const response = requests.map((request: any) => ({
      id: request.id,
      mentorId: request.mentorId,
      menteeId: request.menteeId,
      status: request.status,
      mentor: {
        name: request.mentor.name,
        email: request.mentor.email,
        bio: request.mentor.bio || '',
        skills: request.mentor.skills ? JSON.parse(request.mentor.skills) : [],
        imageUrl: request.mentor.image ? `/api/images/mentor/${request.mentor.id}` : 
                  (process.env.MENTOR_PLACEHOLDER_IMAGE_LINK || 'https://placehold.co/500x500.jpg?text=MENTOR')
      }
    }));

    res.json(response);
  } catch (error) {
    console.error('Get outgoing requests error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: 'Failed to get outgoing requests'
    });
  }
});

// PUT /api/match-requests/:id/accept
router.put('/match-requests/:id/accept', authenticateToken, requireRole('mentor'), async (req: Request, res: Response) => {
  try {
    const requestId = parseInt(req.params.id);
    const mentorId = parseInt(req.user!.sub);

    // Find the request
    const matchRequest = await prisma.matchRequest.findUnique({
      where: { id: requestId }
    });

    if (!matchRequest) {
      return res.status(404).json({
        error: 'Request not found'
      });
    }

    if (matchRequest.mentorId !== mentorId) {
      return res.status(403).json({
        error: 'Forbidden',
        details: 'You can only accept requests sent to you'
      });
    }

    if (matchRequest.status !== 'pending') {
      return res.status(400).json({
        error: 'Invalid request status',
        details: 'Request has already been processed'
      });
    }

    // Check if mentor already has an accepted request
    const existingAccepted = await prisma.matchRequest.findFirst({
      where: {
        mentorId: mentorId,
        status: 'accepted'
      }
    });

    if (existingAccepted) {
      return res.status(400).json({
        error: 'Already matched',
        details: 'You already have an accepted match request'
      });
    }

    // Accept this request and reject all other pending requests to this mentor
    await prisma.$transaction(async (tx: any) => {
      // Accept the current request
      await tx.matchRequest.update({
        where: { id: requestId },
        data: { status: 'accepted' }
      });

      // Reject all other pending requests to this mentor
      await tx.matchRequest.updateMany({
        where: {
          mentorId: mentorId,
          status: 'pending',
          id: { not: requestId }
        },
        data: { status: 'rejected' }
      });
    });

    const updatedRequest = await prisma.matchRequest.findUnique({
      where: { id: requestId }
    });

    res.json({
      id: updatedRequest!.id,
      mentorId: updatedRequest!.mentorId,
      menteeId: updatedRequest!.menteeId,
      message: updatedRequest!.message,
      status: updatedRequest!.status
    });
  } catch (error) {
    console.error('Accept request error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: 'Failed to accept request'
    });
  }
});

// PUT /api/match-requests/:id/reject
router.put('/match-requests/:id/reject', authenticateToken, requireRole('mentor'), async (req: Request, res: Response) => {
  try {
    const requestId = parseInt(req.params.id);
    const mentorId = parseInt(req.user!.sub);

    // Find the request
    const matchRequest = await prisma.matchRequest.findUnique({
      where: { id: requestId }
    });

    if (!matchRequest) {
      return res.status(404).json({
        error: 'Request not found'
      });
    }

    if (matchRequest.mentorId !== mentorId) {
      return res.status(403).json({
        error: 'Forbidden',
        details: 'You can only reject requests sent to you'
      });
    }

    if (matchRequest.status !== 'pending') {
      return res.status(400).json({
        error: 'Invalid request status',
        details: 'Request has already been processed'
      });
    }

    // Reject the request
    const updatedRequest = await prisma.matchRequest.update({
      where: { id: requestId },
      data: { status: 'rejected' }
    });

    res.json({
      id: updatedRequest.id,
      mentorId: updatedRequest.mentorId,
      menteeId: updatedRequest.menteeId,
      message: updatedRequest.message,
      status: updatedRequest.status
    });
  } catch (error) {
    console.error('Reject request error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: 'Failed to reject request'
    });
  }
});

// DELETE /api/match-requests/:id
router.delete('/match-requests/:id', authenticateToken, requireRole('mentee'), async (req: Request, res: Response) => {
  try {
    const requestId = parseInt(req.params.id);
    const menteeId = parseInt(req.user!.sub);

    // Find the request
    const matchRequest = await prisma.matchRequest.findUnique({
      where: { id: requestId }
    });

    if (!matchRequest) {
      return res.status(404).json({
        error: 'Request not found'
      });
    }

    if (matchRequest.menteeId !== menteeId) {
      return res.status(403).json({
        error: 'Forbidden',
        details: 'You can only cancel your own requests'
      });
    }

    if (matchRequest.status === 'accepted') {
      return res.status(400).json({
        error: 'Cannot cancel accepted request',
        details: 'This request has already been accepted and cannot be cancelled'
      });
    }

    // Cancel/delete the request
    const deletedRequest = await prisma.matchRequest.update({
      where: { id: requestId },
      data: { status: 'cancelled' }
    });

    res.json({
      id: deletedRequest.id,
      mentorId: deletedRequest.mentorId,
      menteeId: deletedRequest.menteeId,
      message: deletedRequest.message,
      status: deletedRequest.status
    });
  } catch (error) {
    console.error('Cancel request error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: 'Failed to cancel request'
    });
  }
});

export default router;
