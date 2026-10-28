import { apiRequest, setAuthToken, removeAuthToken } from './apiClient';
import { AuthResponse, UserProfile, UserSummary } from '../types';

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  studentId?: string;
  phoneNumber?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const authService = {
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const data = await apiRequest<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setAuthToken(data.token);
    return data;
  },

  async login(payload: LoginPayload): Promise<AuthResponse> {
    const data = await apiRequest<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setAuthToken(data.token);
    return data;
  },

  async getMe(): Promise<UserSummary> {
    return apiRequest<UserSummary>('/api/auth/me');
  },

  async getProfile(): Promise<UserProfile> {
    return apiRequest<UserProfile>('/api/users/me/profile');
  },

  logout(): void {
    removeAuthToken();
  },
};
