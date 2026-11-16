import * as SecureStore from 'expo-secure-store';

import { apiClient } from '@/lib/api/client';
import type { SessionStorage } from './session-controller';

const key = 'dream-team.refresh';
const options: SecureStore.SecureStoreOptions = { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY };

export function createSessionStorage(): SessionStorage {
  return {
    async read() {
      const raw = await SecureStore.getItemAsync(key, options);
      if (!raw) return null;
      try {
        const value: unknown = JSON.parse(raw);
        if (value && typeof value === 'object' && 'apiBaseUrl' in value && value.apiBaseUrl === apiClient.defaults.baseURL
          && 'refreshToken' in value && typeof value.refreshToken === 'string' && value.refreshToken.length === 101
          && 'refreshExpiresAt' in value && typeof value.refreshExpiresAt === 'string' && Number.isFinite(Date.parse(value.refreshExpiresAt))) {
          return { refreshToken: value.refreshToken, refreshExpiresAt: value.refreshExpiresAt };
        }
      } catch {
        // Invalid serialized credentials are discarded before contacting the API.
      }
      await SecureStore.deleteItemAsync(key, options);
      return null;
    },
    async write(value) {
      await SecureStore.setItemAsync(key, JSON.stringify({ ...value, apiBaseUrl: apiClient.defaults.baseURL }), options);
    },
    async clear() {
      await SecureStore.deleteItemAsync(key, options);
    },
  };
}
