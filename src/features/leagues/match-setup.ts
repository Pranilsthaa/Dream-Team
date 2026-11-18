import { apiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/api-error";
import { useAuth } from "@/providers/auth-provider";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import type { Page } from "./api";

export type Team = { id: string; name: string; code: string; logo: string | null };
export const cricketRoles = [
  { id: "BAT", name: "Batter" },
  { id: "BWL", name: "Bowler" },
  { id: "AR", name: "All-rounder" },
  { id: "WK", name: "Wicketkeeper" },
];
export type Player = { id: string; name: string; role: string; age: string | null };
export type Registration = Player & { playerId: string; teamId: string; isActive: boolean };

export function tournamentPath(leagueId: string, tournamentId: string) {
  return `/leagues/${leagueId}/tournaments/${tournamentId}`;
}

export function useSetupList<T>(path: string, enabled = true) {
  const { session } = useAuth();
  return useInfiniteQuery({
    queryKey: ["match-setup", session.user?.id, path],
    enabled: enabled && session.status === "signed-in",
    initialPageParam: 1,
    queryFn: async ({ pageParam, signal }) =>
      (await apiClient.get<Page<T>>(path, { params: { page: pageParam }, signal })).data,
    getNextPageParam: (last) => last.data.length === last.pageSize ? last.page + 1 : undefined,
  });
}

export function useLineupStatus(path: string, enabled: boolean) {
  const { session } = useAuth();
  return useQuery({
    queryKey: ["lineup-status", session.user?.id, path],
    enabled: enabled && session.status === "signed-in",
    queryFn: async ({ signal }) => {
      try {
        return (await apiClient.get<{ overs: number }>(path, { signal })).data;
      } catch (error) {
        if (error instanceof ApiError && error.status === 404 && error.message === "Scorecard has not been set up") {
          return null;
        }
        throw error;
      }
    },
  });
}
