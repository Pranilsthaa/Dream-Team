import { useAuth } from "@/providers/auth-provider";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { create } from "zustand";
import { leagueApi } from "./api";

export const useLeagueSelection = create<{
  id: string | null;
  select: (id: string) => void;
}>((set) => ({ id: null, select: (id) => set({ id }) }));

export function useLeagues() {
  const { session } = useAuth();
  return useInfiniteQuery({
    queryKey: ["leagues", session.user?.id],
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) => leagueApi.list(pageParam, signal),
    getNextPageParam: (last) =>
      last.data.length === last.pageSize ? last.page + 1 : undefined,
    enabled: session.status === "signed-in",
  });
}
export function useSelectedLeague() {
  const query = useLeagues();
  const id = useLeagueSelection((state) => state.id);
  const select = useLeagueSelection((state) => state.select);
  const leagues = query.data?.pages.flatMap((page) => page.data) ?? [];
  return {
    query,
    leagues,
    league: leagues.find((league) => league.id === id) ?? leagues[0],
    select,
  };
}
export function useTournaments(leagueId?: string) {
  const { session } = useAuth();
  return useInfiniteQuery({
    queryKey: ["tournaments", session.user?.id, leagueId],
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      leagueApi.tournaments(leagueId!, pageParam, signal),
    getNextPageParam: (last) =>
      last.data.length === last.pageSize ? last.page + 1 : undefined,
    enabled: Boolean(leagueId) && session.status === "signed-in",
  });
}
export function useMatches() {
  return useQuery({
    queryKey: ["matches"],
    queryFn: ({ signal }) => leagueApi.matches(signal),
  });
}
