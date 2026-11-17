import { useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";

import { useStore } from "zustand";

import { authApi } from "@/features/auth/api";
import { SessionController } from "@/features/auth/session-controller";
import { createSessionStorage } from "@/features/auth/session-storage";

const AuthContext = createContext<SessionController | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const client = useQueryClient();
  const [controller] = useState(
    () => new SessionController(authApi, createSessionStorage()),
  );

  useEffect(() => {
    const unsubscribe = controller.store.subscribe((next, previous) => {
      if (previous.user?.id !== next.user?.id) {
        client.cancelQueries();
        client.removeQueries();
      }
    });
    controller.restore();
    return unsubscribe;
  }, [client, controller]);

  return <AuthContext value={controller}>{children}</AuthContext>;
}

export function useAuth() {
  const controller = useContext(AuthContext);
  if (!controller) throw new Error("useAuth requires AuthProvider.");
  const session = useStore(controller.store);
  return { controller, session };
}
