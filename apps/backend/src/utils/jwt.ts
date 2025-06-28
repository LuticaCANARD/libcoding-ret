import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_ISSUER = 'mentor-mentee-matching';
const JWT_AUDIENCE = 'mentor-mentee-users';

export interface JWTPayload {
  // RFC 7519 standard claims
  iss: string;     // Issuer
  sub: string;     // Subject (user ID)
  aud: string;     // Audience
  exp: number;     // Expiration time
  nbf: number;     // Not before
  iat: number;     // Issued at
  jti: string;     // JWT ID

  // Custom claims
  id: number;
  name: string;
  email: string;
  role: 'mentor' | 'mentee';
  profileImageUrl?: string;
  expertise?: string[];
  skillLevel?: string;
  bio?: string;
  createdAt: string;
  updatedAt: string;
}

export function generateToken(user: { 
  id: number; 
  name: string; 
  email: string; 
  role: string;
  bio?: string | null;
  skills?: string | null;
  image?: Buffer | null;
  createdAt: Date;
  updatedAt: Date;
}): string {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + (60 * 60); // 1 hour expiration

  const payload: JWTPayload = {
    // RFC 7519 standard claims
    iss: JWT_ISSUER,
    sub: user.id.toString(),
    aud: JWT_AUDIENCE,
    exp: exp,
    nbf: now,
    iat: now,
    jti: uuidv4(),

    // Custom claims matching client User interface
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as 'mentor' | 'mentee',
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

  return jwt.sign(payload, JWT_SECRET);
}

export function verifyToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    
    // Validate required claims
    if (!decoded.iss || !decoded.sub || !decoded.aud || !decoded.exp || 
        !decoded.nbf || !decoded.iat || !decoded.jti || !decoded.name || 
        !decoded.email || !decoded.role || !decoded.id) {
      throw new Error('Invalid token: missing required claims');
    }

    // Validate issuer and audience
    if (decoded.iss !== JWT_ISSUER || decoded.aud !== JWT_AUDIENCE) {
      throw new Error('Invalid token: incorrect issuer or audience');
    }

    return decoded;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

export function extractTokenFromHeader(authHeader: string | undefined): string {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Authorization header missing or invalid');
  }
  return authHeader.substring(7);
}
