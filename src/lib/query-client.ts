import { QueryClient } from '@tanstack/react-query';

import { ApiError } from './api/api-error';

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: (failureCount, error) => failureCount < 1 && error instanceof ApiError && (
          error.kind === 'network' || error.kind === 'timeout' || error.status >= 500
        ),
      },
      mutations: {
        retry: false,
        gcTime: 0,
      },
    },
  });
}
