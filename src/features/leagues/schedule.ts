import { apiClient } from "@/lib/api/client";
import { useAuth } from "@/providers/auth-provider";
import { useInfiniteQuery } from "@tanstack/react-query";
import type { Match, Page } from "./api";

type FixtureTeam = Omit<Match["team1"], "logo"> & { id: string; logo: string | null };
export type Fixture = Omit<Match, "team1" | "team2"> & {
  team1: FixtureTeam;
  team2: FixtureTeam;
};

type SchedulePage = Page<Fixture> & {
  tournamentId: string;
  name: string;
  timezone: string;
  publishedAt: string | null;
};

export function useStaffSchedule(leagueId: string, tournamentId: string) {
  const { session } = useAuth();
  return useInfiniteQuery({
    queryKey: ["staff-schedule", session.user?.id, leagueId, tournamentId],
    enabled: session.status === "signed-in",
    initialPageParam: 1,
    queryFn: async ({ pageParam, signal }) => {
      const { data } = await apiClient.get<SchedulePage>(
        `/leagues/${leagueId}/tournaments/${tournamentId}/schedule`,
        { params: { page: pageParam }, signal },
      );
      return data;
    },
    getNextPageParam: (last) =>
      last.data.length === last.pageSize ? last.page + 1 : undefined,
  });
}
