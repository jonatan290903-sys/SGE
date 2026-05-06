import api from './api';
import { AuthTokens, User } from '../types';

export const authService = {
  async login(email: string, password: string): Promise<AuthTokens> {
    const { data } = await api.post<AuthTokens>('/api/v1/auth/login/', { email, password });
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  },

  async logout(refresh: string): Promise<void> {
    try { await api.post('/api/v1/auth/logout/', { refresh }); } catch {}
    localStorage.clear();
  },

  async getProfile(): Promise<User> {
    const { data } = await api.get<User>('/api/v1/auth/profile/');
    return data;
  },

  async updateProfile(userData: Partial<User>): Promise<User> {
    const { data } = await api.patch<User>('/api/v1/auth/profile/update/', userData);
    localStorage.setItem('user', JSON.stringify(data));
    return data;
  },

  async changePassword(passwordData: any): Promise<{ message: string }> {
    const { data } = await api.post('/api/v1/auth/profile/change-password/', passwordData);
    return data;
  },

  getStoredUser(): User | null {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  },

  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  },

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  },
};
