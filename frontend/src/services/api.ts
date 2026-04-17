import axios from 'axios';

const API_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.REACT_APP_API_URL ||
  'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para tratar erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const auth = {
  register: (data: {
    email: string;
    password: string;
    name: string;
    sector: string;
    avatar?: object;
  }) => api.post('/auth/register', data),
  
  login: (email: string, password: string) => 
    api.post('/auth/login', { email, password }),
  
  me: () => api.get('/auth/me'),
  
  getXPProgress: () => api.get('/auth/xp'),
};

// Tasks
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
    xpReward?: number;
  }) => api.post('/tasks', data),
  
  update: (id: string, data: Partial<{
    title: string;
    description: string;
    priority: string;
    status: string;
    dueDate: string;
    category: string;
    xpReward: number;
  }>) => api.put(`/tasks/${id}`, data),
  
  delete: (id: string) => api.delete(`/tasks/${id}`),
  
  complete: (id: string) => api.post(`/tasks/${id}/complete`),
  
  getStats: () => api.get('/tasks/stats'),
};

// Achievements
export const achievements = {
  getAll: () => api.get('/achievements'),
  
  getLeaderboard: (sector?: string) => 
    api.get('/achievements/leaderboard', { params: { sector } }),
};

export default api;
