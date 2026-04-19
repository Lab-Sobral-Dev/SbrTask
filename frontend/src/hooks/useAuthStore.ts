import { create } from 'zustand';
import { User, AvatarData } from '../types';
import { auth } from '../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  setAuth: (user: User, token: string) => void;
  updateUser: (user: Partial<User>) => void;
  updateAvatar: (avatar: AvatarData) => void;
  logout: () => void;
  initAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  isInitializing: true,

  setAuth: (user, token) => {
    localStorage.setItem('token', token);
    set({ user, token, isAuthenticated: true });
  },

  updateUser: (userData) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...userData } : null,
    })),

  updateAvatar: (avatar) =>
    set((state) => ({
      user: state.user ? { ...state.user, avatar } : null,
    })),

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  initAuth: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ isInitializing: false });
      return;
    }
    try {
      const response = await auth.me();
      set({ user: response.data, isAuthenticated: true, isInitializing: false });
    } catch {
      localStorage.removeItem('token');
      set({ user: null, token: null, isAuthenticated: false, isInitializing: false });
    }
  },
}));
