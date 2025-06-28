import { browser } from '$app/environment';
import { goto } from '$app/navigation';

// API base URL
export const API_BASE_URL = 'http://localhost:8080/api';

// Token management
export function getToken(): string | null {
  if (!browser) return null;
  return localStorage.getItem('token');
}

export function setToken(token: string): void {
  if (browser) {
    localStorage.setItem('token', token);
  }
}

export function removeToken(): void {
  if (browser) {
    localStorage.removeItem('token');
  }
}

// JWT decode function
export function decodeJWT(token: string): any {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  const token = getToken();
  if (!token) return false;
  
  const decoded = decodeJWT(token);
  if (!decoded) return false;
  
  // Check if token is expired
  const now = Math.floor(Date.now() / 1000);
  return decoded.exp > now;
}

// Get user role from token
export function getUserRole(): string | null {
  const token = getToken();
  if (!token) return null;
  
  const decoded = decodeJWT(token);
  return decoded?.role || null;
}

// API helper function
export async function apiCall(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // If unauthorized, redirect to login
  if (response.status === 401) {
    removeToken();
    if (browser) {
      goto('/login');
    }
  }

  return response;
}

// Auth guard for pages
export function requireAuth(userRole?: string): void {
  if (!browser) return;
  
  if (!isAuthenticated()) {
    goto('/login');
    return;
  }
  
  if (userRole && getUserRole() !== userRole) {
    goto('/profile');
    return;
  }
}
