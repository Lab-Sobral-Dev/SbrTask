import axios from 'axios';

const API_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.REACT_APP_API_URL ||
  'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export const auth = {
  login: (username: string, password: string) => api.post('/auth/login', { username, password }),
  me: () => api.get('/auth/me'),
};

export type UserRecord = {
  id: string;
  adUsername: string;
  name: string;
  email: string | null;
  department: string | null;
  role: string;
  active: boolean;
  lastLoginAt: string | null;
};

export const users = {
  getAll: () => api.get<UserRecord[]>('/auth/users'),
  update: (id: string, data: { role?: string; active?: boolean }) =>
    api.patch<{ id: string; role: string; active: boolean }>(`/auth/users/${id}`, data),
};

export const tasks = {
  getAll: (params?: { status?: string; priority?: string; category?: string }) =>
    api.get('/tasks', { params }),

  getById: (id: string) => api.get(`/tasks/${id}`),

  create: (data: {
    title: string;
    description?: string;
    priority?: string;
    dueDate?: string;
    category?: string;
    xpReward: number;
    assigneeIds: string[];
  }) => api.post('/tasks', data),

  update: (
    id: string,
    data: Partial<{
      title: string;
      description: string;
      priority: string;
      dueDate: string;
      category: string;
      xpReward: number;
    }>,
  ) => api.put(`/tasks/${id}`, data),

  delete: (id: string) => api.delete(`/tasks/${id}`),

  updateAssignment: (taskId: string, status: string) =>
    api.patch(`/tasks/${taskId}/assignment`, { status }),

  approveAssignment: (taskId: string, userId: string) =>
    api.patch(`/tasks/${taskId}/assignment/${userId}/approve`),

  getStats: () => api.get('/tasks/stats'),
};

export const notifications = {
  getAll: () =>
    api.get<
      { id: string; type: string; message: string; read: boolean; taskId?: string; createdAt: string }[]
    >('/notifications'),
  markAllRead: () => api.patch('/notifications/read-all'),
};

export const achievements = {
  getAll: () => api.get('/achievements'),
  getLeaderboard: (sector?: string, period?: string) =>
    api.get('/achievements/leaderboard', { params: { sector, period } }),
  create: (data: {
    name: string;
    description: string;
    icon: string;
    requirement: number;
    type: string;
    xpReward: number;
  }) => api.post('/achievements', data),
  update: (
    id: string,
    data: Partial<{
      name: string;
      description: string;
      icon: string;
      requirement: number;
      type: string;
      xpReward: number;
    }>,
  ) => api.put(`/achievements/${id}`, data),
  delete: (id: string) => api.delete(`/achievements/${id}`),
};

export default api;
