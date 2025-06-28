// API base URL
export const API_BASE_URL = 'http://localhost:8080/api';

// User types
export interface User {
  id: number;
  email: string;
  name: string;
  role: 'mentor' | 'mentee';
  profileImageUrl?: string;
  expertise?: string[];
  skillLevel?: string;
  bio?: string;
  createdAt: string;
  updatedAt: string;
}

// Token management
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export function setToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
  }
}

export function removeToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
  }
}

// JWT decode function
export function decodeJWT(token: string): any {
  try {
    const payload = token.split('.')[1];
    console.log('Decoding JWT:', payload);
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  const token = getToken();
  if (!token) return false;
  
  try {
    const decoded = decodeJWT(token);
    return decoded && decoded.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

// Get current user info from token
export function getCurrentUser(): User | null {
  const token = getToken();
  if (!token) return null;
  
  try {
    const decoded = decodeJWT(token);
    // JWT 페이로드가 이미 User 인터페이스 형식이므로 직접 반환
    console.log('Decoded JWT:', decoded);
    return {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
      profileImageUrl: decoded.profileImageUrl,
      expertise: decoded.expertise,
      skillLevel: decoded.skillLevel,
      bio: decoded.bio,
      createdAt: decoded.createdAt,
      updatedAt: decoded.updatedAt
    };
  } catch {
    return null;
  }
}

// API request helper
export async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (response.status === 401) {
    removeToken();
    window.location.href = '/';
  }

  return response;
}

// Auth API functions
export async function login(email: string, password: string): Promise<{ user: User; token: string }> {
  const response = await apiRequest('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Login failed');
  }

  const data = await response.json();
  setToken(data.token);
  return data;
}

export async function register(userData: {
  email: string;
  password: string;
  name: string;
  role: 'mentor' | 'mentee';
}): Promise<{ user: User; token: string }> {
  const response = await apiRequest('/signup', {
    method: 'POST',
    body: JSON.stringify(userData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Registration failed');
  }

  const data = await response.json();
  setToken(data.token);
  return data;
}

export function logout(): void {
  removeToken();
  window.location.href = '/';
}
