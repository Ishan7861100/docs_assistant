import axios from 'axios';
import { AuthResponse, ChatRequest, ChatResponse, DocumentMetadata, Settings, User } from '../types';

const BASE_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Inject token into every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const authApi = {
  register: (email: string, password: string, name: string) =>
    api.post<AuthResponse>('/auth/register', { email, password, name }).then(r => r.data),

  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }).then(r => r.data),

  getMe: () => api.get<User>('/auth/me').then(r => r.data),
};

// Documents
export const documentsApi = {
  upload: (file: File, onProgress?: (pct: number) => void) => {
    const formData = new FormData();
    formData.append('file', file);
    return api
      .post<DocumentMetadata>('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: e => {
          if (onProgress && e.total) {
            onProgress(Math.round((e.loaded * 100) / e.total));
          }
        },
      })
      .then(r => r.data);
  },

  list: () => api.get<DocumentMetadata[]>('/documents').then(r => r.data),

  getById: (id: string) => api.get<DocumentMetadata>(`/documents/${id}`).then(r => r.data),

  delete: (id: string) => api.delete(`/documents/${id}`).then(r => r.data),

  reprocess: (id: string) => api.post(`/documents/${id}/reprocess`).then(r => r.data),
};

// Chat
export const chatApi = {
  send: (payload: ChatRequest) =>
    api.post<ChatResponse>('/chat', payload).then(r => r.data),
};

// Settings
export const settingsApi = {
  get: () => api.get<Settings>('/settings').then(r => r.data),
  update: (data: Partial<Settings>) => api.put<{ message: string }>('/settings', data).then(r => r.data),
  reset: () => api.post<{ message: string }>('/settings/reset').then(r => r.data),
};

export default api;
