import type { AxiosInstance } from 'axios';

import { apiClient, publicApiClient } from '@/lib/api/client';
import type {
  AuthTokensResponse,
  LoginInput,
  ProfileResponse,
  RefreshInput,
  RegisterInput,
} from './types';

export function createAuthApi(client: AxiosInstance, protectedClient: AxiosInstance = client) {
  return {
    async register({ username, email, password }: RegisterInput): Promise<AuthTokensResponse> {
      const { data } = await client.post<AuthTokensResponse>('/auth/register', {
        username: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        password,
      });
      return data;
    },

    async login({ email, password }: LoginInput): Promise<AuthTokensResponse> {
      const { data } = await client.post<AuthTokensResponse>('/auth/login', {
        email: email.trim().toLowerCase(),
        password,
      });
      return data;
    },

    /** Call once per rotation and replace stored credentials with the response. */
    async refresh({ refreshToken }: RefreshInput): Promise<AuthTokensResponse> {
      const { data } = await client.post<AuthTokensResponse>('/auth/refresh', { refreshToken });
      return data;
    },

    async logout({ refreshToken }: RefreshInput): Promise<void> {
      await client.post<void>('/auth/logout', { refreshToken });
    },

    async me(signal?: AbortSignal): Promise<ProfileResponse> {
      const { data } = await protectedClient.get<ProfileResponse>('/auth/me', {
        signal,
      });
      return data;
    },
  };
}

export const authApi = createAuthApi(publicApiClient, apiClient);
