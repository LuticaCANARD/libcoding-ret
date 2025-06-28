import { apiRequest } from './auth';
import type { User } from './auth';

// Mentor interface
export interface Mentor {
  id: number;
  name: string;
  email: string;
  expertise: string[];
  skillLevel: string;
  bio?: string;
  profileImageUrl?: string;
  rating?: number;
  createdAt: string;
  updatedAt: string;
}

// Match interface
export interface Match {
  id: number;
  mentorId: number;
  menteeId: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED';
  message?: string;
  createdAt: string;
  updatedAt: string;
  mentor?: Mentor;
  mentee?: User;
}

// User API
export async function getUserProfile(userId: number): Promise<User> {
  const response = await apiRequest(`/users/${userId}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get user profile');
  }
  
  return response.json();
}

export async function updateUserProfile(userId: number, userData: Partial<User>): Promise<User> {
  const response = await apiRequest(`/profile`, {
    method: 'PUT',
    body: JSON.stringify(userData)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update profile');
  }
  
  return response.json();
}

// Mentor API
export async function getMentors(filters?: {
  expertise?: string[];
  skillLevel?: string;
  search?: string;
}): Promise<Mentor[]> {
  let url = '/mentors';
  
  if (filters) {
    const params = new URLSearchParams();
    
    if (filters.expertise && filters.expertise.length > 0) {
      params.append('expertise', filters.expertise.join(','));
    }
    
    if (filters.skillLevel) {
      params.append('skillLevel', filters.skillLevel);
    }
    
    if (filters.search) {
      params.append('search', filters.search);
    }
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
  }
  
  const response = await apiRequest(url);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get mentors');
  }
  
  return response.json();
}

export async function getMentor(mentorId: number): Promise<Mentor> {
  const response = await apiRequest(`/mentors/${mentorId}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get mentor');
  }
  
  return response.json();
}

// Match API
export async function createMatchRequest(mentorId: number, message?: string): Promise<Match> {
  const response = await apiRequest('/matches', {
    method: 'POST',
    body: JSON.stringify({ mentorId, message })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create match request');
  }
  
  return response.json();
}

export async function getUserMatches(): Promise<Match[]> {
  const response = await apiRequest('/match-requests/outgoing');
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get matches');
  }
  
  return response.json();
}

export async function updateMatchStatus(matchId: number, status: 'ACCEPTED' | 'REJECTED'): Promise<Match> {
  const response = await apiRequest(`/matches/${matchId}`, {
    method: 'PUT',
    body: JSON.stringify({ status })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update match status');
  }
  
  return response.json();
}
