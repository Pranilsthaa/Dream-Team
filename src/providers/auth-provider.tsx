import { useQueryClient } from '@tanstack/react-query';
import { createContext, useContext, useEffect, useState, useSyncExternalStore, type PropsWithChildren } from 'react';

import { authApi } from '@/features/auth/api';
import { SessionController, type SessionSnapshot } from '@/features/auth/session-controller';
import { createSessionStorage } from '@/features/auth/session-storage';

const AuthContext = createContext<{ controller: SessionController; session: SessionSnapshot } | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const client = useQueryClient();
  const [controller] = useState(() => new SessionController(authApi, createSessionStorage()));
  const session = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);

  useEffect(() => {
    let previousUser = controller.getSnapshot().user?.id;
    const unsubscribe = controller.subscribe(() => {
      const nextUser = controller.getSnapshot().user?.id;
      if (previousUser !== nextUser) {
        void client.cancelQueries();
        client.removeQueries();
        previousUser = nextUser;
      }
    });
    void controller.restore();
    return unsubscribe;
  }, [client, controller]);

  return <AuthContext value={{ controller, session }}>{children}</AuthContext>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth requires AuthProvider.');
  return context;
}
