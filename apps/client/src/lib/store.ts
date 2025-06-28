import { writable } from 'svelte/store';
import type { User } from './auth';

// Current view/page state
export const currentView = writable<string>('home');

// User state
export const user = writable<User | null>(null);

// Loading state
export const isLoading = writable<boolean>(false);

// Error state
export const error = writable<string | null>(null);

// Set view
export function setView(view: string) {
  currentView.set(view);
  error.set(null);
}

// Set user
export function setUser(userData: User | null) {
  user.set(userData);
}

// Set loading state
export function setLoading(loading: boolean) {
  isLoading.set(loading);
}

// Set error
export function setError(message: string | null) {
  error.set(message);
}
