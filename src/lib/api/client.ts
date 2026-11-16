import { create, isCancel, type AxiosInstance } from 'axios';

import { ApiError, toApiError } from './api-error';

function configuredBaseUrl(): string | undefined {
  const url = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (url) return url;
  if (typeof __DEV__ !== 'undefined' && __DEV__) return 'http://localhost:3001/api';
  return undefined;
}

export function createApiClient(baseURL: string | undefined): AxiosInstance {
  const client = create({
    baseURL: baseURL?.replace(/\/+$/, ''),
    timeout: 15_000,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
  });

  client.interceptors.request.use(config => {
    if (!config.baseURL || !/^https?:\/\//i.test(config.baseURL)) {
      throw new ApiError('Set EXPO_PUBLIC_API_URL to the API base URL before connecting.', 0, 'configuration');
    }
    return config;
  });
  client.interceptors.response.use(
    response => response,
    error => Promise.reject(isCancel(error) ? error : toApiError(error)),
  );

  return client;
}

export const apiClient = createApiClient(configuredBaseUrl());
