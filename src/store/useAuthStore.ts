import { create } from 'zustand';
import type { User } from '../types/user';
import { api } from '../services/api';

interface AuthState {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (collegeId: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  initializeAuth: async () => {
    try {
      set({ isLoading: true, error: null });
      const user = await api.getCurrentUser();
      if (user) {
        set({ currentUser: user, isAuthenticated: true, isLoading: false });
      } else {
        set({ currentUser: null, isAuthenticated: false, isLoading: false });
      }
    } catch {
      set({ currentUser: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (collegeId, password) => {
    try {
      set({ isLoading: true, error: null });
      const user = await api.login(collegeId, password);
      set({ currentUser: user, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Login failed', isLoading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('SeatSync_current_user');
    set({ currentUser: null, isAuthenticated: false, error: null });
  },

  updateProfile: async (updates) => {
    const user = get().currentUser;
    if (!user) return;
    const updated = { ...user, ...updates };
    await api.setCurrentUser(updated);
    set({ currentUser: updated });
  }
}));
