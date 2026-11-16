import { useMutation, useQuery } from '@tanstack/react-query';

import { useAuth } from '@/providers/auth-provider';
import type { LoginInput, RegisterInput } from './types';

type SignInInput = { mode: 'login'; input: LoginInput } | { mode: 'signup'; input: RegisterInput };

export function useSignInMutation() {
  const { controller } = useAuth();
  return useMutation({
    mutationFn: async (value: SignInInput) => {
      if (value.mode === 'signup') await controller.register(value.input);
      else await controller.login(value.input);
    },
    retry: false,
    networkMode: 'always',
    gcTime: 0,
  });
}

export function useLogoutMutation() {
  const { controller } = useAuth();
  return useMutation({ mutationFn: controller.logout, retry: false, networkMode: 'always', gcTime: 0 });
}

export function useProfileQuery() {
  const { controller, session } = useAuth();
  return useQuery({
    queryKey: ['auth', 'profile', session.user?.id],
    queryFn: ({ signal }) => controller.profile(signal),
    enabled: session.status === 'signed-in',
    retry: false,
  });
}
